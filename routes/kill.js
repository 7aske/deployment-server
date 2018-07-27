"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express = require("express");
const kill = express.Router();
kill.get('/', (req, res) => {
    res.send('Hello!');
});
exports.default = kill;
