import { Request, Response, Router } from "express";
import server from "../server";
const root = Router();

root.get("/", (req: Request, res: Response) => {
	const deployed = server.app.getChildrenFromJSON(null);
	const running = server.app.getRunningChildren(null);
	res.json({deployed, running});
});

export default root;
