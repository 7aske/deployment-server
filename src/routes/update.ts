import * as App from '../app';
import * as express from 'express';
import server from '../server';
const update = express.Router();

update.post('/', async (req: express.Request, res: express.Response) => {
	if (process.env.NODE_ENV == 'dev') console.log(req.body);
	const query: string | null = req.body.query;
	let result: Array<App.ChildServer> = server.app.getChildrenFromJSON(query);
	let response: Array<App.ChildServer> = [];
	let errors: Array<App.ChildServer> = [];
	if (result.length > 0) {
		result.forEach(async (child, i, array) => {
			try {
				const newChild = child;
				newChild.messages = [];
				await server.app.retrieve(newChild);
			} catch (err) {
				errors.push(err);
			}
			try {
				const newChild = await server.app.install(child);
				response.push(newChild);
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

export default update;
