import * as express from 'express';
const find = express.Router();

find.get('/', (req: express.Request, res: express.Response) => {
	res.send('Hello!');
});

export default find;
