import App from './app';
import * as bodyParser from 'body-parser';
import * as express from 'express';
import Router from './router.js';
import { readFileSync } from 'fs';
import { join } from 'path';
interface PATHS {
	node: string;
	npm: string;
}
const PATHS_config = join(__dirname, 'config/PATHS.json');
let PATHS: PATHS = JSON.parse(readFileSync(PATHS_config, 'utf8'));
console.log(PATHS);
class Server {
	protected server: express.Application;
	public PORT: number;
	public app: App;
	constructor() {
		this.PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;
		this.app = new App(this.PORT, PATHS);
		this.server = express();
		this.server.use(bodyParser.json());
		this.server.use(bodyParser.urlencoded({ extended: true }));
		this.server.use('/', new Router().routes);
		this.server.listen(this.PORT, () =>
			console.log(`Deployment server started on port ${this.PORT}`)
		);
	}
}

const server = new Server();

export default server;
