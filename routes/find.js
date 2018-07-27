"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express = require("express");
const find = express.Router();
find.get('/', (req, res) => {
    res.send('Hello!');
});
exports.default = find;
