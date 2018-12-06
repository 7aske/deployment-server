import {Request, Response, Router } from "express";
import Deployer, { ChildServer } from "../deployer";
import { deployer } from "../server";

const run = Router();
run.post("/", async (req: Request, res: Response) => {
	if (process.env.NODE_ENV == "dev") console.log(req.body);
	const query: string | null = isNaN(req.body.query) ? req.body.query : parseInt(req.body.query, 10);
	const response: ChildServer[] = [];
	const errors: ChildServer[] = [];
	const result: ChildServer[] = deployer.getChildrenFromJSON(query);
	if (result.length > 0) {
		result.forEach(async (child, i, array) => {
			try {
				const newChild = await deployer.run(child);
				response.push(Deployer.formatChild(newChild));
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

export default run;
