import App from './app';
import { execSync } from 'child_process';
import * as bodyParser from 'body-parser';
import * as express from 'express';
import Router from './router.js';
interface PATHS {
	node: string;
	npm: string;
}
const PATHS: PATHS = {
	node: 'node',
	npm: 'npm'
};
if (process.platform == 'linux') {
	PATHS.node = execSync('which node')
		.toString()
		.slice(0, -1);
	PATHS.npm = execSync('which npm')
		.toString()
		.slice(0, -1);
} else if (process.platform == 'win32') {
	PATHS.node = execSync('where node')
		.toString()
		.split('\r\n')[0];
	PATHS.npm = execSync('where npm')
		.toString()
		.split('\r\n')[1];
}
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
