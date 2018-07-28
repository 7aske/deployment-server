import * as App from '../src/app';
import * as express from 'express';
import server from '../server';

const run = express.Router();
run.post('/', async (req: express.Request, res: express.Response) => {
	if (process.env.NODE_ENV == 'dev') console.log(req.body);
	const query: string | null = isNaN(req.body.query) ? req.body.query : parseInt(req.body.query);
	let response: Array<App.ChildServer> = [];
	let errors: Array<App.ChildServer> = [];
	const result: Array<App.ChildServer> = server.app.getChildrenFromJSON(query);
	if (process.env.NODE_ENV == 'dev') console.log(result.length, 'servers found');
	if (result.length > 0) {
		result.forEach(async (child, i, array) => {
			try {
				const newChild = await server.app.run(child);
				response.push(server.app.formatChild(newChild));
			} catch (err) {
				errors.push(err);
			}
			if (i == array.length - 1) {
				if (errors.length > 0) res.send(errors);
				else res.send(response);
			}
		});
	} else {
		res.send({
			query: query,
			errors: ['No servers found']
		});
	}
});

export default run;
