"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = require("./app");
const child_process_1 = require("child_process");
const bodyParser = require("body-parser");
const express = require("express");
const router_js_1 = require("./router.js");
const PATHS = {
    node: 'node',
    npm: 'npm'
};
if (process.platform == 'linux') {
    PATHS.node = child_process_1.execSync('which node')
        .toString()
        .slice(0, -1);
    PATHS.npm = child_process_1.execSync('which npm')
        .toString()
        .slice(0, -1);
}
else if (process.platform == 'win32') {
    PATHS.node = child_process_1.execSync('where node')
        .toString()
        .slice(0, -2);
    PATHS.npm = child_process_1.execSync('where npm')
        .toString()
        .slice(0, -2)
        .split('\r')[0];
}
console.log(PATHS);
class Server {
    constructor() {
        this.PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;
        this.app = new app_1.default(this.PORT, PATHS);
        this.server = express();
        this.server.use(bodyParser.json());
        this.server.use(bodyParser.urlencoded({ extended: true }));
        this.server.use('/', new router_js_1.default().routes);
        this.server.listen(this.PORT, () => console.log(`Deployment server started on port ${this.PORT}`));
    }
}
const server = new Server();
exports.default = server;
