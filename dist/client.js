"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = require("express");
var path_1 = require("path");
var client = express_1.Router();
client.get("/", function (req, res) {
    res.sendFile(path_1.join(process.cwd(), "dist/client/dist/renderer/views/renderer.html"));
});
exports.default = client;
