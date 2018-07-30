import * as express from 'express';
import * as morgan from 'morgan';
import deploy from './routes/deploy.js';
import find from './routes/find.js';
import kill from './routes/kill.js';
import run from './routes/run.js';
import update from './routes/update.js';
import remove from './routes/remove.js';
export default class Router {
	public routes: express.Router;
	constructor() {
		this.routes = express.Router();
		this.routes.use(morgan('dev'));
		this.routes.get('/', (req: express.Request, res: express.Response) => {
			res.send('Hello!');
		});
		this.routes.use('/deploy', deploy);
		this.routes.use('/find', find);
		this.routes.use('/kill', kill);
		this.routes.use('/run', run);
		this.routes.use('/update', update);
		this.routes.use('/remove', remove);
	}
}

//export default new Router().router;
