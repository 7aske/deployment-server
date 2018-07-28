import * as App from '../src/app';
import * as express from 'express';
import server from '../server';

const kill = express.Router();

kill.post('/', async (req: express.Request, res: express.Response) => {
	if (process.env.NODE_ENV == 'dev') console.log(req.body);
	const query: number | string | null = isNaN(req.body.query) ? req.body.query : parseInt(req.body.query);
	const response: Array<App.ChildServer> = server.app.killChild(query);
	if (response.length == 0)
		res.send({
			query: query,
			errors: ['Invalid PID,ID or name']
		});
	else res.send(response);
});

export default kill;
