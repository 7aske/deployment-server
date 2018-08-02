import * as App from '../app';
import * as express from 'express';
import server from '../server';

const remove = express.Router();
remove.post('/', async (req: express.Request, res: express.Response) => {
	if (process.env.NODE_ENV == 'dev') console.log(req.body);
	const query: string | null = req.body.query ? req.body.query : null;
	let response: Array<App.ChildServer> = [];
	let errors: Array<App.ChildServer> = [];
	const result: Array<App.ChildServer> = server.app.getChildrenFromJSON(query);
	if (process.env.NODE_ENV == 'dev') console.log(result.length + ' servers found');
	if (result.length > 0) {
		result.forEach(async (child, i, array) => {
			try {
				const removedRepo = await server.app.remove(child);
				response.push(server.app.formatChild(removedRepo));
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
			errors: ['No repositories found']
		});
	}
});

export default remove;
