import * as child_process from 'child_process';
import * as express from 'express';
import { existsSync } from 'fs';
const wrapper: express.Application = express();
const router: express.Router = express.Router();
wrapper.use('/', router);
const PORT: number = process.env.PORT ? parseInt(process.env.PORT) : 2999;
const serverPORT: number = PORT + 1;
let server: child_process.ChildProcess;
if (existsSync('dist')) {
	server = child_process.fork('dist/server.js', [], {
		env: { PORT: serverPORT, NODE_ENV: 'dev' }
	});
} else {
	server = child_process.fork('server.js', [], {
		env: { PORT: serverPORT, NODE_ENV: 'dev' }
	});
}

function formatStdOut(stdout: string | Buffer, response: any): any {
	//format stdout to differentiate between errors and messages
	const data = stdout.toString();
	if (
		data.indexOf('fatal') != -1 ||
		data.indexOf('ERR') != -1 ||
		data.indexOf('error') != -1
	) {
		response.errors.push(data);
	} else {
		response.messages.push(data);
	}
	return response;
}
router.get('/', (req: express.Request, res: express.Response) => {
	res.send('Wrapper server');
});
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
		if (process.env.NODE_ENV == 'dev')
			console.log('Git process exited with code', code);
		if (code == 0 && response.errors.length == 0) {
			setTimeout(() => {
				if (server.killed) {
					if (existsSync('dist')) {
						server = child_process.fork('dist/server.js', [], {
							env: { PORT: serverPORT, NODE_ENV: 'dev' }
						});
					} else {
						server = child_process.fork('server.js', [], {
							env: { PORT: serverPORT, NODE_ENV: 'dev' }
						});
					}
					res.send(response);
				} else {
					response.errors.push('Could not kill server process');
					res.send(response);
				}
			}, 100);
		} else {
			if (existsSync('dist')) {
				server = child_process.fork('dist/server.js', [], {
					env: { PORT: serverPORT, NODE_ENV: 'dev' }
				});
			} else {
				server = child_process.fork('server.js', [], {
					env: { PORT: serverPORT, NODE_ENV: 'dev' }
				});
			}
			res.send(response);
			res.send(response);
		}
	});
});
wrapper.on('exit', () => {
	if (server) server.kill();
	process.stdout.write('Killing server');
});
wrapper.on('SIGTERM', () => {
	if (server) server.kill();
	process.stdout.write('Killing server');
});
wrapper.on('SIGKILL', () => {
	if (server) server.kill();
	process.stdout.write('Killing server');
});
wrapper.listen(PORT, () => {
	console.log('Wrapper running on port ' + PORT);
});
