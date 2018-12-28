"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
var crypto_1 = __importDefault(require("crypto"));
var express_1 = require("express");
var fs_1 = require("fs");
var jwt = __importStar(require("jsonwebtoken"));
var path_1 = require("path");
var auth = express_1.Router();
var config = JSON.parse(fs_1.readFileSync(path_1.join(process.cwd(), "config/config.json")).toString());
auth.get("/", function (req, res, next) {
    var reqCookie = req.cookies.auth || req.body.auth;
    var cookie;
    try {
        cookie = jwt.verify(reqCookie, "secretkey");
        next();
    }
    catch (e) {
        res.status(301).redirect("/auth");
    }
});
auth.post("/", function (req, res, next) {
    var reqCookie = req.cookies.auth || req.body.auth;
    console.log(req.cookies);
    var cookie;
    try {
        cookie = jwt.verify(reqCookie, "secretkey");
        next();
    }
    catch (e) {
        res.status(401).send({ error: "UNAUTHORIZED" });
    }
});
auth.get("/auth", function (req, res, next) {
    res.sendFile(path_1.join(process.cwd(), "dist/resources/login.html"));
});
auth.post("/auth", function (req, res, next) {
    // const config: any = JSON.parse(readFileSync(join(process.cwd(), "config/config.json")).toString());
    var password = crypto_1.default.createHmac("sha256", config.secret)
        .update(req.body.password)
        .digest("hex");
    if (password == config.password) {
        try {
            var token = jwt.sign({ date: new Date() }, "secretkey", { issuer: "dep-srv", expiresIn: "1d" });
            res.setHeader("Set-Cookie", "auth=" + token + "; Path=/;");
            if (req.headers["user-agent"].indexOf("Electron") == -1) {
                res.status(301).redirect("/");
            }
            else {
                res.status(200).send({ auth: "auth=" + token + "; Path=/;", token: { auth: token, path: "/" } });
            }
        }
        catch (e) {
            res.status(500).send({ message: "Something went wrong" });
        }
    }
    else {
        res.status(401).send({ error: "UNAUTHORIZED" });
    }
});
exports.default = auth;
