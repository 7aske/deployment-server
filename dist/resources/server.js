"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = __importDefault(require("express"));
var app = express_1.default();
var router = express_1.default.Router();
var fs_1 = require("fs");
var path_1 = require("path");
var PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
var main = JSON.parse(fs_1.readFileSync("package.json", "utf8")).main;
app.use(express_1.default.static(__dirname));
app.use("/", router);
router.get("/", function (req, res) {
    res.sendFile(path_1.join(__dirname, main));
});
app.listen(PORT, function () {
    console.log(PORT);
});
