Object.defineProperty(exports, "__esModule", { value: true });
const express = require("express");
const server_1 = require("../server");
const browse = express.Router();
browse.post('/', async (req, res) => {
    if (process.env.NODE_ENV == 'dev')
        console.log(req.body);
    const query = req.body.query;
    const response = server_1.default.app.browse(query);
    res.send(response);
});
exports.default = browse;
