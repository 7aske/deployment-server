import * as child_process from 'child_process';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { resolve } from 'url';
import { rejects } from 'assert';
import { log } from 'util';
/**
 @property {string} repo - Location of the GitHub repository eg https://www.github.com/user/repo.
 @property {string} name - Repository name parsed from its URL.
 @property {string} id - ID generated automatically with shortid.
 @property {string} dir - Server directory of the cloned repository "{repoDir}/{name}".
 @property {string} platform - Server platform.
 @property {number} port - Port assigned to child server. Assigned after "run" command. Default 3000.
 @property {child_process.ChildProcess} process Reference to the ChildProcess object running on the machine.
 @property {number} pid Process ID assigned to child server. Assigned after "run" command.
 @property {string} action - Set to action used to fetch repo from GitHub. Either "pull" or "clone".
 @property {Array<string>} messages Messages sent to stdout during retrieve/install/run.
 @property {Array<string>} errors Errors sent to strderr during retrieve/install/run.
 @property {object} dependencies Dependencies read from package.json file.
 */

export interface ChildServer {
	repo: string;
	name: string;
	id: string;
	dir: string;
	platform: string;
	messages: Array<string>;
	errors: Array<string>;
	port?: number | void;
	process?: child_process.ChildProcess;
	pid?: number | void;
	action?: string;
	dependencies?: object;
}
/**
 @property {object} dependencies Dependencies set from package.json file.
 @property {string} main Main app entry point set from package.json file.
 @property {string} name Name of the app.
 */
export interface childPackageJSON {
	dependencies: object;
	main: string;
	name: string;
}
/**
 @property {Array<ChildServer>} children - Array of ChildServer instances.
 */
export interface childrenJSON {
	children: Array<ChildServer>;
}

