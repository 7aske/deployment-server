import { Request, Response, Router } from "express";
import { platform } from "os";
import * as id from "shortid";
import { URL } from "url";
import App, {ChildServer} from "../app";
import server from "../server";

const deploy = Router();

deploy.post("/", async (req: Request, res: Response) => {
	if (process.env.NODE_ENV == "dev") console.log(req.body);
	let url: URL;
	try {
		url = new URL(req.body.query);
	} catch (err) {
		url = err.input;
	}
	if (url.hostname == "github.com") {
		const check: ChildServer[] = server.app.getChildrenFromJSON(req.body.query.match(/.*\/(.*)$/)[1]);
		let err: ChildServer | null = null;
		let child: ChildServer = {
			dir: `${server.app.repoDir}/${url.toString().match(/.*\/(.*)$/)![1]}`,
			errors: [],
			id: id.generate(),
			messages: [],
			name: url.toString().match(/.*\/(.*)$/)![1],
			platform: platform(),
			repo: url.toString()
		};
		if (check.length == 1) {
			child = check[0];
			res.send({
				errors: ["Repository already deployed. Use run [name | id] or update [name | id]."],
				id: child.id,
				name: child.name,
				query: url,
				repo: child.repo
			});
		} else if (check.length > 1) {
			res.send({
				errors: ["Multiple repos found. Please be more specific."],
				query: url
			});
		} else {
			try {
				child = await server.app.retrieve(child);
				// if (process.env.NODE_ENV == 'dev') console.info(child);
			} catch (error) {
				err = error;
				// if (process.env.NODE_ENV == 'dev') console.error(child);
			}
			try {
				if (!err) child = await server.app.install(child);
				// if (process.env.NODE_ENV == 'dev')console.info(child);
			} catch (error) {
				err = error;
				// if (process.env.NODE_ENV == 'dev') console.error(child);
			}
			try {
				if (!err) child = await server.app.run(child);
				// if (process.env.NODE_ENV == 'dev')console.info(child);
			} catch (error) {
				err = error;
				// if (process.env.NODE_ENV == 'dev') console.error(child);
			}
			if (!err) {
				res.send(App.formatChild(child));
			} else {
				res.send(App.formatChild(err));
			}
		}
	} else {
		res.send({
			errors: "Repository URL hostname must be \"github.com\"",
			query: url
		});
	}
});

export default deploy;
