import * as bodyParser from "body-parser";
import {execSync} from "child_process";
import cookieParser from "cookie-parser";
import express from "express";
import fs from "fs";
import http from "http";
import https from "https";
import morgan from "morgan";
import {join} from "path";
import Deployer from "./deployer";
import auth from "./middleware/auth";
import {httpsRedirect} from "./middleware/https-redirect";
import router from "./router";

interface PATHS {
    node: string;
    npm: string;
}

const rmrf = (path: string) => {
    if (fs.existsSync(path)) {
        if (fs.lstatSync(path).isDirectory()) {
            fs.readdirSync(path).forEach((file: string, index: number) => {
                const curPath = path + "/" + file;
                if (fs.lstatSync(curPath).isDirectory()) {
                    rmrf(curPath);
                } else {
                    fs.unlinkSync(curPath);
                }
            });
            fs.rmdirSync(path);
        } else {
            fs.unlinkSync(path);
        }
    }
};

const PATHSConfigFolder = join(process.cwd(), "config");
const PATHSConfigFile = join(PATHSConfigFolder, "PATHS.json");
let PATHS: PATHS = {
    node: "node",
    npm: "npm"
};

if (!fs.existsSync(PATHSConfigFolder)) {
    fs.mkdirSync(PATHSConfigFolder);
} else {
    PATHS = JSON.parse(fs.readFileSync(PATHSConfigFile, "utf8"));
}
try {
    if (process.platform == "linux") {
        PATHS.node = execSync("which node")
            .toString()
            .split("\n")[0];
        PATHS.npm = execSync("which npm")
            .toString()
            .split("\n")[0];
    } else if (process.platform == "win32") {
        PATHS.node = execSync("where node")
            .toString()
            .split("\r\n")[0];
        PATHS.npm = execSync("where npm")
            .toString()
            .split("\r\n")[1];
    }
} catch (e) {
    console.log("Server couldn't find 'node' and 'npm' executables.\nMake sure you specify them in PATHS.json");
}
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 80;
const CHILD_PORT = process.env.CHILD_PORT ? parseInt(process.env.CHILD_PORT, 10) : 3000;
export const deployer = new Deployer(CHILD_PORT, PATHS);
const server = express();
server.use(morgan(":method :url (:remote-addr)\n:date[clf] - [:status] - :response-time ms"));
// CORS
server.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});
server.use(bodyParser.json());
server.use(bodyParser.urlencoded({extended: true}));
server.use(cookieParser());
if (process.argv.indexOf("--ssl") != -1)
    server.use(httpsRedirect);
if (process.argv.indexOf("--auth") != -1) server.use("/", auth);
server.use("/", router);

if (process.argv.indexOf("--ssl") != -1) {
    const cert = fs.readFileSync(join(process.cwd(), "config/ssl/7aske.servebeer.com/cert1.pem"));
    const key = fs.readFileSync(join(process.cwd(), "config/ssl/7aske.servebeer.com/privkey1.pem"));
    const ca = fs.readFileSync(join(process.cwd(), "config/ssl/7aske.servebeer.com/chain1.pem"));

    const cred = {
        ca,
        cert,
        key
    };
    const httpsServer = https.createServer(cred, server);
    httpsServer.listen(443, () => console.log(443));
}

if (process.argv.indexOf("--client") != -1) {
    const clientFolder = join(process.cwd(), "dist/client");
    const junkFiles = [
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
    rmrf(clientFolder);
    const git = execSync("git clone https://github.com/7aske/deployment-client-electron ./dist/client", {
        stdio: "inherit"
    });
    junkFiles.forEach(f => rmrf(join(clientFolder, f)));
} else {
    console.log("You are running the server without client. (no --client option)");
}
const httpServer = http.createServer(server);

httpServer.listen(PORT, () => console.log(PORT));
httpServer.on("error", (error: any) => {
    if (error.code == "EACCES") {
        httpServer.listen(8080, () => console.log(`Cannot access ${PORT}. Defaulting to port 8080`));
    }
});
export default server;
