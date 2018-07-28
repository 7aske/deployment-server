"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express = require("express");
const server_1 = require("../server");
const find = express.Router();
find.post('/', async (req, res) => {
    if (process.env.NODE_ENV == 'dev')
        console.log(req.body);
    const query = req.body.query;
    const result = server_1.default.app.getRunningChild(query);
    let response = [];
    if (result.length > 0) {
        result.forEach(child => {
            response.push(server_1.default.app.formatChild(child));
        });
    }
    res.send(response);
});
exports.default = find;