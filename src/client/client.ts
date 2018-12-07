import express, { Request, Response, Router} from "express";
import { join } from "path";

const client = Router();
client.get("/", (req: Request, res: Response) => {
	res.sendFile(join(process.cwd(), "dist/client/views/renderer.html"));
});

export default client;
