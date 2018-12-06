import { Request, Response, Router } from "express";
import { ChildServer } from "../deployer";
import { deployer } from "../server";

const browse = Router();

browse.post("/", async (req: Request, res: Response) => {
	if (process.env.NODE_ENV == "dev") console.log(req.body);
	const query: string | null = req.body.query;
	const response: ChildServer[] = deployer.browse(query);
	res.send(response);
});

export default browse;
