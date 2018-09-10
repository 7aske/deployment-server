Object.defineProperty(exports, "__esModule", { value: true });
const child_process_1 = require("child_process");
const express = require("express");
const path_1 = require("path");
const fs_1 = require("fs");
const PATHS_config = path_1.join(__dirname, 'config/PATHS.json');
let PATHS = {
    node: 'node',
    npm: 'npm'
};
if (!fs_1.existsSync(path_1.join(__dirname, 'config')))
    fs_1.mkdirSync(path_1.join(__dirname, 'config'));
if (!fs_1.existsSync(path_1.join(__dirname, 'config', 'PATHS.json'))) {
    if (process.platform == 'linux') {
        PATHS.node = child_process_1.execSync('which node')
            .toString()
            .split('\n')[0];
        PATHS.npm = child_process_1.execSync('which npm')
            .toString()
            .split('\n')[0];
    }
    else if (process.platform == 'win32') {
        PATHS.node = child_process_1.execSync('where node')
            .toString()
            .split('\r\n')[0];
        PATHS.npm = child_process_1.execSync('where npm')
            .toString()
            .split('\r\n')[1];
    }
}
else {
    PATHS = JSON.parse(fs_1.readFileSync(PATHS_config, 'utf8'));
}
if (process.platform == 'linux' && !fs_1.existsSync('/usr/bin/node'))
    child_process_1.execSync(`sudo ln -s ${PATHS.node} /usr/bin/node`);
fs_1.writeFileSync(PATHS_config, JSON.stringify(PATHS), 'utf8');
const wrapper = express();
const router = express.Router();
wrapper.use('/', router);
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 2999;
const serverPORT = PORT + 1;
let server = child_process_1.fork('server.js', [], {
    cwd: __dirname,
    env: { PORT: serverPORT, NODE_ENV: 'dev' }
});
// console.log(process.cwd(), __dirname);
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
    if (server) {
        server.kill();
        const git = child_process_1.execFile('git', ['pull']);
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
                            server = child_process_1.fork('dist/server.js', [], {
                                env: { PORT: serverPORT, NODE_ENV: 'dev' }
                            });
                        }
                        else {
                            server = child_process_1.fork('server.js', [], {
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
                    server = child_process_1.fork('dist/server.js', [], {
                        env: { PORT: serverPORT, NODE_ENV: 'dev' }
                    });
                }
                else {
                    server = child_process_1.fork('server.js', [], {
                        env: { PORT: serverPORT, NODE_ENV: 'dev' }
                    });
                }
                res.send(response);
                res.send(response);
            }
        });
    }
    else {
        res.send({
            errors: ['No server running']
        });
    }
});
wrapper.listen(PORT, () => {
    console.log('Wrapper running on port ' + PORT);
});
process.on('exit', () => {
    if (server) {
        process.exit();
        server.kill();
    }
    console.log('Killing server');
});
process.on('SIGTERM', signal => {
    if (server) {
        server.kill();
        process.exit();
    }
    console.log('Killing server');
});
