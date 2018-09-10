Object.defineProperty(exports, "__esModule", { value: true });
const express = require("express");
const os_1 = require("os");
const server_1 = require("../server");
const id = require("shortid");
const url_1 = require("url");
const deploy = express.Router();
deploy.post('/', async (req, res) => {
    if (process.env.NODE_ENV == 'dev')
        console.log(req.body);
    let url;
    try {
        url = new url_1.URL(req.body.query);
    }
    catch (err) {
        url = err.input;
    }
    if (url.hostname == 'github.com') {
        let check = server_1.default.app.getChildrenFromJSON(req.body.query.match(/.*\/(.*)$/)[1]);
        let err = null;
        let child = {
            repo: url.toString(),
            name: url.toString().match(/.*\/(.*)$/)[1],
            id: id.generate(),
            dir: `${server_1.default.app.repoDir}/${url.toString().match(/.*\/(.*)$/)[1]}`,
            platform: os_1.platform(),
            errors: [],
            messages: []
        };
        if (process.env.NODE_ENV == 'dev')
            console.log(check, child);
        if (check.length == 1) {
            child = check[0];
            res.send({
                query: url,
                repo: child.repo,
                id: child.id,
                name: child.name,
                errors: ['Repository already deployed. Use run [name | id] or update [name | id].']
            });
        }
        else if (check.length > 1) {
            res.send({
                query: url,
                errors: ['Multiple repos found. Please be more specific.']
            });
        }
        else {
            try {
                child = await server_1.default.app.retrieve(child);
                //if (process.env.NODE_ENV == 'dev') console.info(child);
            }
            catch (error) {
                err = error;
                //if (process.env.NODE_ENV == 'dev') console.error(child);
            }
            try {
                if (!err)
                    child = await server_1.default.app.install(child);
                //if (process.env.NODE_ENV == 'dev')console.info(child);
            }
            catch (error) {
                err = error;
                //if (process.env.NODE_ENV == 'dev') console.error(child);
            }
            try {
                if (!err)
                    child = await server_1.default.app.run(child);
                //if (process.env.NODE_ENV == 'dev')console.info(child);
            }
            catch (error) {
                err = error;
                //if (process.env.NODE_ENV == 'dev') console.error(child);
            }
            if (!err) {
                res.send(server_1.default.app.formatChild(child));
            }
            else {
                res.send(server_1.default.app.formatChild(err));
            }
        }
    }
    else {
        res.send({
            query: url,
            errors: 'Repository URL hostname must be "github.com"'
        });
    }
});
exports.default = deploy;
