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
var express = __importStar(require("express"));
var morgan_1 = __importDefault(require("morgan"));
var browse_js_1 = __importDefault(require("./routes/browse.js"));
var clear_js_1 = __importDefault(require("./routes/clear.js"));
var deploy_js_1 = __importDefault(require("./routes/deploy.js"));
var find_js_1 = __importDefault(require("./routes/find.js"));
var kill_js_1 = __importDefault(require("./routes/kill.js"));
var remove_js_1 = __importDefault(require("./routes/remove.js"));
var run_js_1 = __importDefault(require("./routes/run.js"));
var update_js_1 = __importDefault(require("./routes/update.js"));
var Router = /** @class */ (function () {
    function Router() {
        this.routes = express.Router();
        this.routes.use(morgan_1.default(":method :url HTTP/:http-version :status :res[content-length] - :response-time m"));
        this.routes.get("/", function (req, res) {
            res.send("Hello!");
        });
        this.routes.use("/deploy", deploy_js_1.default);
        this.routes.use("/find", find_js_1.default);
        this.routes.use("/kill", kill_js_1.default);
        this.routes.use("/run", run_js_1.default);
        this.routes.use("/update", update_js_1.default);
        this.routes.use("/remove", remove_js_1.default);
        this.routes.use("/clear", clear_js_1.default);
        this.routes.use("/browse", browse_js_1.default);
    }
    return Router;
}());
exports.default = Router;
// export default new Router().router;
