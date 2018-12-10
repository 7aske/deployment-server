import * as jwt from "jsonwebtoken";
import { Router } from "express";
import crypto from "crypto";
import { readFileSync } from "fs";
import { join } from "path";

const auth = Router();

auth.get("/", (req, res, next) => {
	console.log(req.cookies);
	let cookie;
	try {
		cookie = jwt.verify(req.cookies.auth, "secretkey");
		console.log(cookie);
		next();
	} catch (e) {
		console.log(e);
		res.status(301).redirect("/auth");
	}
});

auth.post("/", (req, res, next) => {
	console.log(req.cookies);
	let cookie;
	try {
		cookie = jwt.verify(req.cookies.auth, "secretkey");
		next();
	} catch (e) {
		console.log(e);
		res.status(401).send({error: "UNAUTHORIZED"});
	}
});

auth.get("/auth", (req, res, next) => {
	res.send("<form method=\"POST\" action=\"/auth\">\n" +
		"<input type=\"password\" name=\"password\" placeholder=\"Password\">\n" +
		"</form>");
});

auth.post("/auth", (req, res, next) => {
	const config: any = JSON.parse(readFileSync(join(process.cwd(), "config/config.json")).toString());
	const hash: string = config.password;
	const secret: string = config.secret;
	const password = crypto.createHmac("sha256", secret)
		.update(req.body.password)
		.digest("hex");
	if (password == hash) {
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