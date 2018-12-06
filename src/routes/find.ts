import { Request, Response, Router } from "express";
import App, { ChildServer } from "../app";
import server from "../server";

const find = Router();

find.post("/", async (req: Request, res: Response) => {
	if (process.env.NODE_ENV == "dev") console.log(req.body);
	const query: number | string | null = req.body.query;
	const result: ChildServer[] | ChildServer | null = server.app.getRunningChildren(query);
	const response: ChildServer[] = [];
	if (result instanceof Array) {
		if (result.length > 0) {
			result.forEach(child => {
				response.push(App.formatChild(child));
			});
		}
	} else if (result) {
		response.push(App.formatChild(result));
	}
	res.send(response);
});

export default find;
