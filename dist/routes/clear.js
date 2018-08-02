"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express = require("express");
const server_1 = require("../server");
const clear = express.Router();
clear.post('/', async (req, res) => {
    if (process.env.NODE_ENV == 'dev')
        console.log(req.body);
    const query = req.body.query;
    server_1.default.app.clear(query);
    res.send({ OK: 1 });
});
exports.default = clear;
