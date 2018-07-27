import * as express from 'express';
const update = express.Router();

update.get('/', (req: express.Request, res: express.Response) => {
	res.send('Hello!');
});

export default update;
