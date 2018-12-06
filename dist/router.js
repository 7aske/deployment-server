"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = require("express");
var morgan_1 = __importDefault(require("morgan"));
var root_1 = __importDefault(require("./client/root"));
var browse_1 = __importDefault(require("./server/browse"));
var clear_1 = __importDefault(require("./server/clear"));
var deploy_1 = __importDefault(require("./server/deploy"));
var find_1 = __importDefault(require("./server/find"));
var kill_1 = __importDefault(require("./server/kill"));
var remove_1 = __importDefault(require("./server/remove"));
var run_1 = __importDefault(require("./server/run"));
var update_1 = __importDefault(require("./server/update"));
var router = express_1.Router();
router.use(morgan_1.default(":method :url HTTP/:http-version :status :res[content-length] - :response-time m"));
router.use("/deploy", deploy_1.default);
router.use("/find", find_1.default);
router.use("/kill", kill_1.default);
router.use("/run", run_1.default);
router.use("/update", update_1.default);
router.use("/remove", remove_1.default);
router.use("/clear", clear_1.default);
router.use("/browse", browse_1.default);
router.use("/", root_1.default);
exports.default = router;
