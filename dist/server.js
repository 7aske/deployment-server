"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var bodyParser = __importStar(require("body-parser"));
var child_process_1 = require("child_process");
var express_1 = __importDefault(require("express"));
var fs_1 = require("fs");
var http_1 = __importDefault(require("http"));
var https_1 = __importDefault(require("https"));
var morgan_1 = __importDefault(require("morgan"));
var path_1 = require("path");
var deployer_1 = __importDefault(require("./deployer"));
var router_1 = __importDefault(require("./router"));
var PATHSConfigFolder = path_1.join(process.cwd(), "config");
var PATHSConfigFile = path_1.join(PATHSConfigFolder, "PATHS.json");
var PATHS = {
    node: "node",
    npm: "npm"
};
if (!fs_1.existsSync(PATHSConfigFolder)) {
    fs_1.mkdirSync(PATHSConfigFolder);
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
    PATHS = JSON.parse(fs_1.readFileSync(PATHSConfigFile, "utf8"));
}
if (process.platform == "linux" && !fs_1.existsSync("/usr/bin/node"))
    child_process_1.execSync("sudo ln -s " + PATHS.node + " /usr/bin/node");
fs_1.writeFileSync(PATHSConfigFile, JSON.stringify(PATHS));
var PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 80;
exports.deployer = new deployer_1.default(PORT, PATHS);
var server = express_1.default();
server.use(morgan_1.default(":method :url HTTP/:http-version :status :res[content-length] - :response-time m"));
server.use(bodyParser.json());
server.use(bodyParser.urlencoded({ extended: true }));
server.use("/", function (req, res, next) {
    // noinspection TypeScriptValidateJSTypes
    if (req.protocol == "http:")
        res.status(302).redirect("https://" + req.headers.host + req.url);
    else
        next();
});
server.use("/", router_1.default);
var cert = fs_1.readFileSync(path_1.join(process.cwd(), "config/ssl/7aske.servebeer.com/cert1.pem"));
var key = fs_1.readFileSync(path_1.join(process.cwd(), "config/ssl/7aske.servebeer.com/privkey1.pem"));
var ca = fs_1.readFileSync(path_1.join(process.cwd(), "config/ssl/7aske.servebeer.com/chain1.pem"));
var cred = {
    ca: ca,
    cert: cert,
    key: key
};
var httpServer = http_1.default.createServer(server);
var httpsServer = https_1.default.createServer(cred, server);
httpServer.listen(PORT, function () { return console.log(PORT); });
httpsServer.listen(443, function () { return console.log(443); });
// server.listen(PORT, () => console.log(PORT));
exports.default = server;
