"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __values = (this && this.__values) || function (o) {
    var m = typeof Symbol === "function" && o[Symbol.iterator], i = 0;
    if (m) return m.call(o);
    return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
};
Object.defineProperty(exports, "__esModule", { value: true });
var child_process_1 = require("child_process");
var fs_1 = require("fs");
var os_1 = require("os");
var path_1 = require("path");
var App = /** @class */ (function () {
    function App(PORT, P) {
        this.PATHS = P;
        this.children = [];
        this.repoDir = "deployment";
        this.childrenJSON = this.repoDir + "/children.json"; // children.json filepath
        this.defaultExpressServer = "resources/server.js";
        this.childPort = PORT + 1;
        this.HTMLRegExp = new RegExp(/\.(html)$/i);
        this.init();
    }
    App.prototype.init = function () {
        if (!fs_1.existsSync(this.repoDir)) {
            fs_1.mkdirSync(this.repoDir);
            fs_1.writeFileSync(path_1.join(process.cwd(), this.childrenJSON), JSON.stringify({
                children: []
            }), "utf8");
        }
        else {
            this.updateChildrenJSON();
            this.sortChildrenJSON();
        }
    };
    App.prototype.retrieve = function (child) {
        var _this = this;
        // let ChildrenJSON: any = JSON.parse(readFileSync(this.ChildrenJSON, 'utf8'));
        return new Promise(function (resolve, reject) {
            // check if the folder already exists to decide whether pull or clone
            var pull = fs_1.existsSync(path_1.join(process.cwd(), child.dir));
            var git = pull
                ? child_process_1.execFile("git", ["pull"], {
                    cwd: path_1.join(process.cwd(), child.dir)
                })
                : child_process_1.execFile("git", ["clone", child.repo], {
                    cwd: path_1.join(process.cwd(), _this.repoDir)
                });
            child.action = pull ? "pull" : "clone";
            if (process.env.NODE_ENV == "dev") {
                // pipe output to main process for debugging
                git.stderr.pipe(process.stdout);
                git.stdout.pipe(process.stdout);
            }
            git.stderr.on("data", function (data) {
                child = _this.formatStdOut(data, child);
            });
            git.stdout.on("data", function (data) {
                child = _this.formatStdOut(data, child);
            });
            git.on("close", function (code) {
                if (code == 0 && child.errors.length == 0) {
                    pull ? (child.dateLastUpdated = new Date()) : (child.dateDeployed = new Date());
                    resolve(child);
                }
                else {
                    reject(App.formatChildErrors(child));
                }
            });
        });
    };
    App.prototype.install = function (child) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            // npm doesnt seem to work with spawn
            // --prefix makes a lot of junk files
            if (fs_1.existsSync("./" + child.dir + "/package.json")) {
                var childPackageJSON = JSON.parse(fs_1.readFileSync(path_1.join(process.cwd(), child.dir + "/package.json"), "utf8"));
                if (childPackageJSON.dependencies) {
                    child.dependencies = childPackageJSON.dependencies;
                    var npm = child_process_1.spawn(_this.PATHS.npm, ["install"], {
                        cwd: path_1.join(process.cwd(), child.dir)
                    });
                    if (process.env.NODE_ENV == "dev") {
                        // pipe output to main process for debugging
                        npm.stderr.pipe(process.stdout);
                        npm.stdout.pipe(process.stdout);
                    }
                    npm.stderr.on("data", function (data) {
                        child = _this.formatStdOut(data, child);
                    });
                    npm.stdout.on("data", function (data) {
                        child = _this.formatStdOut(data, child);
                    });
                    npm.on("close", function (code) {
                        if (code == 0 && child.errors.length == 0) {
                            child.dateLastUpdated = new Date();
                            _this.setChildToJSON(child);
                            resolve(child);
                        }
                        else {
                            reject(App.formatChildErrors(child));
                        }
                    });
                }
                else {
                    child.messages.push("NPM found no dependencies.");
                    resolve(App.formatChildErrors(child));
                }
            }
            else {
                child.errors.push("Invalid package.json file");
                reject(App.formatChildErrors(child));
            }
        });
    };
    App.prototype.run = function (child) {
        var _this = this;
        return new Promise(function (resolve, reject) { return __awaiter(_this, void 0, void 0, function () {
            var childPackageJSON, main, port, serverCode, node;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!fs_1.existsSync("./" + child.dir + "/package.json")) return [3 /*break*/, 6];
                        childPackageJSON = JSON.parse(fs_1.readFileSync(path_1.join(process.cwd(), child.dir + "/package.json"), "utf8"));
                        if (!childPackageJSON.main) return [3 /*break*/, 4];
                        main = childPackageJSON.main;
                        port = this.getPort(child);
                        if (!this.serverRunning(child.id)) return [3 /*break*/, 1];
                        child.errors.push("Server with that ID/Name is already running");
                        reject(App.formatChildErrors(child));
                        return [3 /*break*/, 3];
                    case 1:
                        // if entry point is an html file open a basic static server
                        if (this.HTMLRegExp.test(main)) {
                            serverCode = fs_1.readFileSync(path_1.join(process.cwd(), this.defaultExpressServer), "utf8");
                            fs_1.writeFileSync(path_1.join(process.cwd(), child.dir + "/server.js"), serverCode, "utf8");
                            // change entry point accordingly
                            main = "server.js";
                        }
                        return [4 /*yield*/, this.runTest(child, port, main)];
                    case 2:
                        if (_a.sent()) {
                            node = void 0;
                            // TODO: c9 integration
                            node = child_process_1.execFile(this.PATHS.node, [main], {
                                cwd: path_1.join(process.cwd(), child.dir),
                                env: { PORT: port }
                            });
                            if (process.env.NODE_ENV == "dev") {
                                // pipe output to main process for debugging
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
                            child.errors.push("There is something wrong.");
                            reject(App.formatChildErrors(child));
                        }
                        _a.label = 3;
                    case 3: return [3 /*break*/, 5];
                    case 4:
                        child.errors.push("Invalid package.json entry point.");
                        reject(App.formatChildErrors(child));
                        _a.label = 5;
                    case 5: return [3 /*break*/, 7];
                    case 6:
                        child.errors.push("Invalid package.json file");
                        reject(App.formatChildErrors(child));
                        _a.label = 7;
                    case 7: return [2 /*return*/];
                }
            });
        }); });
    };
    App.prototype.runTest = function (child, port, main) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            // preform a test
            var node = child_process_1.execFile(_this.PATHS.node, [main], {
                cwd: path_1.join(process.cwd(), child.dir),
                env: { PORT: port }
            });
            if (process.env.NODE_ENV == "dev") {
                // pipe output to main process for debugging
                node.stderr.pipe(process.stdout);
                node.stdout.pipe(process.stdout);
            }
            setTimeout(function () {
                if (!node.killed) {
                    node.kill();
                }
            }, 2000);
            node.on("close", function (code, signal) {
                if (code == 1)
                    reject(false);
                else if (signal == "SIGTERM")
                    resolve(true);
                else
                    reject(false);
            });
        });
    };
    App.prototype.remove = function (child) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            if (child) {
                if (_this.serverRunning(child.id)) {
                    // @ts-ignore
                    var runningChild = _this.getRunningChildren(child.id);
                    runningChild ? _this.killChild(runningChild) : reject(App.formatChildErrors(child));
                }
                var error_1 = false;
                var rm = void 0;
                if (os_1.platform() == "win32") {
                    rm = child_process_1.exec("rd /s /q " + path_1.join(process.cwd(), child.dir));
                }
                else if (os_1.platform() == "linux" || os_1.platform() == "darwin") {
                    rm = child_process_1.exec("rm -r -f " + path_1.join(process.cwd(), child.dir));
                }
                else {
                    return reject({
                        errors: ["Unsupported platform"]
                    });
                }
                if (process.env.NODE_ENV == "dev") {
                    // pipe output to main process for debugging
                    rm.stderr.pipe(process.stdout);
                    rm.stdout.pipe(process.stdout);
                }
                rm.stderr.on("data", function (data) {
                    child.errors.push(data.toString());
                    error_1 = true;
                });
                rm.stdout.on("data", function (data) {
                    child.messages.push(data.toString());
                });
                rm.on("error", function (data) {
                    child.errors.push(data.message);
                    error_1 = true;
                });
                rm.on("close", function () {
                    if (error_1)
                        reject(App.formatChildErrors(child));
                    else {
                        _this.updateChildrenJSON();
                        resolve(child);
                    }
                });
            }
            else {
                reject({
                    errors: ["Invalid child object"]
                });
            }
        });
    };
    App.prototype.clear = function (query) {
        var childrenJSON = JSON.parse(fs_1.readFileSync(path_1.join(process.cwd(), this.childrenJSON), "utf8"));
        if (typeof query == "string") {
            childrenJSON.children.forEach(function (child) {
                if (child.id == query || child.name == query) {
                    child.messages = [];
                    child.errors = [];
                }
            });
            this.children.forEach(function (child) {
                if (child.id == query || child.name == query) {
                    child.messages = [];
                    child.errors = [];
                }
            });
        }
        else {
            childrenJSON.children.forEach(function (child) {
                child.messages = [];
                child.errors = [];
            });
            this.children.forEach(function (child) {
                child.messages = [];
                child.errors = [];
            });
        }
        fs_1.writeFileSync(path_1.join(process.cwd(), this.childrenJSON), JSON.stringify(childrenJSON), "utf8");
        return true;
    };
    App.prototype.browse = function (query) {
        var childrenJSON = JSON.parse(fs_1.readFileSync(path_1.join(process.cwd(), this.childrenJSON), "utf8"));
        var result = [];
        if (typeof query == "string") {
            var child = childrenJSON.children.find(function (c) {
                return c.id == query || c.name == query;
            });
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
    };
    App.prototype.getPort = function (child) {
        var e_1, _a;
        // if child doesnt have predefined port
        // find first available port by searching through children.json children array
        var childrenJSON = JSON.parse(fs_1.readFileSync(path_1.join(process.cwd(), this.childrenJSON), "utf8"));
        if (childrenJSON.children.length == 0)
            return this.childPort;
        if (child.port) {
            return child.port;
        }
        else {
            try {
                for (var _b = __values(childrenJSON.children), _c = _b.next(); !_c.done; _c = _b.next()) {
                    var c = _c.value;
                    if (this.childPort != c.port)
                        break;
                    else
                        this.childPort++;
                }
            }
            catch (e_1_1) { e_1 = { error: e_1_1 }; }
            finally {
                try {
                    if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
                }
                finally { if (e_1) throw e_1.error; }
            }
            return this.childPort;
        }
    };
    App.prototype.serverRunning = function (query) {
        var child = this.children.find(function (c) { return c.id == query || c.name == query || c.pid == query; });
        return !!child;
    };
    App.prototype.setChildToJSON = function (newChild) {
        var childrenJSON = JSON.parse(fs_1.readFileSync(path_1.join(process.cwd(), this.childrenJSON), "utf8"));
        var child = childrenJSON.children.find(function (c) {
            return c.id == newChild.id;
        });
        // if child exists update it;
        if (child) {
            var index = childrenJSON.children.indexOf(child);
            childrenJSON.children.splice(index, 1, newChild);
        }
        else {
            childrenJSON.children.push(newChild);
        }
        fs_1.writeFileSync(path_1.join(process.cwd(), this.childrenJSON), JSON.stringify(childrenJSON), "utf8");
    };
    App.prototype.getChildrenFromJSON = function (query) {
        // get the information about a repo from repos folder using childs.json
        var childrenJSON = JSON.parse(fs_1.readFileSync(path_1.join(process.cwd(), this.childrenJSON), "utf8"));
        var result = [];
        if (typeof query == "string") {
            result = childrenJSON.children.filter(function (child) {
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
    };
    App.prototype.updateChildrenJSON = function () {
        // update children.json
        var result = [];
        var repos = fs_1.readdirSync(this.repoDir, "utf8");
        var childrenJSON = JSON.parse(fs_1.readFileSync(this.childrenJSON, "utf8"));
        childrenJSON.children.forEach(function (i) {
            if (repos.indexOf(i.name) != -1)
                result.push(i);
        });
        this.childPort = 3001;
        fs_1.writeFileSync(path_1.join(process.cwd(), this.childrenJSON), JSON.stringify({ children: result }), "utf8");
    };
    App.prototype.sortChildrenJSON = function () {
        var childrenJSON = JSON.parse(fs_1.readFileSync(path_1.join(process.cwd(), this.childrenJSON), "utf8"));
        if (childrenJSON.children.length > 1) {
            childrenJSON.children.sort(function (a, b) {
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
            fs_1.writeFileSync(path_1.join(process.cwd(), this.childrenJSON), JSON.stringify(childrenJSON), "utf8");
        }
    };
    App.prototype.getRunningChildren = function (query) {
        if (typeof query == "string") {
            var child = this.children.find(function (c) { return c.id == query || c.name == query; });
            return child ? child : null;
        }
        if (typeof query == "number") {
            var child = this.children.find(function (c) { return c.pid == query; });
            return child ? child : null;
        }
        return this.children;
    };
    App.prototype.killChild = function (child) {
        var _this = this;
        // kill running instance process by PID | Name | ID
        return new Promise(function (resolve, reject) {
            child.process.kill();
            if (child.process.killed) {
                _this.children.splice(_this.children.indexOf(child), 1);
                resolve(App.formatChild(child));
            }
            else {
                reject(App.formatChild(child));
            }
        });
    };
    App.prototype.formatStdOut = function (stdout, child) {
        // format stdout to differentiate between errors and messages
        var data = stdout.toString();
        if (data.indexOf("fatal") != -1 ||
            data.indexOf("ERR") != -1 ||
            data.indexOf("error") != -1 ||
            data.indexOf("not found") != -1) {
            child.errors.push(data);
        }
        else {
            child.messages.push(data);
        }
        return child;
    };
    App.formatChild = function (child) {
        // format server output to avoid JSON parse circular JSON exceptions
        return {
            action: child.action,
            dateDeployed: child.dateDeployed,
            dateLastRun: child.dateLastRun,
            dateLastUpdated: child.dateLastUpdated,
            dependencies: child.dependencies,
            dir: child.dir,
            errors: child.errors,
            id: child.id,
            messages: child.messages,
            name: child.name,
            pid: child.pid,
            platform: child.platform,
            port: child.port,
            repo: child.repo,
        };
    };
    App.formatChildErrors = function (child) {
        // format server output to avoid JSON parse circular JSON exceptions
        return {
            dir: child.dir,
            errors: child.errors,
            id: child.id,
            messages: child.messages,
            name: child.name,
            platform: child.platform,
            repo: child.repo,
        };
    };
    return App;
}());
exports.default = App;
