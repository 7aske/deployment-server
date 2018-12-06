import * as bodyParser from "body-parser";
import express, { Application } from "express";
import { readFileSync } from "fs";
import { join } from "path";
import Deployer from "./deployer";
import router from "./router";

interface PATHS {
	node: string;
	npm: string;
}

const PATHSConfig = join(__dirname, "config/PATHS.json");
const PATHS: PATHS = JSON.parse(readFileSync(PATHSConfig, "utf8"));

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
export const deployer = new Deployer(PORT, PATHS);
const server = express();
server.use(bodyParser.json());
server.use(bodyParser.urlencoded({extended: true}));
server.use("/", router);
server.listen(PORT, () =>
	console.log(PORT)
);

export default server;
