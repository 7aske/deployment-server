"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express = require("express");
const bodyParser = require("body-parser");
const child_process_1 = require("child_process");
const fs = require("fs");
const path = require("path");
const os = require("os");
const id = require("shortid");
const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
class Program {
    constructor(port = 3000) {
        this.children = [];
        this.repoDir = 'repos';
        this.instancesJSON = 'repos/instances.json';
        this.serverGen = 'gen/server.js';
        this.PORT = parseInt(process.env.PORT) || port;
        this.childPort = this.PORT + 1;
        this.init();
    }
    init() {
        if (!fs.existsSync(this.repoDir)) {
            fs.mkdirSync(this.repoDir);
            fs.writeFileSync(this.instancesJSON, JSON.stringify({
                instances: []
            }), 'utf8');
        }
        else {
            this.setInstancesToJSON();
        }
    }
    async retrieve(instance) {
        let instancesJSON = JSON.parse(fs.readFileSync(this.instancesJSON, 'utf8'));
        return new Promise((resolve, reject) => {
            const pull = fs.existsSync(path.join(__dirname, instance.dir + '/.git'));
            const cp = pull
                ? child_process_1.execFile('git', [`pull`], {
                    cwd: path.join(__dirname, instance.dir)
                })
                : child_process_1.execFile('git', ['clone', instance.repo], {
                    cwd: path.join(__dirname, this.repoDir)
                });
            instance.errors = [];
            instance.messages = [];
            instance.action = pull ? 'pull' : 'clone';
            cp.stderr.pipe(process.stdout);
            cp.stdout.pipe(process.stdout);
            cp.stderr.on('data', buffer => {
                const data = buffer.toString();
                if (data.indexOf('fatal') != -1) {
                    instance.errors.push(data.toString());
                    cp.kill();
                }
                else {
                    instance.messages.push(data);
                }
            });
            cp.stdout.on('data', buffer => {
                const data = buffer.toString();
                if (data.indexOf('fatal') != -1) {
                    instance.errors.push(data.toString());
                    // removing dir while app is running causes a MINGW exception "Assertion `(wrap) != nullptr' failed."
                    // kill git cp before it executes rmdir command in case of bad repository
                    // folder still remains as garbage
                    if (Program.platform == 'win32') {
                        cp.kill();
                        if (fs.existsSync(path.join(__dirname, instance.dir)))
                            child_process_1.exec(`cd ./${this.repoDir} && rm -r ${instance.name}`);
                    }
                }
                else {
                    instance.messages.push(data);
                }
            });
            cp.on('exit', () => {
                if (instance.errors.length == 0) {
                    // moved to install section
                    // let check: ServerInstance | undefined = instancesJSON.instances.find(i => {
                    // 	return i.name == instance.name;
                    // });
                    // if (!check)
                    // 	instancesJSON.instances.push({
                    // 		name: instance.name,
                    // 		id: instance.id,
                    // 		repo: instance.repo,
                    // 		dir: instance.dir,
                    // 		platform: instance.platform,
                    // 		messages: instance.messages,
                    // 		errors: instance.errors
                    // 	});
                    // fs.writeFileSync(this.instancesJSON, JSON.stringify(instancesJSON), 'utf8');
                    resolve(instance);
                }
                else {
                    reject(instance);
                }
            });
        });
    }
    install(instance) {
        return new Promise((resolve, reject) => {
            // npm doesnt seem to work with spawn
            // --prefix makes a lot of junk files
            child_process_1.exec(`cd ./${instance.dir} && npm install`, (err, stdout, stderr) => {
                if (fs.existsSync(`./${instance.dir}/package.json`)) {
                    let instancesJSON = JSON.parse(fs.readFileSync(this.instancesJSON, 'utf8'));
                    const dependencies = JSON.parse(fs.readFileSync(`./${instance.dir}/package.json`, 'utf8')).dependencies;
                    if (err) {
                        instance.errors.push(err.toString());
                        reject(instance);
                    }
                    if (stderr) {
                        const data = stderr.toString();
                        if (data.indexOf('ERR') != -1) {
                            instance.errors.push(stderr.toString());
                            reject(instance);
                        }
                        else
                            instance.messages.push(stderr.toString());
                    }
                    instance.messages.push(stdout.toString());
                    instance.dependencies = dependencies;
                    let check = instancesJSON.instances.find(i => {
                        return i.name == instance.name;
                    });
                    if (!check)
                        instancesJSON.instances.push({
                            name: instance.name,
                            id: instance.id,
                            repo: instance.repo,
                            dir: instance.dir,
                            platform: instance.platform,
                            dependencies: instance.dependencies,
                            messages: instance.messages,
                            errors: instance.errors
                        });
                    fs.writeFileSync(this.instancesJSON, JSON.stringify(instancesJSON), 'utf8');
                    resolve(instance);
                }
                else {
                    reject(instance);
                }
            });
        });
    }
    run(instance) {
        return new Promise((resolve, reject) => {
            if (!instance) {
                reject({
                    errors: ['Invalid instance']
                });
            }
            else {
                const packageJSON = fs.readFileSync(path.join(__dirname, `${instance.dir}/package.json`), 'utf8');
                let instancesJSON = JSON.parse(fs.readFileSync(this.instancesJSON, 'utf8'));
                const main = JSON.parse(packageJSON).main;
                //instance has to have main entry point and valid package.json file
                if (JSON.parse(packageJSON) != undefined && main != undefined) {
                    let port;
                    //if instance doesnt have predefined port
                    //find first available port by searching through instances.json instances array
                    if (instance.port) {
                        port = instance.port;
                    }
                    else {
                        let i = 0;
                        while (instancesJSON.instances[i].port == this.childPort) {
                            this.childPort++;
                            i++;
                        }
                        port = this.childPort;
                    }
                    const checkIfRunning = this.children.find(i => i.name == instance.name || i.id == instance.id);
                    if (/\.(html)$/i.test(main)) {
                        if (checkIfRunning) {
                            instance.errors.push(`Instance already running on port ${checkIfRunning.port}`);
                            reject(instance);
                        }
                        else {
                            const serverCode = fs.readFileSync(this.serverGen, 'utf8');
                            fs.writeFileSync(`${instance.dir}/server.js`, serverCode, 'utf8');
                            let cp;
                            if (process.env.SRV == 'c9') {
                                cp = child_process_1.exec(`PORT=${port} node ${instance.dir}/server.js`, (err, stdout, stderr) => {
                                    console.log(err || stdout || stderr);
                                });
                            }
                            else {
                                cp = child_process_1.execFile('node', ['server.js'], {
                                    cwd: instance.dir,
                                    env: { PORT: port }
                                }, (err, stdout, stderr) => {
                                    if (err)
                                        reject(instance);
                                });
                            }
                            instancesJSON.instances.forEach(i => {
                                if (i.id == instance.id)
                                    i.port = port;
                            });
                            if (!instance.action)
                                instance.action = 'run';
                            instance.pid = cp.pid;
                            instance.process = cp;
                            instance.port = port;
                            fs.writeFileSync(this.instancesJSON, JSON.stringify(instancesJSON), 'utf8');
                            this.children.push(instance);
                            this.childPort++;
                            resolve(instance);
                        }
                    }
                    else {
                        if (checkIfRunning) {
                            instance.errors.push(`Instance already running on port ${checkIfRunning.port}`);
                            reject(instance);
                        }
                        else {
                            //testing if valid node app
                            let cpTest;
                            if (process.env.SRV == 'c9') {
                                cpTest = child_process_1.exec(`PORT=${port} node ${instance.dir}/${main}`, (err, stdout, stderr) => {
                                    console.log(err || stdout || stderr);
                                });
                            }
                            else {
                                cpTest = child_process_1.execFile('node', [main], {
                                    cwd: instance.dir,
                                    env: { PORT: port }
                                }, function (err, stdout, stderr) {
                                    console.log(err || stdout || stderr);
                                });
                            }
                            let OK = false;
                            //give test app a 2 second run time
                            //if it is still running kill it and give OK sign
                            setTimeout(() => {
                                if (!cpTest.killed) {
                                    cpTest.kill('SIGKILL');
                                    OK = true;
                                }
                            }, 2000);
                            cpTest.on('exit', (code, signal) => {
                                if (code == 1) {
                                    cpTest.killed = true;
                                    if (instance.errors)
                                        instance.errors.push('Invalid package.json file "main" property.');
                                    else
                                        instance.errors = ['Invalid package.json file "main" property.'];
                                    instancesJSON.instances.splice(instancesJSON.instances.indexOf(instance), 1);
                                    fs.writeFileSync(this.instancesJSON, JSON.stringify(instancesJSON), 'utf8');
                                    reject(instance);
                                }
                                else if (OK) {
                                    let cp;
                                    if (process.env.SRV == 'c9') {
                                        cp = child_process_1.exec(`PORT=${port} node ${instance.dir}/${main}`, function (err, stdout, stderr) {
                                            console.log(err || stdout || stderr);
                                        });
                                    }
                                    else {
                                        cp = child_process_1.execFile('node', [main], {
                                            cwd: instance.dir,
                                            env: { PORT: port }
                                        }, function (err, stdout, stderr) {
                                            console.log(err || stdout || stderr);
                                        });
                                    }
                                    instancesJSON.instances.forEach(i => {
                                        if (i.id == instance.id)
                                            i.port = port;
                                    });
                                    if (!instance.action)
                                        instance.action = 'run';
                                    instance.pid = cp.pid;
                                    instance.process = cp;
                                    instance.port = port;
                                    fs.writeFileSync(this.instancesJSON, JSON.stringify(instancesJSON), 'utf8');
                                    this.children.push(instance);
                                    this.childPort++;
                                    resolve(instance);
                                }
                                else {
                                    reject(instance);
                                }
                            });
                            // Cloud 9 doesnt support spawning of node.js processes
                            // execFile is not supported as well, use exec intead w/o cwd
                            //const cp = exec(`PORT=${this.childPort} node ./${instance.dir}/${JSON.parse(packageJSON).main}`,(err,stdout,stderr) => console.log(err||stdout||stderr));
                            // const cp: ChildProcess = spawn('node', [`./${instance.dir}/${JSON.parse(packageJSON).main}`], {
                            // 	env: { PORT: this.childPort }
                            // });
                        }
                    }
                }
                else {
                    if (instance.errors)
                        instance.errors.push('Invalid package.json file.');
                    else
                        instance.errors = ['Invalid package.json file.'];
                    reject(instance);
                }
            }
        });
    }
    remove(query) {
        //TODO: remove repository
    }
    setInstancesToJSON() {
        // update instances.json
        let result = [];
        const repos = fs.readdirSync(this.repoDir, 'utf8');
        let instancesJSON = JSON.parse(fs.readFileSync(this.instancesJSON, 'utf8'));
        instancesJSON.instances.forEach(i => {
            if (repos.indexOf(i.name) != -1)
                result.push(i);
        });
        fs.writeFileSync(this.instancesJSON, JSON.stringify({ instances: result }), 'utf8');
        return result.length;
    }
    getInstanceFromJSON(query) {
        // get the information about a repo from repos folder using instances.json
        const instancesJSON = JSON.parse(fs.readFileSync(this.instancesJSON, 'utf8'));
        let result = [];
        if (typeof query == 'string') {
            result = instancesJSON.instances.filter(instance => {
                return instance.id == query || instance.name == query;
            });
        }
        else if (query == null) {
            result = instancesJSON.instances;
        }
        else {
            result = [];
        }
        return result;
    }
    getInstance(query) {
        // get running instance process by PID | Name | ID
        let result = [];
        if (typeof query == 'number') {
            let instance = this.children.find(child => {
                return child.pid == query;
            });
            if (instance)
                result.push(instance);
        }
        else if (typeof query == 'string') {
            let instance = this.children.find(child => {
                return child.name == query || child.id == query;
            });
            if (instance)
                result.push(instance);
        }
        else if (query == null) {
            result = this.children;
        }
        else {
            result = [];
        }
        return result;
    }
    killInstance(query) {
        // kill running instance process by PID | Name | ID
        let result = [];
        const instances = this.getInstance(query);
        instances.forEach(instance => {
            if (process.env.SRV == 'c9') {
                child_process_1.exec(`pkill -P ${instance.pid}`);
                this.children.splice(this.children.indexOf(instance), 1);
                result.push({
                    repo: instance.repo,
                    name: instance.name,
                    dir: instance.dir,
                    port: instance.port,
                    pid: instance.pid,
                    code: 9,
                    signal: 'SIGTERM'
                });
            }
            else {
                instance.process.kill();
                if (instance.process.killed) {
                    result.push({
                        repo: instance.repo,
                        name: instance.name,
                        dir: instance.dir,
                        port: instance.port,
                        pid: instance.pid,
                        code: 9,
                        signal: 'SIGTERM'
                    });
                }
            }
        });
        this.children = this.children.filter(i => {
            return !i.process.killed;
        });
        return result;
    }
}
Program.platform = os.platform();
Program.getName = new RegExp(/.*\/(.*)$/);
const program = new Program();
app.post('/deploy', async (req, res) => {
    console.log(req.body);
    let url;
    try {
        url = new URL(req.body.repository);
    }
    catch (err) {
        url = err.input;
    }
    console.log(url.hostname);
    if (url.hostname == 'github.com') {
        let check = program.getInstanceFromJSON(req.body.repository.match(Program.getName)[1]);
        let err;
        let instance = {
            repo: url.toString(),
            name: url.toString().match(Program.getName)[1],
            id: id.generate(),
            dir: `${program.repoDir}/${url.toString().match(Program.getName)[1]}`,
            platform: Program.platform
        };
        if (check.length > 0) {
            instance = check[0];
            res.send({
                repo: instance.repo,
                id: instance.id,
                name: instance.name,
                messages: ['Repository already deployed. Use run [name] | [id] or update [name] | [id].']
            });
        }
        else {
            try {
                instance = await program.retrieve(instance);
                console.info(instance);
            }
            catch (error) {
                err = error;
            }
            try {
                if (!err)
                    instance = await program.install(instance);
                console.info(instance);
            }
            catch (error) {
                err = error;
            }
            try {
                if (!err)
                    instance = await program.run(instance);
                console.info(instance);
            }
            catch (error) {
                err = error;
            }
            if (!err) {
                res.send({
                    repo: instance.repo,
                    name: instance.name,
                    dir: instance.dir,
                    id: instance.id,
                    platform: instance.platform,
                    action: instance.action,
                    messages: instance.messages,
                    errors: instance.errors,
                    dependencies: instance.dependencies,
                    port: instance.port,
                    pid: instance.pid
                });
            }
            else {
                res.send({
                    repo: instance.repo,
                    name: instance.name,
                    dir: instance.dir,
                    id: instance.id,
                    platform: instance.platform,
                    messages: instance.messages,
                    errors: instance.errors
                });
            }
        }
    }
    else {
        res.send({
            errors: 'Repository URL hostname must be "github.com"'
        });
    }
});
app.post('/kill', (req, res) => {
    const query = isNaN(req.body.query) ? req.body.query : parseInt(req.body.query);
    if (program.getInstance(query).length != 0) {
        let response = program.killInstance(query);
        res.send(response);
    }
    else {
        res.send({
            query: query,
            errors: ['Invalid PID or name.']
        });
    }
});
app.post('/update', async (req, res) => {
    const query = req.body.query;
    let result = program.getInstanceFromJSON(query);
    if (result.length > 0) {
        let response = [];
        let err;
        result.forEach(async (instance, i) => {
            try {
                instance = await program.retrieve(instance);
                console.log(instance);
            }
            catch (error) {
                err = error;
            }
            try {
                if (!err) {
                    instance = await program.install(instance);
                    response.push(instance);
                }
            }
            catch (error) {
                err = error;
            }
            if (!err)
                response.push(instance);
            if (i == result.length - 1) {
                if (!err)
                    res.send(response);
                else
                    res.send(err);
            }
        });
    }
    else {
        res.send({
            query: query,
            errors: ["Repository doesn't exist or needs to be re-deployed."]
        });
    }
});
app.post('/run', (req, res) => {
    const query = req.body.query;
    let response = [];
    let errors = [];
    let instances = program.getInstanceFromJSON(query);
    if (instances.length != 0) {
        instances.forEach(async (instance, i) => {
            try {
                await program.run(instance);
                response.push({
                    repo: instance.repo,
                    name: instance.name,
                    dir: instance.dir,
                    id: instance.id,
                    platform: instance.platform,
                    action: instance.action,
                    dependencies: instance.dependencies,
                    messages: instance.messages,
                    errors: instance.errors,
                    port: instance.port,
                    pid: instance.pid
                });
            }
            catch (instance) {
                errors.push({
                    repo: instance.repo,
                    name: instance.name,
                    dir: instance.dir,
                    id: instance.id,
                    platform: instance.platform,
                    action: instance.action,
                    dependencies: instance.dependencies,
                    messages: instance.messages,
                    errors: instance.errors
                });
                console.error(instance);
            }
            if (i == instances.length - 1) {
                console.log(response || errors);
                if (errors.length == 0)
                    res.send(response);
                else
                    res.send(errors);
            }
        });
    }
    else {
        res.send({
            errors: ['Repository not found.']
        });
    }
});
app.post('/find', async (req, res) => {
    const query = req.body.query;
    let response = [];
    program.getInstance(query).forEach(i => {
        response.push({
            repo: i.repo,
            name: i.name,
            dir: i.dir,
            id: i.id,
            platform: i.platform,
            action: i.action,
            dependencies: i.dependencies,
            messages: i.messages,
            errors: i.errors,
            port: i.port,
            pid: i.pid
        });
    });
    console.log(response);
    res.send(response);
});
app.listen(program.PORT, () => {
    console.log(`Deployment server running on port ${program.PORT}`);
});
function cleanExit() {
    let result = program.killInstance(null);
    console.log(`Killing ${result.length} child server processses.`);
    process.exit();
}
//process.on('exit', cleanExit); // regular exit
process.on('SIGINT', cleanExit); // catch ctrl-c
process.on('SIGTERM', cleanExit); // catch kill
