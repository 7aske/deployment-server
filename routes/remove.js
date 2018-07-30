"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express = require("express");
const server_1 = require("../server");
const remove = express.Router();
remove.post('/', async (req, res) => {
    if (process.env.NODE_ENV == 'dev')
        console.log(req.body);
    const query = req.body.query ? req.body.query : null;
    let response = [];
    let errors = [];
    const result = server_1.default.app.getChildrenFromJSON(query);
    if (process.env.NODE_ENV == 'dev')
        console.log(result.length + ' servers found');
    if (result.length > 0) {
        result.forEach(async (child, i, array) => {
            try {
                const removedRepo = await server_1.default.app.remove(child);
                response.push(server_1.default.app.formatChild(removedRepo));
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
            errors: ['No repositories found']
        });
    }
});
exports.default = remove;
