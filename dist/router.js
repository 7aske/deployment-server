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
var express_1 = __importStar(require("express"));
var path_1 = require("path");
var client_1 = __importDefault(require("./client"));
var browse_1 = __importDefault(require("./server/browse"));
var clear_1 = __importDefault(require("./server/clear"));
var deploy_1 = __importDefault(require("./server/deploy"));
var find_1 = __importDefault(require("./server/find"));
var kill_1 = __importDefault(require("./server/kill"));
var remove_1 = __importDefault(require("./server/remove"));
var run_1 = __importDefault(require("./server/run"));
var update_1 = __importDefault(require("./server/update"));
var auth_1 = __importDefault(require("./middleware/auth"));
var router = express_1.Router();
router.use("/deploy", auth_1.default, deploy_1.default);
router.use("/find", auth_1.default, find_1.default);
router.use("/kill", auth_1.default, kill_1.default);
router.use("/run", auth_1.default, run_1.default);
router.use("/update", auth_1.default, update_1.default);
router.use("/remove", auth_1.default, remove_1.default);
router.use("/clear", auth_1.default, clear_1.default);
router.use("/browse", auth_1.default, browse_1.default);
if (process.argv.indexOf("--client") != -1) {
    router.use("/scripts", auth_1.default, express_1.default.static(path_1.join(process.cwd(), "dist/client/dist/renderer/scripts")));
    router.use("/stylesheets", auth_1.default, express_1.default.static(path_1.join(process.cwd(), "dist/client/dist/renderer/stylesheets")));
    router.use("/fonts", auth_1.default, express_1.default.static(path_1.join(process.cwd(), "dist/client/dist/renderer/fonts")));
    router.use("/node_modules/bootstrap", auth_1.default, express_1.default.static(path_1.join(process.cwd(), "node_modules/bootstrap")));
    router.use("/node_modules/popper.js", auth_1.default, express_1.default.static(path_1.join(process.cwd(), "node_modules/popper.js")));
    router.use("/node_modules/jquery", auth_1.default, express_1.default.static(path_1.join(process.cwd(), "node_modules/jquery")));
    router.use("/", auth_1.default, client_1.default);
}
exports.default = router;
