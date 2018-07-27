"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const child_process_1 = require("child_process");
const fs = require("fs");
const path = require("path");
class App {
    constructor(PORT) {
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
            fs.writeFileSync(this.childrenJSON, JSON.stringify({
                children: []
            }), 'utf8');
        }
        else {
            this.setChildrenToJSON();
        }
    }
    async retrieve(child) {
        //let childrenJSON: any = JSON.parse(fs.readFileSync(this.childrenJSON, 'utf8'));
        return new Promise((resolve, reject) => {
            const pull = fs.existsSync(path.join(__dirname, child.dir + '/.git'));
            const childProcess = pull
                ? child_process_1.execFile('git', [`pull`], {
                    cwd: path.join(__dirname, child.dir)
                })
                : child_process_1.execFile('git', ['clone', child.repo], {
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
                }
                else {
                    child.messages.push(data);
                }
            });
            childProcess.stdout.on('data', buffer => {
                const data = buffer.toString();
                if (data.indexOf('fatal') != -1) {
                    child.errors.push(data.toString());
                }
                else {
                    child.messages.push(data);
                }
            });
            childProcess.on('exit', () => {
                if (child.errors.length == 0) {
                    resolve(child);
                }
                else {
                    reject(child);
                }
            });
        });
    }
    getChildrenFromJSON(query) {
        // get the information about a repo from repos folder using instances.json
        const childrenJSON = JSON.parse(fs.readFileSync(this.childrenJSON, 'utf8'));
        let result = [];
        if (typeof query == 'string') {
            result = childrenJSON.children.filter(child => {
                return child.id == query || child.name == query;
            });
        }
        else if (query == null) {
            result = childrenJSON.children;
        }
        else {
            result = [];
        }
        return result;
    }
    setChildrenToJSON() {
        // update instances.json
        let result = [];
        const repos = fs.readdirSync(this.repoDir, 'utf8');
        let childrenJSON = JSON.parse(fs.readFileSync(this.childrenJSON, 'utf8'));
        childrenJSON.children.forEach(i => {
            if (repos.indexOf(i.name) != -1)
                result.push(i);
        });
        fs.writeFileSync(this.childrenJSON, JSON.stringify({ children: result }), 'utf8');
        return result.length;
    }
}
exports.default = App;
