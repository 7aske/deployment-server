import * as child_process from 'child_process';
import * as express from 'express';
const wrapper: express.Application = express();
const router: express.Router = express.Router();
const PORT = process.env.PORT || 2999;
let server: child_process.ChildProcess = child_process.execFile('node', ['server.js']);
server.stdout.pipe(process.stdout);
server.stderr.pipe(process.stdout);
function formatStdOut(stdout: string | Buffer, response: any): any {
	//format stdout to differentiate between errors and messages
	const data = stdout.toString();
	if (data.indexOf('fatal') != -1 || data.indexOf('ERR') != -1 || data.indexOf('error') != -1) {
		response.errors.push(data);
	} else {
		response.messages.push(data);
	}
	return response;
}
router.post('/', (req: express.Request, res: express.Response) => {
	server.kill();
	const git = child_process.execFile('git', ['pull']);
	let response: any = {
		messages: [],
		errors: []
	};
	git.stderr.on('data', data => {
		response = formatStdOut(data, response);
	});

	git.stdout.on('data', data => {
		response = formatStdOut(data, response);
	});
	git.on('close', code => {
		if (process.env.NODE_ENV == 'dev') console.log('Git process exited with code', code);
		if (code == 0 && response.errors.length == 0) {
			server = child_process.execFile('node', ['server.js']);
			server.stdout.pipe(process.stdout);
			server.stderr.pipe(process.stdout);
			res.send(response);
		} else {
			res.send(response);
		}
	});
});
wrapper.listen(PORT, () => {
	console.log('Wrapper running on port ' + PORT);
});
