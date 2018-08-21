import * as express from 'express';
const app: express.Application = express();
const router: express.Router = express.Router();
import { readFileSync } from 'fs';
import { join } from 'path';
const PORT: number = process.env.PORT ? parseInt(process.env.PORT) : 3000;
const main: string = JSON.parse(readFileSync('package.json', 'utf8')).main;
app.use(express.static(__dirname));
app.use('/', router);
router.get('/', (req: express.Request, res: express.Response) => {
	res.sendFile(join(__dirname, main));
});
app.listen(PORT, () => {
	console.log(`Server listening on port ${PORT}`);
});
