import * as App from '../src/app';
import * as express from 'express';
import server from '../server';

const clear = express.Router();

clear.post('/', async (req: express.Request, res: express.Response) => {
	if (process.env.NODE_ENV == 'dev') console.log(req.body);
	const query: string | null = req.body.query;
	server.app.clear(query);
	res.send({ OK: 1 });
});

export default clear;
