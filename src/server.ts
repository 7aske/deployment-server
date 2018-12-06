import * as bodyParser from "body-parser";
import { execSync } from "child_process";
import express, { Application } from "express";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
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

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
export const deployer = new Deployer(PORT, PATHS);
const server = express();
server.use(bodyParser.json());
server.use(bodyParser.urlencoded({ extended: true }));
server.use("/", router);
server.listen(PORT, () => console.log(PORT));

export default server;
