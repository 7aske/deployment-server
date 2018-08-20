"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const child_process = require("child_process");
const express = require("express");
const fs_1 = require("fs");
const wrapper = express();
const router = express.Router();
wrapper.use('/', router);
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 2999;
const serverPORT = PORT + 1;
let server;
if (fs_1.existsSync('dist')) {
    server = child_process.fork('dist/server.js', [], {
        env: { PORT: serverPORT, NODE_ENV: 'dev' }
    });
}
else {
    server = child_process.fork('server.js', [], {
        env: { PORT: serverPORT, NODE_ENV: 'dev' }
    });
}
function formatStdOut(stdout, response) {
    //format stdout to differentiate between errors and messages
    const data = stdout.toString();
    if (data.indexOf('fatal') != -1 ||
        data.indexOf('ERR') != -1 ||
        data.indexOf('error') != -1) {
        response.errors.push(data);
    }
    else {
        response.messages.push(data);
    }
    return response;
}
router.get('/', (req, res) => {
    res.send('Wrapper server');
});
router.post('/', (req, res) => {
    server.kill();
    const git = child_process.execFile('git', ['pull']);
    let response = {
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
                    if (fs_1.existsSync('dist')) {
                        server = child_process.fork('dist/server.js', [], {
                            env: { PORT: serverPORT, NODE_ENV: 'dev' }
                        });
                    }
                    else {
                        server = child_process.fork('server.js', [], {
                            env: { PORT: serverPORT, NODE_ENV: 'dev' }
                        });
                    }
                    res.send(response);
                }
                else {
                    response.errors.push('Could not kill server process');
                    res.send(response);
                }
            }, 100);
        }
        else {
            if (fs_1.existsSync('dist')) {
                server = child_process.fork('dist/server.js', [], {
                    env: { PORT: serverPORT, NODE_ENV: 'dev' }
                });
            }
            else {
                server = child_process.fork('server.js', [], {
                    env: { PORT: serverPORT, NODE_ENV: 'dev' }
                });
            }
            res.send(response);
            res.send(response);
        }
    });
});
process.on('exit', () => {
    if (server)
        server.kill();
    console.log('Killing server');
});
process.on('SIGTERM', signal => {
    if (server)
        server.kill();
    console.log('Killing server');
});
wrapper.listen(PORT, () => {
    console.log('Wrapper running on port ' + PORT);
});
