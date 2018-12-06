"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var child_process_1 = require("child_process");
var express_1 = __importDefault(require("express"));
var fs_1 = require("fs");
var path_1 = require("path");
var PATHSConfig = path_1.join(__dirname, "config/PATHS.json");
var PATHS = {
    node: "node",
    npm: "npm"
};
if (!fs_1.existsSync(path_1.join(__dirname, "config")))
    fs_1.mkdirSync(path_1.join(__dirname, "config"));
if (!fs_1.existsSync(path_1.join(__dirname, "config", "PATHS.json"))) {
    if (process.platform == "linux") {
        PATHS.node = child_process_1.execSync("which node")
            .toString()
            .split("\n")[0];
        PATHS.npm = child_process_1.execSync("which npm")
            .toString()
            .split("\n")[0];
    }
    else if (process.platform == "win32") {
        PATHS.node = child_process_1.execSync("where node")
            .toString()
            .split("\r\n")[0];
        PATHS.npm = child_process_1.execSync("where npm")
            .toString()
            .split("\r\n")[1];
    }
}
else {
    PATHS = JSON.parse(fs_1.readFileSync(PATHSConfig, "utf8"));
}
if (process.platform == "linux" && !fs_1.existsSync("/usr/bin/node"))
    child_process_1.execSync("sudo ln -s " + PATHS.node + " /usr/bin/node");
fs_1.writeFileSync(PATHSConfig, JSON.stringify(PATHS), "utf8");
var wrapper = express_1.default();
var router = express_1.default.Router();
wrapper.use("/", router);
var PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 2999;
var serverPORT = PORT + 1;
var server = child_process_1.fork("server.js", [], {
    cwd: __dirname,
    env: { PORT: serverPORT, NODE_ENV: "dev" }
});
// console.log(process.cwd(), __dirname);
function formatStdOut(stdout, response) {
    // format stdout to differentiate between errors and messages
    var data = stdout.toString();
    if (data.indexOf("fatal") != -1 ||
        data.indexOf("ERR") != -1 ||
        data.indexOf("error") != -1) {
        response.errors.push(data);
    }
    else {
        response.messages.push(data);
    }
    return response;
}
router.get("/", function (req, res) {
    res.send("Wrapper server");
});
router.post("/", function (req, res) {
    if (server) {
        server.kill();
        var git = child_process_1.execFile("git", ["pull"]);
        var response_1 = {
            errors: [],
            messages: []
        };
        git.stderr.on("data", function (data) {
            response_1 = formatStdOut(data, response_1);
        });
        git.stdout.on("data", function (data) {
            response_1 = formatStdOut(data, response_1);
        });
        git.on("close", function (code) {
            if (code == 0 && response_1.errors.length == 0) {
                setTimeout(function () {
                    if (server.killed) {
                        if (fs_1.existsSync("dist")) {
                            server = child_process_1.fork("dist/server.js", [], {
                                env: { PORT: serverPORT, NODE_ENV: "dev" }
                            });
                        }
                        else {
                            server = child_process_1.fork("server.js", [], {
                                env: { PORT: serverPORT, NODE_ENV: "dev" }
                            });
                        }
                        res.send(response_1);
                    }
                    else {
                        response_1.errors.push("Could not kill server process");
                        res.send(response_1);
                    }
                }, 100);
            }
            else {
                if (fs_1.existsSync("dist")) {
                    server = child_process_1.fork("dist/server.js", [], {
                        env: { PORT: serverPORT, NODE_ENV: "dev" }
                    });
                }
                else {
                    server = child_process_1.fork("server.js", [], {
                        env: { PORT: serverPORT, NODE_ENV: "dev" }
                    });
                }
                res.send(response_1);
                res.send(response_1);
            }
        });
    }
    else {
        res.send({
            errors: ["No server running"]
        });
    }
});
wrapper.listen(PORT, function () {
    console.log(PORT);
});
process.on("exit", function () {
    if (server) {
        process.exit();
        server.kill();
    }
});
process.on("SIGTERM", function () {
    if (server) {
        server.kill();
        process.exit();
    }
});
