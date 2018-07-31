import * as App from '../src/app';
import * as express from 'express';
import { platform } from 'os';
import server from '../server';
import * as id from 'shortid';
import { URL } from 'url';

const deploy = express.Router();

deploy.post('/', async (req: express.Request, res: express.Response) => {
	if (process.env.NODE_ENV == 'dev') console.log(req.body);
	let url: URL;
	try {
		url = new URL(req.body.query);
	} catch (err) {
		url = err.input;
	}
	if (url.hostname == 'github.com') {
		let check: Array<App.ChildServer> = server.app.getChildrenFromJSON(req.body.repository.match(/.*\/(.*)$/)[1]);
		let err: App.ChildServer | null = null;
		let child: App.ChildServer = {
			repo: url.toString(),
			name: url.toString().match(/.*\/(.*)$/)![1],
			id: id.generate(),
			dir: `${server.app.repoDir}/${url.toString().match(/.*\/(.*)$/)![1]}`,
			platform: platform(),
			errors: [],
			messages: []
		};
		if (process.env.NODE_ENV == 'dev') console.log(check, child);
		if (check.length == 1) {
			child = check[0];
			res.send({
				query: url,
				repo: child.repo,
				id: child.id,
				name: child.name,
				errors: ['Repository already deployed. Use run [name | id] or update [name | id].']
			});
		} else if (check.length > 1) {
			res.send({
				query: url,
				errors: ['Multiple repos found. Please be more specific.']
			});
		} else {
			try {
				child = await server.app.retrieve(child);
				//if (process.env.NODE_ENV == 'dev') console.info(child);
			} catch (error) {
				err = error;
				//if (process.env.NODE_ENV == 'dev') console.error(child);
			}
			try {
				if (!err) child = await server.app.install(child);
				//if (process.env.NODE_ENV == 'dev')console.info(child);
			} catch (error) {
				err = error;
				//if (process.env.NODE_ENV == 'dev') console.error(child);
			}
			try {
				if (!err) child = await server.app.run(child);
				//if (process.env.NODE_ENV == 'dev')console.info(child);
			} catch (error) {
				err = error;
				//if (process.env.NODE_ENV == 'dev') console.error(child);
			}
			if (!err) {
				res.send(server.app.formatChild(child));
			} else {
				res.send(server.app.formatChild(err));
			}
		}
	} else {
		res.send({
			query: url,
			errors: 'Repository URL hostname must be "github.com"'
		});
	}
});

export default deploy;
