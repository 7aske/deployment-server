"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express = require("express");
const morgan = require("morgan");
const deploy_js_1 = require("./routes/deploy.js");
const find_js_1 = require("./routes/find.js");
const kill_js_1 = require("./routes/kill.js");
const run_js_1 = require("./routes/run.js");
const update_js_1 = require("./routes/update.js");
const remove_js_1 = require("./routes/remove.js");
const clear_js_1 = require("./routes/clear.js");
const browse_js_1 = require("./routes/browse.js");
class Router {
    constructor() {
        this.routes = express.Router();
        this.routes.use(morgan(':method :url HTTP/:http-version :status :res[content-length] - :response-time m'));
        this.routes.get('/', (req, res) => {
            res.send('Hello!');
        });
        this.routes.use('/deploy', deploy_js_1.default);
        this.routes.use('/find', find_js_1.default);
        this.routes.use('/kill', kill_js_1.default);
        this.routes.use('/run', run_js_1.default);
        this.routes.use('/update', update_js_1.default);
        this.routes.use('/remove', remove_js_1.default);
        this.routes.use('/clear', clear_js_1.default);
        this.routes.use('/browse', browse_js_1.default);
    }
}
exports.default = Router;
//export default new Router().router;
