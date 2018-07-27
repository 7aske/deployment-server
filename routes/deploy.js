"use strict";
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
        url = new url_1.URL(req.body.repository);
    }
    catch (err) {
        url = err.input;
    }
    if (url.hostname == 'github.com') {
        let check = server_1.default.app.getChildrenFromJSON(req.body.repository.match(/.*\/(.*)$/)[1]);
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
        console.log(check, child);
        if (check.length == 1) {
            child = check[0];
            res.send({
                query: url,
                repo: child.repo,
                id: child.id,
                name: child.name,
                errors: ['Repository already deployed. Use run [name] | [id] or update [name] | [id].']
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
                if (process.env.NODE_ENV == 'dev')
                    console.info(child);
            }
            catch (error) {
                err = error;
                if (process.env.NODE_ENV == 'dev')
                    console.error(child);
            }
            // try {
            // 	if (!err) child = await server.app.install(child);
            // 	console.info(child);
            // } catch (error) {
            // 	err = error;
            // }
            // try {
            // 	if (!err) child = await server.app.run(child);
            // 	console.info(child);
            // } catch (error) {
            // 	err = error;
            // }
            if (!err) {
                res.send({
                    repo: child.repo,
                    name: child.name,
                    dir: child.dir,
                    id: child.id,
                    platform: child.platform,
                    action: child.action,
                    messages: child.messages,
                    errors: child.errors,
                    dependencies: child.dependencies,
                    port: child.port,
                    pid: child.pid
                });
            }
            else {
                res.send({
                    repo: child.repo,
                    name: child.name,
                    dir: child.dir,
                    id: child.id,
                    platform: child.platform,
                    messages: child.messages,
                    errors: child.errors
                });
            }
        }
    }
    else {
        res.send({
            errors: 'Repository URL hostname must be "github.com"'
        });
    }
});
exports.default = deploy;
