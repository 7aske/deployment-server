import { Request, Response, Router} from "express";
import { join } from "path";

const client = Router();
client.get("/", (req: Request, res: Response) => {
	res.sendFile(join(process.cwd(), "dist/client/dist/renderer/views/renderer.html"));
});

export default client;
