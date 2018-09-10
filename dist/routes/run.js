Object.defineProperty(exports, "__esModule", { value: true });
const express = require("express");
const server_1 = require("../server");
const run = express.Router();
run.post('/', async (req, res) => {
    if (process.env.NODE_ENV == 'dev')
        console.log(req.body);
    const query = isNaN(req.body.query) ? req.body.query : parseInt(req.body.query);
    let response = [];
    let errors = [];
    const result = server_1.default.app.getChildrenFromJSON(query);
    if (process.env.NODE_ENV == 'dev')
        console.log(result.length + ' servers found');
    if (result.length > 0) {
        result.forEach(async (child, i, array) => {
            try {
                const newChild = await server_1.default.app.run(child);
                response.push(server_1.default.app.formatChild(newChild));
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
exports.default = run;
