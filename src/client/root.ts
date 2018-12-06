import { Request, Response, Router } from "express";
import { deployer } from "../server";

const root = Router();

root.get("/", (req: Request, res: Response) => {
	const deployed = deployer.getChildrenFromJSON(null);
	const running = deployer.getRunningChildren(null);
	res.json({deployed, running});
});

export default root;
