import * as bodyParser from 'body-parser';
import { exec, execFile, spawn, ChildProcess } from 'child_process';
import * as express from 'express';
import * as fs from 'fs';
import * as morgan from 'morgan';
import * as os from 'os';
import * as path from 'path';

export interface ChildServer {
	repo: string;
	name: string;
	id: string;
	dir: string;
	platform: string;

	messages: Array<string>;
	errors: Array<string>;

	port?: number | void;
	process?: ChildProcess;
	pid?: number | void;
	action?: string;

	dependencies?: object;
}
export interface childrenJSON {
	children: Array<ChildServer>;
}

export default class App {
	protected childPort: number; // starting port for child servers
	protected children: Array<ChildServer>; // array of active child servers
	public repoDir: string; // name of child repository folder
	protected childrenJSON: string; // json file to store all installed child servers
	protected defaultExpressServer: string; // location of a simple code for a basic express server;
	constructor(PORT: number) {
		this.children = [];
		this.repoDir = 'public';
		this.childrenJSON = `${this.repoDir}/children.json`;
		this.defaultExpressServer = 'resource/server.js';
		this.childPort = PORT + 1;
		this.init();
	}
	init() {
		if (!fs.existsSync(this.repoDir)) {
			fs.mkdirSync(this.repoDir);
			console.log(this.repoDir);
			fs.writeFileSync(
				this.childrenJSON,
				JSON.stringify({
					children: []
				}),
				'utf8'
			);
		} else {
			this.setChildrenToJSON();
		}
	}
	async retrieve(child: ChildServer): Promise<any> {
		//let childrenJSON: any = JSON.parse(fs.readFileSync(this.childrenJSON, 'utf8'));
		return new Promise((resolve, reject) => {
			const pull: boolean = fs.existsSync(path.join(__dirname, child.dir + '/.git'));
			const childProcess: ChildProcess = pull
				? execFile('git', [`pull`], {
						cwd: path.join(__dirname, child.dir)
				  })
				: execFile('git', ['clone', child.repo], {
						cwd: path.join(__dirname, this.repoDir)
				  });
			child.action = pull ? 'pull' : 'clone';
			if (process.env.NODE_ENV == 'dev') {
				// pipe output to main process for debugging
				childProcess.stderr.pipe(process.stdout);
				childProcess.stdout.pipe(process.stdout);
			}

			childProcess.stderr.on('data', buffer => {
				const data = buffer.toString();
				if (data.indexOf('fatal') != -1) {
					child.errors.push(data.toString());
				} else {
					child.messages.push(data);
				}
			});

			childProcess.stdout.on('data', buffer => {
				const data = buffer.toString();
				if (data.indexOf('fatal') != -1) {
					child.errors.push(data.toString());
				} else {
					child.messages.push(data);
				}
			});
			childProcess.on('exit', () => {
				if (child.errors.length == 0) {
					resolve(child);
				} else {
					reject(child);
				}
			});
		});
	}
	getChildrenFromJSON(query: string | null): Array<ChildServer> {
		// get the information about a repo from repos folder using instances.json
		const childrenJSON: childrenJSON = JSON.parse(fs.readFileSync(this.childrenJSON, 'utf8'));
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
	setChildrenToJSON(): number {
		// update instances.json
		let result: Array<any> = [];
		const repos: Array<string> = fs.readdirSync(this.repoDir, 'utf8');
		let childrenJSON: childrenJSON = JSON.parse(fs.readFileSync(this.childrenJSON, 'utf8'));
		childrenJSON.children.forEach(i => {
			if (repos.indexOf(i.name) != -1) result.push(i);
		});
		fs.writeFileSync(this.childrenJSON, JSON.stringify({ children: result }), 'utf8');
		return result.length;
	}
}
