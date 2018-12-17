"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var jwt = __importStar(require("jsonwebtoken"));
var express_1 = require("express");
var crypto_1 = __importDefault(require("crypto"));
var fs_1 = require("fs");
var path_1 = require("path");
var auth = express_1.Router();
auth.get("/", function (req, res, next) {
    var cookie;
    try {
        cookie = jwt.verify(req.cookies.auth, "secretkey");
        next();
    }
    catch (e) {
        res.status(301).redirect("/auth");
    }
});
auth.post("/", function (req, res, next) {
    var cookie;
    try {
        cookie = jwt.verify(req.cookies.auth, "secretkey");
        next();
    }
    catch (e) {
        res.status(401).send({ error: "UNAUTHORIZED" });
    }
});
auth.get("/auth", function (req, res, next) {
    res.send("<form method=\"POST\" action=\"/auth\">\n" +
        "<input type=\"password\" name=\"password\" placeholder=\"Password\">\n" +
        "</form>");
});
auth.post("/auth", function (req, res, next) {
    var config = JSON.parse(fs_1.readFileSync(path_1.join(process.cwd(), "config/config.json")).toString());
    var hash = config.password;
    var secret = config.secret;
    var password = crypto_1.default.createHmac("sha256", secret)
        .update(req.body.password)
        .digest("hex");
    if (password == hash) {
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
