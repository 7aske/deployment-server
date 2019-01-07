"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function timeout(req, res, next) {
    console.log(req.path);
    req.setTimeout(1000, function () { return console.log(req.path); });
    next();
}
exports.timeout = timeout;
