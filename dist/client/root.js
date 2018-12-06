"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = require("express");
var server_1 = require("../server");
var root = express_1.Router();
root.get("/", function (req, res) {
    var deployed = server_1.deployer.getChildrenFromJSON(null);
    var running = server_1.deployer.getRunningChildren(null);
    res.json({ deployed: deployed, running: running });
});
exports.default = root;
