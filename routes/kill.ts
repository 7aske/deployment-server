import * as express from 'express';
const kill = express.Router();

kill.get('/', (req: express.Request, res: express.Response) => {
	res.send('Hello!');
});

export default kill;
