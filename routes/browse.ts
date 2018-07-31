import * as App from '../src/app';
import * as express from 'express';
import server from '../server';

const browse = express.Router();

browse.post('/', async (req: express.Request, res: express.Response) => {
	if (process.env.NODE_ENV == 'dev') console.log(req.body);
	const query: string | null = req.body.query;
	const response: Array<App.ChildServer> = server.app.browse(query);
	res.send(response);
});

export default browse;
