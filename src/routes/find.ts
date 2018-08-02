import * as App from '../app';
import * as express from 'express';
import server from '../server';

const find = express.Router();

find.post('/', async (req: express.Request, res: express.Response) => {
	if (process.env.NODE_ENV == 'dev') console.log(req.body);
	const query: number | string | null = req.body.query;
	const result: Array<App.ChildServer> | App.ChildServer | null = server.app.getRunningChildren(query);
	let response: Array<App.ChildServer> = [];
	if (result instanceof Array) {
		if (result.length > 0) {
			result.forEach(child => {
				response.push(server.app.formatChild(child));
			});
		}
	} else if (result) {
		response.push(server.app.formatChild(result));
	}
	res.send(response);
});

export default find;
