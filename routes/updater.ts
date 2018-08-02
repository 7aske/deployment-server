import * as App from '../src/app';
import * as express from 'express';
import server from '../server';
const updater = express.Router();

updater.post('/', async (req: express.Request, res: express.Response) => {
	if (process.env.NODE_ENV == 'dev') console.log(req.body);
	try {
		const response: any = server.app.selfUpdate();
		res.send(response);
	} catch (error) {
		res.send(error);
	}
});

export default updater;
