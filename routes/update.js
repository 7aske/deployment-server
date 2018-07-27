"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express = require("express");
const update = express.Router();
update.get('/', (req, res) => {
    res.send('Hello!');
});
exports.default = update;
