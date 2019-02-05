"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
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
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = require("express");
var os_1 = require("os");
var id = __importStar(require("shortid"));
var url_1 = require("url");
var deployer_1 = __importDefault(require("../deployer"));
var server_1 = require("../server");
var deploy = express_1.Router();
deploy.post("/", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
    var url, check, err, child, error_1, error_2, error_3;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                if (process.env.NODE_ENV == "dev")
                    console.log(req.body);
                try {
                    url = new url_1.URL(req.body.query);
                }
                catch (err) {
                    url = err.input;
                }
                if (!(url.hostname == "github.com")) return [3 /*break*/, 15];
                check = server_1.deployer.getChildrenFromJSON(req.body.query.match(/.*\/(.*)$/)[1]);
                err = null;
                child = {
                    dir: server_1.deployer.repoDir + "/" + url.toString().match(/.*\/(.*)$/)[1],
                    errors: [],
                    id: id.generate(),
                    messages: [],
                    name: url.toString().match(/.*\/(.*)$/)[1],
                    platform: os_1.platform(),
                    repo: url.toString()
                };
                if (!(check.length == 1)) return [3 /*break*/, 1];
                child = check[0];
                res.send({
                    errors: ["Repository already deployed. Use run [name | id] or update [name | id]."],
                    id: child.id,
                    name: child.name,
                    query: url,
                    repo: child.repo
                });
                return [3 /*break*/, 14];
            case 1:
                if (!(check.length > 1)) return [3 /*break*/, 2];
                res.send({
                    errors: ["Multiple repos found. Please be more specific."],
                    query: url
                });
                return [3 /*break*/, 14];
            case 2:
                _a.trys.push([2, 4, , 5]);
                return [4 /*yield*/, server_1.deployer.retrieve(child)];
            case 3:
                child = _a.sent();
                return [3 /*break*/, 5];
            case 4:
                error_1 = _a.sent();
                err = error_1;
                if (process.env.NODE_ENV == "dev")
                    console.error(child);
                return [3 /*break*/, 5];
            case 5:
                _a.trys.push([5, 8, , 9]);
                if (!!err) return [3 /*break*/, 7];
                return [4 /*yield*/, server_1.deployer.install(child)];
            case 6:
                child = _a.sent();
                _a.label = 7;
            case 7: return [3 /*break*/, 9];
            case 8:
                error_2 = _a.sent();
                err = error_2;
                if (process.env.NODE_ENV == "dev")
                    console.error(child);
                return [3 /*break*/, 9];
            case 9:
                _a.trys.push([9, 12, , 13]);
                if (!!err) return [3 /*break*/, 11];
                return [4 /*yield*/, server_1.deployer.run(child)];
            case 10:
                child = _a.sent();
                _a.label = 11;
            case 11: return [3 /*break*/, 13];
            case 12:
                error_3 = _a.sent();
                err = error_3;
                if (process.env.NODE_ENV == "dev")
                    console.error(child);
                return [3 /*break*/, 13];
            case 13:
                if (!err) {
                    res.send(deployer_1.default.formatChild(child));
                }
                else {
                    res.send(deployer_1.default.formatChild(err));
                }
                _a.label = 14;
            case 14: return [3 /*break*/, 16];
            case 15:
                res.send({
                    errors: "Repository URL hostname must be \"github.com\"",
                    query: url
                });
                _a.label = 16;
            case 16: return [2 /*return*/];
        }
    });
}); });
exports.default = deploy;
