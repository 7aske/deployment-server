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
var deployer_1 = __importDefault(require("./deployer"));
var router_1 = __importDefault(require("./router"));
var PATHSConfig = path_1.join(__dirname, "config/PATHS.json");
var PATHS = JSON.parse(fs_1.readFileSync(PATHSConfig, "utf8"));
var PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
exports.deployer = new deployer_1.default(PORT, PATHS);
var server = express_1.default();
server.use(bodyParser.json());
server.use(bodyParser.urlencoded({ extended: true }));
server.use("/", router_1.default);
server.listen(PORT, function () {
    return console.log(PORT);
});
exports.default = server;
