"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = require("express");
var server_1 = __importDefault(require("../server"));
var root = express_1.Router();
root.get("/", function (req, res) {
    var deployed = server_1.default.app.getChildrenFromJSON(null);
    var running = server_1.default.app.getRunningChildren(null);
    res.json({ deployed: deployed, running: running });
});
exports.default = root;
