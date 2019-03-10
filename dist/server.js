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
var cookie_parser_1 = __importDefault(require("cookie-parser"));
var express_1 = __importDefault(require("express"));
var fs_1 = __importDefault(require("fs"));
var http_1 = __importDefault(require("http"));
var https_1 = __importDefault(require("https"));
var morgan_1 = __importDefault(require("morgan"));
var path_1 = require("path");
var deployer_1 = __importDefault(require("./deployer"));
var auth_1 = __importDefault(require("./middleware/auth"));
var https_redirect_1 = require("./middleware/https-redirect");
var router_1 = __importDefault(require("./router"));
var rmrf = function (path) {
    if (fs_1.default.existsSync(path)) {
        if (fs_1.default.lstatSync(path).isDirectory()) {
            fs_1.default.readdirSync(path).forEach(function (file, index) {
                var curPath = path + "/" + file;
                if (fs_1.default.lstatSync(curPath).isDirectory()) {
                    rmrf(curPath);
                }
                else {
                    fs_1.default.unlinkSync(curPath);
                }
            });
            fs_1.default.rmdirSync(path);
        }
        else {
            fs_1.default.unlinkSync(path);
        }
    }
};
var PATHSConfigFolder = path_1.join(process.cwd(), "config");
var PATHSConfigFile = path_1.join(PATHSConfigFolder, "PATHS.json");
var PATHS = {
    node: "node",
    npm: "npm"
};
if (!fs_1.default.existsSync(PATHSConfigFolder)) {
    fs_1.default.mkdirSync(PATHSConfigFolder);
}
else {
    PATHS = JSON.parse(fs_1.default.readFileSync(PATHSConfigFile, "utf8"));
}
try {
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
catch (e) {
    console.log("Server couldn't find 'node' and 'npm' executables.\nMake sure you specify them in PATHS.json");
}
var PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 80;
var CHILD_PORT = process.env.CHILD_PORT ? parseInt(process.env.CHILD_PORT, 10) : 3000;
exports.deployer = new deployer_1.default(CHILD_PORT, PATHS);
var server = express_1.default();
server.use(morgan_1.default(":method :url (:remote-addr)\n:date[clf] - [:status] - :response-time ms"));
// CORS
server.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});
server.use(bodyParser.json());
server.use(bodyParser.urlencoded({ extended: true }));
server.use(cookie_parser_1.default());
if (process.argv.indexOf("--ssl") != -1)
    server.use(https_redirect_1.httpsRedirect);
if (process.argv.indexOf("--auth") != -1)
    server.use("/", auth_1.default);
server.use("/", router_1.default);
if (process.argv.indexOf("--ssl") != -1) {
    var cert = fs_1.default.readFileSync(path_1.join(process.cwd(), "config/ssl/cert.pem"));
    var key = fs_1.default.readFileSync(path_1.join(process.cwd(), "config/ssl/privkey.pem"));
    var ca = fs_1.default.readFileSync(path_1.join(process.cwd(), "config/ssl/chain.pem"));
    var cred = {
        ca: ca,
        cert: cert,
        key: key
    };
    var httpsServer = https_1.default.createServer(cred, server);
    httpsServer.listen(443, function () { return console.log(443); });
}
if (process.argv.indexOf("--client") != -1) {
    var clientFolder_1 = path_1.join(process.cwd(), "dist/client");
    var junkFiles = [
        "config",
        "dist/main",
        "src",
        ".git",
        ".gitignore",
        "package.json",
        "package-lock.json",
        "tsconfig.json",
        "tslint.json"
    ];
    rmrf(clientFolder_1);
    var git = child_process_1.execSync("git clone https://github.com/7aske/deployment-client-electron ./dist/client", {
        stdio: "inherit"
    });
    junkFiles.forEach(function (f) { return rmrf(path_1.join(clientFolder_1, f)); });
}
else {
    console.log("You are running the server without client. (no --client option)");
}
var httpServer = http_1.default.createServer(server);
httpServer.listen(PORT, function () { return console.log(PORT); });
httpServer.on("error", function (error) {
    if (error.code == "EACCES") {
        httpServer.listen(8080, function () { return console.log("Cannot access " + PORT + ". Defaulting to port 8080"); });
    }
});
exports.default = server;
