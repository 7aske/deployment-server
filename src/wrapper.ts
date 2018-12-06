import { ChildProcess, execFile, execSync, fork } from "child_process";
import express, { Request, Response } from "express";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";

interface PATHS {
	node: string;
	npm: string;
}

const PATHSConfig = join(__dirname, "config/PATHS.json");
let PATHS: PATHS = {
	node: "node",
	npm: "npm"
};
if (!existsSync(join(__dirname, "config")))
	mkdirSync(join(__dirname, "config"));
if (!existsSync(join(__dirname, "config", "PATHS.json"))) {
	if (process.platform == "linux") {
		PATHS.node = execSync("which node")
			.toString()
			.split("\n")[0];
		PATHS.npm = execSync("which npm")
			.toString()
			.split("\n")[0];
	} else if (process.platform == "win32") {
		PATHS.node = execSync("where node")
			.toString()
			.split("\r\n")[0];
		PATHS.npm = execSync("where npm")
			.toString()
			.split("\r\n")[1];
	}
} else {
	PATHS = JSON.parse(readFileSync(PATHSConfig, "utf8"));
}
if (process.platform == "linux" && !existsSync("/usr/bin/node"))
	execSync(`sudo ln -s ${PATHS.node} /usr/bin/node`);
writeFileSync(PATHSConfig, JSON.stringify(PATHS), "utf8");
const wrapper = express();
const router = express.Router();
wrapper.use("/", router);
const PORT: number = process.env.PORT ? parseInt(process.env.PORT, 10) : 2999;
const serverPORT: number = PORT + 1;

let server: ChildProcess = fork("server.js", [], {
	cwd: __dirname,
	env: {PORT: serverPORT, NODE_ENV: "dev"}
});

// console.log(process.cwd(), __dirname);

function formatStdOut(stdout: string | Buffer, response: any): any {
	// format stdout to differentiate between errors and messages
	const data = stdout.toString();
	if (
		data.indexOf("fatal") != -1 ||
		data.indexOf("ERR") != -1 ||
		data.indexOf("error") != -1
	) {
		response.errors.push(data);
	} else {
		response.messages.push(data);
	}
	return response;
}

router.get("/", (req: Request, res: Response) => {
	res.send("Wrapper server");
});
router.post("/", (req: Request, res: Response) => {
	if (server) {
		server.kill();
		const git = execFile("git", ["pull"]);
		let response: any = {
			errors: [],
			messages: []
		};
		git.stderr.on("data", data => {
			response = formatStdOut(data, response);
		});

		git.stdout.on("data", data => {
			response = formatStdOut(data, response);
		});
		git.on("close", code => {

			if (code == 0 && response.errors.length == 0) {
				setTimeout(() => {
					if (server!.killed) {
						if (existsSync("dist")) {
							server = fork("dist/server.js", [], {
								env: {PORT: serverPORT, NODE_ENV: "dev"}
							});
						} else {
							server = fork("server.js", [], {
								env: {PORT: serverPORT, NODE_ENV: "dev"}
							});
						}
						res.send(response);
					} else {
						response.errors.push("Could not kill server process");
						res.send(response);
					}
				}, 100);
			} else {
				if (existsSync("dist")) {
					server = fork("dist/server.js", [], {
						env: {PORT: serverPORT, NODE_ENV: "dev"}
					});
				} else {
					server = fork("server.js", [], {
						env: {PORT: serverPORT, NODE_ENV: "dev"}
					});
				}
				res.send(response);
				res.send(response);
			}
		});
	} else {
		res.send({
			errors: ["No server running"]
		});
	}
});
wrapper.listen(PORT, () => {
	console.log(PORT);
});

process.on("exit", () => {
	if (server) {
		process.exit();
		server.kill();
	}
});
process.on("SIGTERM", () => {
	if (server) {
		server.kill();
		process.exit();
	}
});
