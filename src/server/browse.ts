import { Request, Response, Router } from "express";
import { ChildServer } from "../app";
import server from "../server";

const browse = Router();

browse.post("/", async (req: Request, res: Response) => {
	if (process.env.NODE_ENV == "dev") console.log(req.body);
	const query: string | null = req.body.query;
	const response: ChildServer[] = server.app.browse(query);
	res.send(response);
});

export default browse;