export default class App {
	protected childPort: number; // starting port for child servers
	protected children: Array<ChildServer>; // array of active child servers
	public repoDir: string; // name of child repository folder
	protected childrenJSON: string; // json file to store all installed child servers
	protected defaultExpressServer: string; // location of a simple code for a basic express server;
	protected HTMLRegExp: RegExp;
	constructor(PORT: number) {
		this.children = [];
		this.repoDir = 'public';
		this.childrenJSON = `${this.repoDir}/children.json`;
		this.defaultExpressServer = 'resources/server.js';
		this.childPort = PORT + 1;
		this.HTMLRegExp = new RegExp(/\.(html)$/i);
		this.init();
	}
	protected init() {
		if (!fs.existsSync(this.repoDir)) {
			if (process.env.NODE_ENV == 'dev') console.log('Creating', this.repoDir, 'dir');
			fs.mkdirSync(this.repoDir);
			fs.writeFileSync(
				path.join(process.cwd(), this.childrenJSON),
				JSON.stringify({
					children: []
				}),
				'utf8'
			);
		} else {
			if (process.env.NODE_ENV == 'dev') console.log('Updating', this.childrenJSON, 'file');
			this.updateChildrenJSON();
			this.sortChildrenJSON();
		}
	}
	public retrieve(child: ChildServer): Promise<any> {
		//let childrenJSON: any = JSON.parse(fs.readFileSync(this.childrenJSON, 'utf8'));
		return new Promise((resolve, reject) => {
			// check if the folder already exists to decide if pull or clone
			const pull: boolean = fs.existsSync(path.join(process.cwd(), child.dir));
			if (process.env.NODE_ENV == 'dev') console.log(pull ? 'Pulling' : 'Cloning', child.repo);
			const git: child_process.ChildProcess = pull
				? child_process.execFile('git', [`pull`], {
						cwd: path.join(process.cwd(), child.dir)
				  })
				: child_process.execFile('git', ['clone', child.repo], {
						cwd: path.join(process.cwd(), this.repoDir)
				  });
			// const git: child_process.ChildProcess = pull
			// 	? child_process.exec(`cd ./${child.dir} && git pull`)
			// 	: child_process.exec(`cd ./${this.repoDir} && git clone ${child.repo}`);
			child.action = pull ? 'pull' : 'clone';
			if (process.env.NODE_ENV == 'dev') {
				//pipe output to main process for debugging
				git.stderr.pipe(process.stdout);
				git.stdout.pipe(process.stdout);
			}

			git.stderr.on('data', data => {
				child = this.formatStdOut(data, child);
			});

			git.stdout.on('data', data => {
				child = this.formatStdOut(data, child);
			});
			git.on('exit', (code, signal) => {
				if (process.env.NODE_ENV == 'dev') console.log('NPM process exited with code', code);
				if (code == 0 && child.errors.length == 0) {
					resolve(child);
				} else {
					reject(child);
				}
			});
		});
	}
	public install(child: ChildServer): Promise<ChildServer> {
		return new Promise((resolve, reject) => {
			// npm doesnt seem to work with spawn
			// --prefix makes a lot of junk files
			// let childrenJSON: childrenJSON = JSON.parse(
			// 	fs.readFileSync(path.join(process.cwd(), this.childrenJSON), 'utf8')
			// );
			if (fs.existsSync(`./${child.dir}/package.json`)) {
				const childPackageJSON: childPackageJSON = JSON.parse(
					fs.readFileSync(path.join(process.cwd(), `${child.dir}/package.json`), 'utf8')
				);
				if (childPackageJSON.dependencies) {
					child.dependencies = childPackageJSON.dependencies;
					//const npm = child_process.exec(`cd .. && cd ./${child.dir} && echo %cd%`);
					//const npm = child_process.execFile('npm', ['install'], { cwd: path.join(process.cwd(), child.dir) });
					const npm = child_process.exec(`cd ./${child.dir} && npm install`);
					if (process.env.NODE_ENV == 'dev') {
						//pipe output to main process for debugging
						npm.stderr.pipe(process.stdout);
						npm.stdout.pipe(process.stdout);
					}
					npm.stderr.on('data', data => {
						child = this.formatStdOut(data, child);
					});
					npm.stdout.on('data', data => {
						child = this.formatStdOut(data, child);
					});
					npm.on('close', (code, signal) => {
						if (process.env.NODE_ENV == 'dev') console.log('NPM process exited with code', code);
						if (code == 0 && child.errors.length == 0) {
							resolve(child);
						} else {
							reject(child);
						}
					});
				} else {
					child.messages.push('NPM found no dependencies.');
					resolve(child);
				}
			} else {
				child.errors.push('Invalid package.json file');
				reject(child);
			}
		});
	}
	public run(child: ChildServer): Promise<ChildServer> {
		return new Promise(async (resolve, reject) => {
			//const checkIfRunning = this.children.find(i => i.name == child.name || i.id == child.id);
			if (fs.existsSync(`./${child.dir}/package.json`)) {
				const childPackageJSON: childPackageJSON = JSON.parse(
					fs.readFileSync(path.join(process.cwd(), `${child.dir}/package.json`), 'utf8')
				);
				if (childPackageJSON.main) {
					let main = childPackageJSON.main;
					const port: number = this.getPort(child);
					if (this.serverRunning(child.id)) {
						child.errors.push('Server with that ID/Name is already running');
						reject(child);
					} else {
						//if entry point is an html file open a basic static server
						if (this.HTMLRegExp.test(main)) {
							const serverCode: string = fs.readFileSync(
								path.join(process.cwd(), this.defaultExpressServer),
								'utf8'
							);
							fs.writeFileSync(path.join(process.cwd(), `${child.dir}/server.js`), serverCode, 'utf8');
							//change entry point accordingly
							main = 'server.js';
						}
						if (await this.runTest(child, port, main)) {
							if (process.env.NODE_ENV == 'dev') console.log('Tests return true');
							let node: child_process.ChildProcess;
							//TODO: c9 integration
							node = child_process.execFile('node', [main], {
								cwd: path.join(process.cwd(), child.dir),
								env: { PORT: port }
							});
							if (process.env.NODE_ENV == 'dev') {
								//pipe output to main process for debugging
								node.stderr.pipe(process.stdout);
								node.stdout.pipe(process.stdout);
							}
							child.port = port;
							this.setChildToJSON(child);
							child.pid = node.pid;
							child.process = node;
							this.children.push(child);
							resolve(child);
						} else {
							if (process.env.NODE_ENV == 'dev') console.log('Tests return false');
							child.errors.push('There is something wrong.');
							reject(child);
						}
					}
				} else {
					child.errors.push('Invalid package.json entry point.');
					reject(child);
				}
			} else {
				child.errors.push('Invalid package.json file');
				reject(child);
			}
		});
	}
	protected runTest(child: ChildServer, port: number, main: string): Promise<boolean> {
		if (process.env.NODE_ENV == 'dev') console.log('Running tests on', child.name, 'repo');
		return new Promise((resolve, reject) => {
			//preform a test
			let node: child_process.ChildProcess;
			//TODO: c9 integration
			node = child_process.execFile('node', [main], {
				cwd: path.join(process.cwd(), child.dir),
				env: { PORT: port }
			});
			if (process.env.NODE_ENV == 'dev') {
				//pipe output to main process for debugging
				node.stderr.pipe(process.stdout);
				node.stdout.pipe(process.stdout);
			}
			setTimeout(() => {
				if (!node.killed) {
					if (process.env.NODE_ENV == 'dev') console.log('Killing node process');
					node.kill();
				}
			}, 2000);
			node.on('close', (code, signal) => {
				if (code == 1) reject(false);
				else if ((signal = 'SIGTERM')) resolve(true);
				else reject(false);
			});
		});
	}
	public remove(child: ChildServer | null): Promise<ChildServer> | Promise<any> {
		return new Promise((resolve, reject) => {
			if (child) {
				// const childrenJSON: childrenJSON = JSON.parse(
				// 	fs.readFileSync(path.join(process.cwd(), this.childrenJSON), 'utf8')
				// );
				// const index = childrenJSON.children.indexOf(child);
				if (this.serverRunning(child.id)) {
					// @ts-ignore
					const runningChild: ChildServer | null = this.getRunningChildren(child.id);
					runningChild ? this.killChild(runningChild) : reject(child);
				}
				let error: boolean = false;

				const rm: child_process.ChildProcess = child_process.exec(`rm -r -f ${path.join(process.cwd(), child.dir)}`);
				if (process.env.NODE_ENV == 'dev') {
					//pipe output to main process for debugging
					rm.stderr.pipe(process.stdout);
					rm.stdout.pipe(process.stdout);
				}
				rm.stderr.on('data', data => {
					child.errors.push(data.toString());
					error = true;
				});
				rm.stdout.on('data', data => {
					child.messages.push(data.toString());
				});
				rm.on('error', data => {
					child.errors.push(data.message);
					error = true;
				});
				rm.on('close', data => {
					if (error) reject(child);
					else {
						// childrenJSON.children.splice(index, 1);
						// fs.writeFileSync(path.join(process.cwd(), this.childrenJSON), JSON.stringify(childrenJSON), 'utf8');
						this.updateChildrenJSON();
						resolve(child);
					}
				});
			} else {
				reject({
					errors: ['Invalid child object']
				});
			}
		});
	}
	protected getPort(child: ChildServer): number {
		//if child doesnt have predefined port
		//find first available port by searching through children.json children array
		const childrenJSON: childrenJSON = JSON.parse(fs.readFileSync(path.join(process.cwd(), this.childrenJSON), 'utf8'));
		if (childrenJSON.children.length == 0) return this.childPort;
		if (child.port) {
			return child.port;
		} else {
			for (let i = 0; i < childrenJSON.children.length; i++) {
				if (this.childPort != childrenJSON.children[i].port) break;
				else this.childPort++;
			}
			return this.childPort;
		}
	}
	protected serverRunning(query: string | number): boolean {
		const child: ChildServer | undefined = this.children.find(c => c.id == query || c.name == query || c.pid == query);
		if (child) return true;
		else return false;
	}
	protected setChildToJSON(newChild: ChildServer): void {
		const childrenJSON: childrenJSON = JSON.parse(fs.readFileSync(path.join(process.cwd(), this.childrenJSON), 'utf8'));
		const child: ChildServer | undefined = childrenJSON.children.find(c => {
			return c.id == newChild.id;
		});
		// if child exists update it;
		if (child) {
			const index = childrenJSON.children.indexOf(child);
			childrenJSON.children.splice(index, 1, newChild);
		} else {
			childrenJSON.children.push(newChild);
		}
		fs.writeFileSync(path.join(process.cwd(), this.childrenJSON), JSON.stringify(childrenJSON), 'utf8');
	}
	public getChildrenFromJSON(query: string | null): Array<ChildServer> {
		// get the information about a repo from repos folder using childs.json
		const childrenJSON: childrenJSON = JSON.parse(fs.readFileSync(path.join(process.cwd(), this.childrenJSON), 'utf8'));
		let result: Array<ChildServer> = [];
		if (typeof query == 'string') {
			result = childrenJSON.children.filter(child => {
				return child.id == query || child.name == query;
			});
		} else if (query == null) {
			result = childrenJSON.children;
		} else {
			result = [];
		}
		return result;
	}
	protected updateChildrenJSON(): void {
		// update children.json
		let result: Array<any> = [];
		const repos: Array<string> = fs.readdirSync(this.repoDir, 'utf8');
		let childrenJSON: childrenJSON = JSON.parse(fs.readFileSync(this.childrenJSON, 'utf8'));
		childrenJSON.children.forEach(i => {
			if (repos.indexOf(i.name) != -1) result.push(i);
		});
		this.childPort = 3001;
		fs.writeFileSync(path.join(process.cwd(), this.childrenJSON), JSON.stringify({ children: result }), 'utf8');
	}

