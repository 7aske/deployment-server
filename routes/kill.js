"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express = require("express");
const server_1 = require("../server");
const kill = express.Router();
kill.post('/', async (req, res) => {
    if (process.env.NODE_ENV == 'dev')
        console.log(req.body);
    const query = isNaN(req.body.query) ? req.body.query : parseInt(req.body.query);
    const response = server_1.default.app.killChild(query);
    if (response.length == 0)
        res.send({
            query: query,
            errors: ['Invalid PID,ID or name']
        });
    else
        res.send(response);
});
exports.default = kill;
