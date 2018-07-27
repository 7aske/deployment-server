"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express = require("express");
const run = express.Router();
run.get('/', (req, res) => {
    res.send('Hello!');
});
exports.default = run;
