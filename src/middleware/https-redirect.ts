import express from "express";

export function httpsRedirect(req: express.Request, res: express.Response, next: express.NextFunction) {
    if (req.protocol == "http") res.status(302).redirect("https://" + req.headers.host + req.url);
    else next();
}
