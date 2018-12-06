import { Request, Response,  Router } from "express";
import { ChildServer } from "../app";
import server from "../server";

const update = Router();

update.post("/", async (req: Request, res: Response) => {
	if (process.env.NODE_ENV == "dev") console.log(req.body);
	const query: string | null = req.body.query;
	const result: ChildServer[] = server.app.getChildrenFromJSON(query);
	const response: ChildServer[] = [];
	const errors: ChildServer[] = [];
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
			errors: ["No servers found"],
			query
		});
	}
});

export default update;
