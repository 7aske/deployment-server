import { ChildProcess, spawn, execFile, exec } from "child_process";
import { writeFileSync, existsSync, readFileSync, mkdirSync, readdirSync } from "fs";
import { platform } from "os";
import { join } from "path";
/**
 @property {string} repo - Location of the GitHub repository eg https://www.github.com/user/repo.
 @property {string} name - Repository name parsed from its URL.
 @property {string} id - ID generated automatically with shortid.
 @property {string} dir - Server directory of the cloned repository "{repoDir}/{name}".
 @property {string} platform - Server platform.
 @property {number} port - Port assigned to child server. Assigned after "run" command. Default 3000.
 @property {ChildProcess} process Reference to the ChildProcess object running on the machine.
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
	dateDeployed?: Date;
	dateLastUpdated?: Date;
	dateLastRun?: Date;
	port?: number | void;
	process?: ChildProcess;
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
interface PATHS {
	node: string;
	npm: string;
}
export default class App {
	protected childPort: number; // starting port for child servers
	protected children: Array<ChildServer>; // array of active child servers
	public repoDir: string; // name of child repository folder
	protected childrenJSON: string; // json file to store all installed child servers
	protected defaultExpressServer: string; // location of a simple code for a basic express server;
	protected HTMLRegExp: RegExp;
	protected PATHS: PATHS;
	constructor(PORT: number, PATHS: PATHS) {
		this.PATHS = PATHS;
		this.children = [];
		this.repoDir = "public";
		this.childrenJSON = `${this.repoDir}/children.json`; // children.json filepath
		this.defaultExpressServer = "resources/server.js";
		this.childPort = PORT + 1;
		this.HTMLRegExp = new RegExp(/\.(html)$/i);
		this.init();
	}
	protected init() {
		if (!existsSync(this.repoDir)) {
			mkdirSync(this.repoDir);
			writeFileSync(
				join(process.cwd(), this.childrenJSON),
				JSON.stringify({
					children: []
				}),
				"utf8"
			);
		} else {
			this.updateChildrenJSON();
			this.sortChildrenJSON();
		}
	}
	public retrieve(child: ChildServer): Promise<any> {
		//let childrenJSON: any = JSON.parse(readFileSync(this.childrenJSON, 'utf8'));
		return new Promise((resolve, reject) => {
			// check if the folder already exists to decide whether pull or clone
			const pull: boolean = existsSync(join(process.cwd(), child.dir));
			const git: ChildProcess = pull
				? execFile("git", [`pull`], {
						cwd: join(process.cwd(), child.dir)
				  })
				: execFile("git", ["clone", child.repo], {
						cwd: join(process.cwd(), this.repoDir)
				  });
			child.action = pull ? "pull" : "clone";

			if (process.env.NODE_ENV == "dev") {
				//pipe output to main process for debugging
				git.stderr.pipe(process.stdout);
				git.stdout.pipe(process.stdout);
			}

			git.stderr.on("data", data => {
				child = this.formatStdOut(data, child);
			});

			git.stdout.on("data", data => {
				child = this.formatStdOut(data, child);
			});
			git.on("close", (code, signal) => {
				if (process.env.NODE_ENV == "dev") console.log("Git process exited with code", code);
				if (code == 0 && child.errors.length == 0) {
					pull ? (child.dateLastUpdated = new Date()) : (child.dateDeployed = new Date());
					resolve(child);
				} else {
					reject(this.formatChildErrors(child));
				}
			});
		});
	}
	public install(child: ChildServer): Promise<ChildServer> {
		return new Promise((resolve, reject) => {
			// npm doesnt seem to work with spawn
			// --prefix makes a lot of junk files
			if (existsSync(`./${child.dir}/package.json`)) {
				const childPackageJSON: childPackageJSON = JSON.parse(
					readFileSync(join(process.cwd(), `${child.dir}/package.json`), "utf8")
				);
				if (childPackageJSON.dependencies) {
					child.dependencies = childPackageJSON.dependencies;
					const npm = spawn(this.PATHS.npm, ["install"], {
						cwd: join(process.cwd(), child.dir)
					});
					if (process.env.NODE_ENV == "dev") {
						//pipe output to main process for debugging
						npm.stderr.pipe(process.stdout);
						npm.stdout.pipe(process.stdout);
					}
					npm.stderr.on("data", data => {
						child = this.formatStdOut(data, child);
					});
					npm.stdout.on("data", data => {
						child = this.formatStdOut(data, child);
					});
					npm.on("close", (code, signal) => {
						if (process.env.NODE_ENV == "dev") console.log("NPM process exited with code", code);
						if (code == 0 && child.errors.length == 0) {
							child.dateLastUpdated = new Date();
							this.setChildToJSON(child);
							resolve(child);
						} else {
							reject(this.formatChildErrors(child));
						}
					});
				} else {
					child.messages.push("NPM found no dependencies.");
					resolve(this.formatChildErrors(child));
				}
			} else {
				child.errors.push("Invalid package.json file");
				reject(this.formatChildErrors(child));
			}
		});
	}
	public run(child: ChildServer): Promise<ChildServer> {
		return new Promise(async (resolve, reject) => {
			//const checkIfRunning = this.children.find(i => i.name == child.name || i.id == child.id);
			if (existsSync(`./${child.dir}/package.json`)) {
				const childPackageJSON: childPackageJSON = JSON.parse(
					readFileSync(join(process.cwd(), `${child.dir}/package.json`), "utf8")
				);
				if (childPackageJSON.main) {
					let main = childPackageJSON.main;
					const port: number = this.getPort(child);
					if (this.serverRunning(child.id)) {
						child.errors.push("Server with that ID/Name is already running");
						reject(this.formatChildErrors(child));
					} else {
						//if entry point is an html file open a basic static server
						if (this.HTMLRegExp.test(main)) {
							const serverCode: string = readFileSync(
								join(process.cwd(), this.defaultExpressServer),
								"utf8"
							);
							writeFileSync(join(process.cwd(), `${child.dir}/server.js`), serverCode, "utf8");
							//change entry point accordingly
							main = "server.js";
						}
						if (await this.runTest(child, port, main)) {
							if (process.env.NODE_ENV == "dev") console.log("Tests return true");
							let node: ChildProcess;
							//TODO: c9 integration
							node = execFile(this.PATHS.node, [main], {
								cwd: join(process.cwd(), child.dir),
								env: { PORT: port }
							});
							if (process.env.NODE_ENV == "dev") {
								//pipe output to main process for debugging
								node.stderr.pipe(process.stdout);
								node.stdout.pipe(process.stdout);
							}
							child.dateLastRun = new Date();
							child.port = port;
							this.setChildToJSON(child);
							child.pid = node.pid;
							child.process = node;
							this.children.push(child);
							resolve(child);
						} else {
							if (process.env.NODE_ENV == "dev") console.log("Tests return false");
							child.errors.push("There is something wrong.");
							reject(this.formatChildErrors(child));
						}
					}
				} else {
					child.errors.push("Invalid package.json entry point.");
					reject(this.formatChildErrors(child));
				}
			} else {
				child.errors.push("Invalid package.json file");
				reject(this.formatChildErrors(child));
			}
		});
	}
	protected runTest(child: ChildServer, port: number, main: string): Promise<boolean> {
		if (process.env.NODE_ENV == "dev") console.log("Running tests on", child.name, "repo");
		return new Promise((resolve, reject) => {
			//preform a test
			let node: ChildProcess = execFile(this.PATHS.node, [main], {
				cwd: join(process.cwd(), child.dir),
				env: { PORT: port }
			});
			if (process.env.NODE_ENV == "dev") {
				//pipe output to main process for debugging
				node.stderr.pipe(process.stdout);
				node.stdout.pipe(process.stdout);
			}
			setTimeout(() => {
				if (!node.killed) {
					if (process.env.NODE_ENV == "dev") console.log("Killing node process");
					node.kill();
				}
			}, 2000);
			node.on("close", (code, signal) => {
				if (code == 1) reject(false);
				else if ((signal = "SIGTERM")) resolve(true);
				else reject(false);
			});
		});
	}
	public remove(child: ChildServer | null): Promise<ChildServer> | Promise<any> {
		return new Promise((resolve, reject) => {
			if (child) {
				if (this.serverRunning(child.id)) {
					// @ts-ignore
					const runningChild: ChildServer | null = this.getRunningChildren(child.id);
					runningChild ? this.killChild(runningChild) : reject(this.formatChildErrors(child));
				}
				let error: boolean = false;

				let rm: ChildProcess;
				if (platform() == "win32") {
					rm = exec(`rd /s /q ${join(process.cwd(), child.dir)}`);
				} else if (platform() == "linux" || platform() == "darwin") {
					rm = exec(`rm -r -f ${join(process.cwd(), child.dir)}`);
				} else {
					return reject({
						errors: ["Unsupported platform"]
					});
				}
				if (process.env.NODE_ENV == "dev") {
					//pipe output to main process for debugging
					rm.stderr.pipe(process.stdout);
					rm.stdout.pipe(process.stdout);
				}
				rm.stderr.on("data", data => {
					child.errors.push(data.toString());
					error = true;
				});
				rm.stdout.on("data", data => {
					child.messages.push(data.toString());
				});
				rm.on("error", data => {
					child.errors.push(data.message);
					error = true;
				});
				rm.on("close", data => {
					if (error) reject(this.formatChildErrors(child));
					else {
						this.updateChildrenJSON();
						resolve(child);
					}
				});
			} else {
				reject({
					errors: ["Invalid child object"]
				});
			}
		});
	}
	public clear(query: string | null) {
		let childrenJSON: childrenJSON = JSON.parse(readFileSync(join(process.cwd(), this.childrenJSON), "utf8"));
		if (typeof query == "string") {
			childrenJSON.children.forEach(child => {
				if (child.id == query || child.name == query) {
					child.messages = [];
					child.errors = [];
				}
			});
			this.children.forEach(child => {
				if (child.id == query || child.name == query) {
					child.messages = [];
					child.errors = [];
				}
			});
		} else {
			childrenJSON.children.forEach(child => {
				child.messages = [];
				child.errors = [];
			});
			this.children.forEach(child => {
				child.messages = [];
				child.errors = [];
			});
		}
		writeFileSync(join(process.cwd(), this.childrenJSON), JSON.stringify(childrenJSON), "utf8");
		return true;
	}
	public browse(query: string | null): Array<ChildServer> {
		const childrenJSON: childrenJSON = JSON.parse(readFileSync(join(process.cwd(), this.childrenJSON), "utf8"));
		const result: Array<ChildServer> = [];
		if (typeof query == "string") {
			const child = childrenJSON.children.find(child => {
				return child.id == query || child.name == query;
			});
			console.log(childrenJSON.children);
			if (child) result.push(child);
			if (result.length > 0) return result;
			else return [];
		} else {
			return childrenJSON.children;
		}
	}
	protected getPort(child: ChildServer): number {
		//if child doesnt have predefined port
		//find first available port by searching through children.json children array
		const childrenJSON: childrenJSON = JSON.parse(readFileSync(join(process.cwd(), this.childrenJSON), "utf8"));
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
		const child: ChildServer | undefined = this.children.find(
			c => c.id == query || c.name == query || c.pid == query
		);
		if (child) return true;
		else return false;
	}
	protected setChildToJSON(newChild: ChildServer): void {
		const childrenJSON: childrenJSON = JSON.parse(readFileSync(join(process.cwd(), this.childrenJSON), "utf8"));
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
		writeFileSync(join(process.cwd(), this.childrenJSON), JSON.stringify(childrenJSON), "utf8");
	}
	public getChildrenFromJSON(query: string | null): Array<ChildServer> {
		// get the information about a repo from repos folder using childs.json
		const childrenJSON: childrenJSON = JSON.parse(readFileSync(join(process.cwd(), this.childrenJSON), "utf8"));
		let result: Array<ChildServer> = [];
		if (typeof query == "string") {
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
		const repos: Array<string> = readdirSync(this.repoDir, "utf8");
		let childrenJSON: childrenJSON = JSON.parse(readFileSync(this.childrenJSON, "utf8"));
		childrenJSON.children.forEach(i => {
			if (repos.indexOf(i.name) != -1) result.push(i);
		});
		this.childPort = 3001;
		writeFileSync(join(process.cwd(), this.childrenJSON), JSON.stringify({ children: result }), "utf8");
	}

	protected sortChildrenJSON(): void {
		let childrenJSON: childrenJSON = JSON.parse(readFileSync(join(process.cwd(), this.childrenJSON), "utf8"));
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
			writeFileSync(join(process.cwd(), this.childrenJSON), JSON.stringify(childrenJSON), "utf8");
		}
	}
	public getRunningChildren(query: string | number | null): Array<ChildServer> | ChildServer | null {
		let result: Array<ChildServer> = [];
		if (typeof query == "string") {
			const child = this.children.find(child => child.id == query || child.name == query);
			return child ? child : null;
		}
		if (typeof query == "number") {
			const child = this.children.find(child => child.pid == query);
			return child ? child : null;
		}
		return this.children;
	}

	public killChild(child: ChildServer): Promise<ChildServer> {
		// kill running instance process by PID | Name | ID
		console.log("killing");

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
		if (
			data.indexOf("fatal") != -1 ||
			data.indexOf("ERR") != -1 ||
			data.indexOf("error") != -1 ||
			data.indexOf("not found") != -1
		) {
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
			dateDeployed: child.dateDeployed,
			dateLastUpdated: child.dateLastUpdated,
			dateLastRun: child.dateLastRun,
			dependencies: child.dependencies,
			messages: child.messages,
			errors: child.errors,
			action: child.action,
			port: child.port,
			pid: child.pid
		};
	}
	public formatChildErrors(child: ChildServer): ChildServer {
		//format server output to avoid JSON parse circular JSON exceptions
		return {
			repo: child.repo,
			name: child.name,
			dir: child.dir,
			id: child.id,
			platform: child.platform,
			messages: child.messages,
			errors: child.errors
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
		process.exit();
	}
}
