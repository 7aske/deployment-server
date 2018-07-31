"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const child_process = require("child_process");
const fs = require("fs");
const path = require("path");
class App {
    constructor(PORT) {
        this.children = [];
        this.repoDir = 'public';
        this.childrenJSON = `${this.repoDir}/children.json`;
        this.defaultExpressServer = 'resources/server.js';
        this.childPort = PORT + 1;
        this.HTMLRegExp = new RegExp(/\.(html)$/i);
        this.init();
    }
    init() {
        if (!fs.existsSync(this.repoDir)) {
            if (process.env.NODE_ENV == 'dev')
                console.log('Creating', this.repoDir, 'dir');
            fs.mkdirSync(this.repoDir);
            fs.writeFileSync(path.join(process.cwd(), this.childrenJSON), JSON.stringify({
                children: []
            }), 'utf8');
        }
        else {
            if (process.env.NODE_ENV == 'dev')
                console.log('Updating', this.childrenJSON, 'file');
            this.updateChildrenJSON();
            this.sortChildrenJSON();
        }
    }
    retrieve(child) {
        //let childrenJSON: any = JSON.parse(fs.readFileSync(this.childrenJSON, 'utf8'));
        return new Promise((resolve, reject) => {
            // check if the folder already exists to decide if pull or clone
            const pull = fs.existsSync(path.join(process.cwd(), child.dir));
            if (process.env.NODE_ENV == 'dev')
                console.log(pull ? 'Pulling' : 'Cloning', child.repo);
            const git = pull
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
                if (process.env.NODE_ENV == 'dev')
                    console.log('NPM process exited with code', code);
                if (code == 0 && child.errors.length == 0) {
                    pull ? (child.dateLastUpdated = new Date()) : (child.dateDeployed = new Date());
                    resolve(child);
                }
                else {
                    reject(child);
                }
            });
        });
    }
    install(child) {
        return new Promise((resolve, reject) => {
            // npm doesnt seem to work with spawn
            // --prefix makes a lot of junk files
            if (fs.existsSync(`./${child.dir}/package.json`)) {
                const childPackageJSON = JSON.parse(fs.readFileSync(path.join(process.cwd(), `${child.dir}/package.json`), 'utf8'));
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
                        if (process.env.NODE_ENV == 'dev')
                            console.log('NPM process exited with code', code);
                        if (code == 0 && child.errors.length == 0) {
                            child.dateLastUpdated = new Date();
                            this.setChildToJSON(child);
                            resolve(child);
                        }
                        else {
                            reject(child);
                        }
                    });
                }
                else {
                    child.messages.push('NPM found no dependencies.');
                    resolve(child);
                }
            }
            else {
                child.errors.push('Invalid package.json file');
                reject(child);
            }
        });
    }
    run(child) {
        return new Promise(async (resolve, reject) => {
            //const checkIfRunning = this.children.find(i => i.name == child.name || i.id == child.id);
            if (fs.existsSync(`./${child.dir}/package.json`)) {
                const childPackageJSON = JSON.parse(fs.readFileSync(path.join(process.cwd(), `${child.dir}/package.json`), 'utf8'));
                if (childPackageJSON.main) {
                    let main = childPackageJSON.main;
                    const port = this.getPort(child);
                    if (this.serverRunning(child.id)) {
                        child.errors.push('Server with that ID/Name is already running');
                        reject(child);
                    }
                    else {
                        //if entry point is an html file open a basic static server
                        if (this.HTMLRegExp.test(main)) {
                            const serverCode = fs.readFileSync(path.join(process.cwd(), this.defaultExpressServer), 'utf8');
                            fs.writeFileSync(path.join(process.cwd(), `${child.dir}/server.js`), serverCode, 'utf8');
                            //change entry point accordingly
                            main = 'server.js';
                        }
                        if (await this.runTest(child, port, main)) {
                            if (process.env.NODE_ENV == 'dev')
                                console.log('Tests return true');
                            let node;
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
                            child.dateLastRun = new Date();
                            child.port = port;
                            this.setChildToJSON(child);
                            child.pid = node.pid;
                            child.process = node;
                            this.children.push(child);
                            resolve(child);
                        }
                        else {
                            if (process.env.NODE_ENV == 'dev')
                                console.log('Tests return false');
                            child.errors.push('There is something wrong.');
                            reject(child);
                        }
                    }
                }
                else {
                    child.errors.push('Invalid package.json entry point.');
                    reject(child);
                }
            }
            else {
                child.errors.push('Invalid package.json file');
                reject(child);
            }
        });
    }
    runTest(child, port, main) {
        if (process.env.NODE_ENV == 'dev')
            console.log('Running tests on', child.name, 'repo');
        return new Promise((resolve, reject) => {
            //preform a test
            let node;
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
                    if (process.env.NODE_ENV == 'dev')
                        console.log('Killing node process');
                    node.kill();
                }
            }, 2000);
            node.on('close', (code, signal) => {
                if (code == 1)
                    reject(false);
                else if ((signal = 'SIGTERM'))
                    resolve(true);
                else
                    reject(false);
            });
        });
    }
    remove(child) {
        return new Promise((resolve, reject) => {
            if (child) {
                if (this.serverRunning(child.id)) {
                    // @ts-ignore
                    const runningChild = this.getRunningChildren(child.id);
                    runningChild ? this.killChild(runningChild) : reject(child);
                }
                let error = false;
                const rm = child_process.exec(`rm -r -f ${path.join(process.cwd(), child.dir)}`);
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
                    if (error)
                        reject(child);
                    else {
                        // childrenJSON.children.splice(index, 1);
                        // fs.writeFileSync(path.join(process.cwd(), this.childrenJSON), JSON.stringify(childrenJSON), 'utf8');
                        this.updateChildrenJSON();
                        resolve(child);
                    }
                });
            }
            else {
                reject({
                    errors: ['Invalid child object']
                });
            }
        });
    }
    clear(query) {
        let childrenJSON = JSON.parse(fs.readFileSync(path.join(process.cwd(), this.childrenJSON), 'utf8'));
        if (typeof query == 'string') {
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
        }
        else {
            childrenJSON.children.forEach(child => {
                child.messages = [];
                child.errors = [];
            });
            this.children.forEach(child => {
                child.messages = [];
                child.errors = [];
            });
        }
        fs.writeFileSync(path.join(process.cwd(), this.childrenJSON), JSON.stringify(childrenJSON), 'utf8');
        return true;
    }
    browse(query) {
        const childrenJSON = JSON.parse(fs.readFileSync(path.join(process.cwd(), this.childrenJSON), 'utf8'));
        const result = [];
        if (typeof query == 'string') {
            const child = childrenJSON.children.find(child => {
                return child.id == query || child.name == query;
            });
            console.log(childrenJSON.children);
            if (child)
                result.push(child);
            if (result.length > 0)
                return result;
            else
                return [];
        }
        else {
            return childrenJSON.children;
        }
    }
    getPort(child) {
        //if child doesnt have predefined port
        //find first available port by searching through children.json children array
        const childrenJSON = JSON.parse(fs.readFileSync(path.join(process.cwd(), this.childrenJSON), 'utf8'));
        if (childrenJSON.children.length == 0)
            return this.childPort;
        if (child.port) {
            return child.port;
        }
        else {
            for (let i = 0; i < childrenJSON.children.length; i++) {
                if (this.childPort != childrenJSON.children[i].port)
                    break;
                else
                    this.childPort++;
            }
            return this.childPort;
        }
    }
    serverRunning(query) {
        const child = this.children.find(c => c.id == query || c.name == query || c.pid == query);
        if (child)
            return true;
        else
            return false;
    }
    setChildToJSON(newChild) {
        const childrenJSON = JSON.parse(fs.readFileSync(path.join(process.cwd(), this.childrenJSON), 'utf8'));
        const child = childrenJSON.children.find(c => {
            return c.id == newChild.id;
        });
        // if child exists update it;
        if (child) {
            const index = childrenJSON.children.indexOf(child);
            childrenJSON.children.splice(index, 1, newChild);
        }
        else {
            childrenJSON.children.push(newChild);
        }
        fs.writeFileSync(path.join(process.cwd(), this.childrenJSON), JSON.stringify(childrenJSON), 'utf8');
    }
    getChildrenFromJSON(query) {
        // get the information about a repo from repos folder using childs.json
        const childrenJSON = JSON.parse(fs.readFileSync(path.join(process.cwd(), this.childrenJSON), 'utf8'));
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
    updateChildrenJSON() {
        // update children.json
        let result = [];
        const repos = fs.readdirSync(this.repoDir, 'utf8');
        let childrenJSON = JSON.parse(fs.readFileSync(this.childrenJSON, 'utf8'));
        childrenJSON.children.forEach(i => {
            if (repos.indexOf(i.name) != -1)
                result.push(i);
        });
        this.childPort = 3001;
        fs.writeFileSync(path.join(process.cwd(), this.childrenJSON), JSON.stringify({ children: result }), 'utf8');
    }
    sortChildrenJSON() {
        let childrenJSON = JSON.parse(fs.readFileSync(path.join(process.cwd(), this.childrenJSON), 'utf8'));
        if (childrenJSON.children.length > 1) {
            childrenJSON.children.sort((a, b) => {
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
    getRunningChildren(query) {
        let result = [];
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
    killChild(child) {
        // kill running instance process by PID | Name | ID
        console.log('killing');
        return new Promise((resolve, reject) => {
            child.process.kill();
            if (child.process.killed) {
                this.children.splice(this.children.indexOf(child), 1);
                resolve(this.formatChild(child));
            }
            else {
                reject(this.formatChild(child));
            }
        });
    }
    formatStdOut(stdout, child) {
        //format stdout to differentiate between errors and messages
        const data = stdout.toString();
        if (data.indexOf('fatal') != -1 || data.indexOf('ERR') != -1) {
            child.errors.push(data);
        }
        else {
            child.messages.push(data);
        }
        return child;
    }
    formatChild(child) {
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
    cleanExit() {
        // @ts-ignore
        const children = this.getRunningChildren(null);
        if (children) {
            // @ts-ignore
            children.forEach(child => {
                this.killChild(child);
            });
        }
        process.exit();
    }
}
exports.default = App;
