import express, { Router } from "express";
import { join } from "path";
import client from "./client";
import auth from "./middleware/auth";
import browse from "./server/browse";
import clear from "./server/clear";
import deploy from "./server/deploy";
import find from "./server/find";
import kill from "./server/kill";
import remove from "./server/remove";
import run from "./server/run";
import update from "./server/update";

const router = Router();

router.use("/deploy", deploy);
router.use("/find", find);
router.use("/kill", kill);
router.use("/run", run);
router.use("/update", update);
router.use("/remove", remove);
router.use("/clear", clear);
router.use("/browse", browse);

if (process.argv.indexOf("--client") != -1) {
	router.use("/scripts", express.static(join(process.cwd(), "dist/client/dist/renderer/scripts")));
	router.use("/stylesheets", express.static(join(process.cwd(), "dist/client/dist/renderer/stylesheets")));
	router.use("/fonts", express.static(join(process.cwd(), "dist/client/dist/renderer/fonts")));
	router.use("/node_modules/bootstrap", express.static(join(process.cwd(), "node_modules/bootstrap")));
	router.use("/node_modules/popper.js", express.static(join(process.cwd(), "node_modules/popper.js")));
	router.use("/node_modules/jquery", express.static(join(process.cwd(), "node_modules/jquery")));
	router.use("/", client);
}

export default router;
