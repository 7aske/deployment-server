import * as App from '../src/app';
import * as express from 'express';
import server from '../server';

const kill = express.Router();

kill.post('/', async (req: express.Request, res: express.Response) => {
	if (process.env.NODE_ENV == 'dev') console.log(req.body);
	const query: number | string | null = isNaN(req.body.query) ? req.body.query : parseInt(req.body.query);
	const children: Array<App.ChildServer> | App.ChildServer | null = server.app.getRunningChildren(query);
	if (children instanceof Array) {
		let response: Array<App.ChildServer> = [];
		let errors: Array<App.ChildServer> = [];
		children.forEach(async (child, i) => {
			try {
				const killed = await server.app.killChild(child);
				if (killed) response.push(killed);
			} catch (error) {
				errors.push(error);
			}
			if (i == children.length - 1) {
				if (errors.length > 0) res.send(errors);
				else res.send(response);
			}
		});
	} else if (children) {
		try {
			const killed = await server.app.killChild(children);
			if (killed) res.send([killed]);
		} catch (error) {
			res.send([error]);
		}
	} else {
		res.send({
			query: query,
			errors: ['Invalid PID,ID or name']
		});
	}
});

export default kill;
