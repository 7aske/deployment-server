import * as bodyParser from "body-parser";
import { execSync } from "child_process";
import express, { Application } from "express";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import http from "http";
import https from "https";
import morgan from "morgan";
import { join } from "path";
import Deployer from "./deployer";
import router from "./router";

interface PATHS {
	node: string;
	npm: string;
}

const PATHSConfigFolder = join(process.cwd(), "config");
const PATHSConfigFile = join(PATHSConfigFolder, "PATHS.json");
let PATHS: PATHS = {
	node: "node",
	npm: "npm"
};

if (!existsSync(PATHSConfigFolder)) {
	mkdirSync(PATHSConfigFolder);
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
} else {
	PATHS = JSON.parse(readFileSync(PATHSConfigFile, "utf8"));
}
if (process.platform == "linux" && !existsSync("/usr/bin/node")) execSync(`sudo ln -s ${PATHS.node} /usr/bin/node`);
writeFileSync(PATHSConfigFile, JSON.stringify(PATHS));

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 80;
export const deployer = new Deployer(PORT, PATHS);
const server = express();

server.use(
	morgan(
		":method :url HTTP/:http-version :status :res[content-length] - :response-time m"
	)
);
server.use(bodyParser.json());
server.use(bodyParser.urlencoded({extended: true}));
server.use("/", (req: express.Request, res: express.Response) => {
	// noinspection TypeScriptValidateJSTypes
	console.log(req.url);
	res.status(301).redirect("https://" + req.headers.host + req.url);
});
server.use("/", router);

const cert = readFileSync(join(process.cwd(), "config/ssl/7aske.servebeer.com/cert1.pem"));
const key = readFileSync(join(process.cwd(), "config/ssl/7aske.servebeer.com/privkey1.pem"));
const ca = readFileSync(join(process.cwd(), "config/ssl/7aske.servebeer.com/chain1.pem"));

const cred = {
	ca,
	cert,
	key
};
const httpServer = http.createServer(server);
const httpsServer = https.createServer(cred, server);
httpServer.listen(PORT, () => console.log(PORT));
httpsServer.listen(443, () => console.log(443));
// server.listen(PORT, () => console.log(PORT));

export default server;
