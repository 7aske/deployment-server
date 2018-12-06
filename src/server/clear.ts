import { Request, Response, Router } from "express";
import { deployer } from "../server";

const clear = Router();

clear.post("/", async (req: Request, res: Response) => {
	if (process.env.NODE_ENV == "dev") console.log(req.body);
	const query: string | null = req.body.query;
	deployer.clear(query);
	res.send({OK: 1});
});

export default clear;
