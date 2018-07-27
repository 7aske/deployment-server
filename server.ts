import App from './src/app';
import * as bodyParser from 'body-parser';
import * as express from 'express';
import Router from './router.js';
class Server {
	protected server: express.Application;
	public PORT: number;
	public app: App;
	constructor() {
		this.PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;
		this.app = new App(this.PORT);
		this.server = express();
		this.server.use(bodyParser.json());
		this.server.use(bodyParser.urlencoded({ extended: true }));
		this.server.use('/', new Router().routes);
		this.server.listen(this.PORT, () => console.log(`Deployment server started on port ${this.PORT}`));
	}
}

const server = new Server();

export default server;
