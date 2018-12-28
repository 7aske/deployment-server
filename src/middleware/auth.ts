import crypto from "crypto";
import { Router } from "express";
import { readFileSync } from "fs";
import * as jwt from "jsonwebtoken";
import { join } from "path";

const auth = Router();
const config: any = JSON.parse(readFileSync(join(process.cwd(), "config/config.json")).toString());
auth.get("/", (req, res, next) => {
	const reqCookie = req.cookies.auth || req.body.auth;
	let cookie;
	try {
		cookie = jwt.verify(reqCookie, "secretkey");
		next();
	} catch (e) {
		res.status(301).redirect("/auth");
	}
});

auth.post("/", (req, res, next) => {
	const reqCookie = req.cookies.auth || req.body.auth;
	console.log(req.cookies);
	let cookie;
	try {
		cookie = jwt.verify(reqCookie, "secretkey");
		next();
	} catch (e) {
		res.status(401).send({error: "UNAUTHORIZED"});
	}
});

auth.get("/auth", (req, res, next) => {
	res.sendFile(join(process.cwd(), "dist/resources/login.html"));
});

auth.post("/auth", (req, res, next) => {
	// const config: any = JSON.parse(readFileSync(join(process.cwd(), "config/config.json")).toString());
	const password = crypto.createHmac("sha256", config.secret)
		.update(req.body.password)
		.digest("hex");
	if (password == config.password) {
		try {
			const token = jwt.sign({date: new Date()}, "secretkey", {issuer: "dep-srv", expiresIn: "1d"});
			res.setHeader("Set-Cookie", `auth=${token}; Path=/;`);
			if (req.headers["user-agent"].indexOf("Electron") == -1) {
				res.status(301).redirect("/");
			} else {
				res.status(200).send({auth: `auth=${token}; Path=/;`, token: {auth: token, path: "/"}});
			}
		} catch (e) {
			res.status(500).send({message: "Something went wrong"});
		}
	} else {
		res.status(401).send({error: "UNAUTHORIZED"});
	}
});

export default auth;
