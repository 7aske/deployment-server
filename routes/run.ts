import * as express from 'express';
const run = express.Router();

run.get('/', (req: express.Request, res: express.Response) => {
	res.send('Hello!');
});

export default run;
