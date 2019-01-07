"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function httpsRedirect(req, res, next) {
    if (req.protocol == "http")
        res.status(302).redirect("https://" + req.headers.host + req.url);
    else
        next();
}
exports.httpsRedirect = httpsRedirect;
