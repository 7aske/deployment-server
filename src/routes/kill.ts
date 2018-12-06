import { Request, Response, Router } from "express";
import { ChildServer } from "../app";
import server from "../server";

const kill = Router();

kill.post("/", async (req: Request, res: Response) => {
	if (process.env.NODE_ENV == "dev") console.log(req.body);
	const query: number | string | null = isNaN(req.body.query) ? req.body.query : parseInt(req.body.query, 10);
	const children: ChildServer[] | ChildServer | null = server.app.getRunningChildren(query);
	if (children instanceof Array) {
		const response: ChildServer[] = [];
		const errors: ChildServer[] = [];
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
			errors: ["Invalid PID,ID or name"],
			query
		})
		;
	}
});

export default kill;
