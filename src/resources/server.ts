import express from "express";

const app = express();
const router = express.Router();
import { readFileSync } from "fs";
import { join } from "path";

const PORT: number = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const main: string = JSON.parse(readFileSync("package.json", "utf8")).main;
app.use((req, res, next) => {
	if (req.url.match(new RegExp(/git/, "gi"))){
		res.status(404);
	} else {
		next();
	}
});
app.use(express.static(__dirname));
app.use("/", router);

router.get("/", (req: express.Request, res: express.Response) => {
	res.sendFile(join(__dirname, main));
});

app.listen(PORT, () => {
	console.log(PORT);
});
