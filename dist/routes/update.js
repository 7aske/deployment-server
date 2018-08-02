"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express = require("express");
const server_1 = require("../server");
const update = express.Router();
update.post('/', async (req, res) => {
    if (process.env.NODE_ENV == 'dev')
        console.log(req.body);
    const query = req.body.query;
    let result = server_1.default.app.getChildrenFromJSON(query);
    let response = [];
    let errors = [];
    if (result.length > 0) {
        result.forEach(async (child, i, array) => {
            try {
                const newChild = child;
                newChild.messages = [];
                await server_1.default.app.retrieve(newChild);
            }
            catch (err) {
                errors.push(err);
            }
            try {
                const newChild = await server_1.default.app.install(child);
                response.push(newChild);
            }
            catch (err) {
                errors.push(err);
            }
            if (i == array.length - 1) {
                if (errors.length > 0)
                    res.send(errors);
                else
                    res.send(response);
            }
        });
    }
    else {
        res.send({
            query: query,
            errors: ['No servers found']
        });
    }
});
exports.default = update;