	protected sortChildrenJSON(): void {
		let childrenJSON: childrenJSON = JSON.parse(fs.readFileSync(path.join(process.cwd(), this.childrenJSON), 'utf8'));
		if (childrenJSON.children.length > 1) {
			childrenJSON.children.sort((a: ChildServer, b: ChildServer) => {
				// @ts-ignore
				if (a.port > b.port) {
					return 1;
				}
				// @ts-ignore
				if (a.port < b.port) {
					return -1;
				}
				return 0;
			});
			fs.writeFileSync(path.join(process.cwd(), this.childrenJSON), JSON.stringify(childrenJSON), 'utf8');
		}
	}
	public getRunningChildren(query: string | number | null): Array<ChildServer> | ChildServer | null {
		let result: Array<ChildServer> = [];
		if (typeof query == 'string') {
			const child = this.children.find(child => child.id == query || child.name == query);
			return child ? child : null;
		}
		if (typeof query == 'number') {
			const child = this.children.find(child => child.pid == query);
			return child ? child : null;
		}
		return this.children;
	}
	// public killChild(query: string | number | null): Array<ChildServer> {
	// 	// kill running instance process by PID | Name | ID
	// 	let result: Array<ChildServer> = [];
	// 	const children: Array<ChildServer> = this.getRunningChild(query);
	// 	//TODO: c9 integration
	// 	//child_process.exec(`pkill -P ${instance.pid}`);
	// 	if (children.length > 0) {
	// 		children.forEach(child => {
	// 			child.process!.kill();
	// 			if (child.process!.killed) {
	// 				result.push(this.formatChild(child));
	// 			}
	// 		});
	// 		this.children = this.children.filter(child => {
	// 			return !child.process!.killed;
	// 		});
	// 		return result;
	// 	} else {
	// 		return result;
	// 	}
	// }
	public killChild(child: ChildServer): Promise<ChildServer> {
		// kill running instance process by PID | Name | ID
		console.log('killing');

		return new Promise((resolve, reject) => {
			child.process!.kill();
			if (child.process!.killed) {
				this.children.splice(this.children.indexOf(child), 1);
				resolve(this.formatChild(child));
			} else {
				reject(this.formatChild(child));
			}
		});
	}
	protected formatStdOut(stdout: string | Buffer, child: ChildServer): ChildServer {
		//format stdout to differentiate between errors and messages
		const data = stdout.toString();
		if (data.indexOf('fatal') != -1 || data.indexOf('ERR') != -1) {
			child.errors.push(data);
		} else {
			child.messages.push(data);
		}
		return child;
	}
	public formatChild(child: ChildServer): ChildServer {
		//format server output to avoid JSON parse circular JSON exceptions
		return {
			repo: child.repo,
			name: child.name,
			dir: child.dir,
			id: child.id,
			platform: child.platform,
			dependencies: child.dependencies,
			messages: child.messages,
			errors: child.errors,
			action: child.action,
			port: child.port,
			pid: child.pid
		};
	}
	public cleanExit(): any {
		// @ts-ignore
		const children: Array<ChildServer> | null = this.getRunningChildren(null);
		if (children) {
			// @ts-ignore
			children.forEach(child => {
				this.killChild(child);
			});
		}
		//console.log(`Killing ${result.length} child server processses.`);
		process.exit();
	}
}
