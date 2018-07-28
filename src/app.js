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
            this.setChildrenToJSON();
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
            git.stderr.on('data', stderr => {
                const data = stderr.toString();
                if (data.indexOf('fatal') != -1) {
                    child.errors.push(data);
                }
                else {
                    child.messages.push(data);
                }
            });
            git.stdout.on('data', stdout => {
                const data = stdout.toString();
                if (data.indexOf('fatal') != -1) {
                    child.errors.push(data);
                }
                else {
                    child.messages.push(data);
                }
            });
            git.on('exit', (code, signal) => {
                if (process.env.NODE_ENV == 'dev')
                    console.log('NPM process exited with code', code);
                if (code == 0 && child.errors.length == 0) {
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
            // let childrenJSON: childrenJSON = JSON.parse(
            // 	fs.readFileSync(path.join(process.cwd(), this.childrenJSON), 'utf8')
            // );
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
                    npm.stderr.on('data', stderr => {
                        const data = stderr.toString();
                        if (data.indexOf('ERR') != -1) {
                            child.errors.push(data);
                        }
                        else
                            child.messages.push(data);
                    });
                    npm.stdout.on('data', stdout => {
                        const data = stdout.toString();
                        if (data.indexOf('ERR') != -1) {
                            child.errors.push(data);
                        }
                        else
                            child.messages.push(data);
                    });
                    npm.on('close', (code, signal) => {
                        if (process.env.NODE_ENV == 'dev')
                            console.log('NPM process exited with code', code);
                        if (code == 0 && child.errors.length == 0) {
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
            /*
                let check: ChildServer | undefined = childrenJSON.children.find(i => {
                    return i.name == child.name;
                });
                if (!check)
                    childrenJSON.children.push({
                        name: child.name,
                        id: child.id,
                        repo: child.repo,
                        dir: child.dir,
                        platform: child.platform,
                        dependencies: child.dependencies,
                        messages: child.messages,
                        errors: child.errors
                    });
                fs.writeFileSync(this.childrenJSON, JSON.stringify(childrenJSON), 'utf8');
            */
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
                    //if entry point is an html file open a basic static server
                    if (this.HTMLRegExp.test(main)) {
                        const serverCode = fs.readFileSync(path.join(process.cwd(), this.defaultExpressServer), 'utf8');
                        fs.writeFileSync(path.join(process.cwd(), `${child.dir}/server.js`), serverCode, 'utf8');
                        //change entry point accordingly
                        main = 'server.js';
                    }
                    const nodeTest = await this.runTest(child, port, main);
                    if (nodeTest) {
                        if (process.env.NODE_ENV == 'dev')
                            console.log('Tests return', nodeTest);
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
                        child.port = port;
                        this.setChildToJSON(child);
                        child.pid = node.pid;
                        child.process = node;
                        this.children.push(child);
                        resolve(child);
                    }
                    else {
                        child.errors.push('There is something wrong.');
                        reject(child);
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
    setChildrenToJSON() {
        // update children.json
        let result = [];
        const repos = fs.readdirSync(this.repoDir, 'utf8');
        let childrenJSON = JSON.parse(fs.readFileSync(this.childrenJSON, 'utf8'));
        childrenJSON.children.forEach(i => {
            if (repos.indexOf(i.name) != -1)
                result.push(i);
        });
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
    getRunningChild(query) {
        let result = [];
        if (typeof query == 'string') {
            const child = this.children.find(child => child.id == query || child.name == query);
            if (child)
                result.push(child);
            return result;
        }
        if (typeof query == 'number') {
            const child = this.children.find(child => child.pid == query);
            if (child)
                result.push(child);
            return result;
        }
        if (query == null)
            return this.children;
        return result;
    }
    killChild(query) {
        // kill running instance process by PID | Name | ID
        let result = [];
        const children = this.getRunningChild(query);
        //TODO: c9 integration
        //child_process.exec(`pkill -P ${instance.pid}`);
        if (children.length > 0) {
            children.forEach(child => {
                child.process.kill();
                if (child.process.killed) {
                    result.push(this.formatChild(child));
                }
            });
            this.children = this.children.filter(child => {
                return !child.process.killed;
            });
            return result;
        }
        else {
            return result;
        }
    }
    formatChild(child) {
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
    cleanExit() {
        let result = this.killChild(null);
        console.log(`Killing ${result.length} child server processses.`);
        process.exit();
    }
}
exports.default = App;
