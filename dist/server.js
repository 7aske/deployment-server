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
var bodyParser = __importStar(require("body-parser"));
var express_1 = __importDefault(require("express"));
var fs_1 = require("fs");
var path_1 = require("path");
var app_1 = __importDefault(require("./app"));
var router_js_1 = __importDefault(require("./router.js"));
var PATHSConfig = path_1.join(__dirname, "config/PATHS.json");
var PATHS = JSON.parse(fs_1.readFileSync(PATHSConfig, "utf8"));
var Server = /** @class */ (function () {
    function Server() {
        var _this = this;
        this.PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
        this.app = new app_1.default(this.PORT, PATHS);
        this.server = express_1.default();
        this.server.use(bodyParser.json());
        this.server.use(bodyParser.urlencoded({ extended: true }));
        this.server.use("/", new router_js_1.default().routes);
        this.server.listen(this.PORT, function () {
            return console.log(_this.PORT);
        });
    }
    return Server;
}());
var server = new Server();
exports.default = server;
