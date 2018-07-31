"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express = require("express");
const server_1 = require("../server");
const kill = express.Router();
kill.post('/', async (req, res) => {
    if (process.env.NODE_ENV == 'dev')
        console.log(req.body);
    const query = isNaN(req.body.query) ? req.body.query : parseInt(req.body.query);
    const children = server_1.default.app.getRunningChildren(query);
    if (children instanceof Array) {
        let response = [];
        let errors = [];
        children.forEach(async (child, i) => {
            try {
                const killed = await server_1.default.app.killChild(child);
                if (killed)
                    response.push(killed);
            }
            catch (error) {
                errors.push(error);
            }
            if (i == children.length - 1) {
                if (errors.length > 0)
                    res.send(errors);
                else
                    res.send(response);
            }
        });
    }
    else if (children) {
        try {
            const killed = await server_1.default.app.killChild(children);
            if (killed)
                res.send([killed]);
        }
        catch (error) {
            res.send([error]);
        }
    }
    else {
        res.send({
            query: query,
            errors: ['Invalid PID,ID or name']
        });
    }
});
exports.default = kill;
