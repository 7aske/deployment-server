import * as bodyParser from "body-parser";
import express, { Application } from "express";
import { readFileSync } from "fs";
import { join } from "path";
import App from "./app";
import Router from "./router.js";

interface PATHS {
	node: string;
	npm: string;
}

const PATHSConfig = join(__dirname, "config/PATHS.json");
const PATHS: PATHS = JSON.parse(readFileSync(PATHSConfig, "utf8"));

class Server {
	protected server: Application;
	public PORT: number;
	public app: App;

	constructor() {
		this.PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
		this.app = new App(this.PORT, PATHS);
		this.server = express();
		this.server.use(bodyParser.json());
		this.server.use(bodyParser.urlencoded({extended: true}));
		this.server.use("/", new Router().routes);
		this.server.listen(this.PORT, () =>
			console.log(this.PORT)
		);
	}
}

const server = new Server();

export default server;
