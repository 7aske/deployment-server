"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express = require("express");
const server_1 = require("../server");
const updater = express.Router();
updater.post('/', async (req, res) => {
    if (process.env.NODE_ENV == 'dev')
        console.log(req.body);
    try {
        const response = server_1.default.app.selfUpdate();
        res.send(response);
    }
    catch (error) {
        res.send(error);
    }
});
exports.default = updater;
