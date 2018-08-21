"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = require("./app");
const bodyParser = require("body-parser");
const express = require("express");
const router_js_1 = require("./router.js");
const fs_1 = require("fs");
const path_1 = require("path");
const PATHS_config = path_1.join(__dirname, 'config/PATHS.json');
let PATHS = JSON.parse(fs_1.readFileSync(PATHS_config, 'utf8'));
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
