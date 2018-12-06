import { Router } from "express";
import morgan from "morgan";
import root from "./client/root";
import browse from "./server/browse";
import clear from "./server/clear";
import deploy from "./server/deploy";
import find from "./server/find";
import kill from "./server/kill";
import remove from "./server/remove";
import run from "./server/run";
import update from "./server/update";

const router = Router();

router.use(
	morgan(
		":method :url HTTP/:http-version :status :res[content-length] - :response-time m"
	)
);
router.use("/deploy", deploy);
router.use("/find", find);
router.use("/kill", kill);
router.use("/run", run);
router.use("/update", update);
router.use("/remove", remove);
router.use("/clear", clear);
router.use("/browse", browse);
router.use("/", root);

export default router;
