import express, { Router } from "express";
import { join } from "path";
import client from "./client";
import browse from "./server/browse";
import clear from "./server/clear";
import deploy from "./server/deploy";
import find from "./server/find";
import kill from "./server/kill";
import remove from "./server/remove";
import run from "./server/run";
import update from "./server/update";
import auth from "./middleware/auth";

const router = Router();

router.use("/deploy",auth, deploy);
router.use("/find",auth, find);
router.use("/kill",auth, kill);
router.use("/run",auth, run);
router.use("/update",auth, update);
router.use("/remove",auth, remove);
router.use("/clear",auth, clear);
router.use("/browse",auth, browse);

if (process.argv.indexOf("--client") != -1) {
	router.use("/scripts", auth, express.static(join(process.cwd(), "dist/client/dist/renderer/scripts")));
	router.use("/stylesheets", auth, express.static(join(process.cwd(), "dist/client/dist/renderer/stylesheets")));
	router.use("/fonts", auth, express.static(join(process.cwd(), "dist/client/dist/renderer/fonts")));
	router.use("/node_modules/bootstrap", auth, express.static(join(process.cwd(), "node_modules/bootstrap")));
	router.use("/node_modules/popper.js", auth, express.static(join(process.cwd(), "node_modules/popper.js")));
	router.use("/node_modules/jquery", auth, express.static(join(process.cwd(), "node_modules/jquery")));
	router.use("/", auth, client);
}

export default router;
