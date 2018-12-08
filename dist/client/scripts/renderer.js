"use strict";
// import axios from "axios";
// import { deployedTemplate, mainTemplate } from "./templates";
// import helpers from "./helpers";
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
var serverUrl = getUrl();
function formatUrl(hostname, port) {
    if (port == 443) {
        return "https://" + hostname + ":" + port;
    }
    else {
        return "http://" + hostname + ":" + port;
    }
}
var actions = {
    deployBtn: {
        action: "deploy",
        placeholder: "https://github.com/7aske/portfolio",
        name: "deployBtn"
    },
    updateBtn: { action: "update", placeholder: "", name: "updateBtn" },
    runBtn: { action: "run", placeholder: "", name: "runBtn" },
    killBtn: { action: "kill", placeholder: "", name: "killBtn" },
    removeBtn: { action: "remove", placeholder: "", name: "removeBtn" },
    findBtn: {
        action: "find",
        placeholder: "",
        name: "findBtn"
    },
    clearBtn: { action: "clear", placeholder: "", name: "clearBtn" },
    browseBtn: { action: "browse", placeholder: "", name: "browseBtn" }
};
var tabs = {
    running: { name: "running" },
    deployed: { name: "deployed" }
};
var currentTab = tabs.running;
var currentAction = actions.findBtn;
// find running instances on start
document.addEventListener("DOMContentLoaded", function () {
    // noinspection JSIgnoredPromiseFromCall
    execute({
        path: "find",
        data: {
            query: null
        }
    });
    // noinspection JSIgnoredPromiseFromCall
    execute({
        path: "browse",
        data: {
            query: null
        }
    });
});
var refreshBtn = document.querySelector("#refreshBtn");
refreshBtn.addEventListener("click", function () {
    // noinspection JSIgnoredPromiseFromCall
    execute({
        path: "find",
        data: {
            query: null
        }
    });
    // noinspection JSIgnoredPromiseFromCall
    execute({
        path: "browse",
        data: {
            query: null
        }
    });
});
var searchInp = document.querySelector("#searchInp");
var searchBtn = document.querySelector("#searchBtn");
searchBtn.addEventListener("click", function () {
    if (searchInp.value != "") {
        if (currentTab.name == "running") {
            execute({
                path: "find",
                data: {
                    query: searchInp.value
                }
            });
            // searchInp.value = "";
        }
        if (currentTab.name == "deployed") {
            execute({
                path: "browse",
                data: {
                    query: searchInp.value
                }
            });
            // searchInp.value = "";
        }
    }
});
document.addEventListener("keydown", function (event) {
    if (event.key == "Escape") {
        if (isFooterUp)
            footerDown();
    }
    if (event.key == "Enter") {
        if (isFooterUp)
            execute({
                path: currentAction.action,
                data: {
                    query: currentAction.placeholder
                }
            });
        else if (searchInp.value != "" &&
            searchInp.classList.contains("focused")) {
            if (currentTab.name == "running") {
                execute({
                    path: "find",
                    data: {
                        query: searchInp.value
                    }
                });
                searchInp.value = "";
            }
            if (currentTab.name == "deployed") {
                execute({
                    path: "browse",
                    data: {
                        query: searchInp.value
                    }
                });
                searchInp.value = "";
            }
        }
    }
});
var main = document.querySelector("main");
main.addEventListener("click", footerDown);
var deployedContainer = document.querySelector("#deployedContainer");
var runningContainer = document.querySelector("#runningContainer");
var serverInp = document.querySelector("#serverInp");
var portInp = document.querySelector("#portInp");
serverInp.value = getUrl().hostname;
serverInp.addEventListener("keyup", function (event) {
    var target = event.target;
    saveUrl({
        hostname: target.value,
        port: portInp.value
    });
});
portInp.value = getUrl().port.toString();
portInp.addEventListener("keyup", function (event) {
    var target = event.target;
    saveUrl({
        hostname: serverInp.value,
        port: target.value
    });
});
var isFooterUp = false;
// const footer = document.querySelector("footer");
// const footerTrigger = document.querySelector("#footerTrigger") as HTMLElement;
var goInp = document.querySelector("#goInp");
goInp.addEventListener("keyup", function () {
    actions[currentAction.name].placeholder = goInp.value;
});
var goBtn = document.querySelector("#goBtn");
goBtn.addEventListener("click", function () {
    if (goInp.value != "") {
        if (currentAction.action == "browse") {
            currentTab = tabs.deployed;
            changeTab();
        }
        // noinspection JSIgnoredPromiseFromCall
        execute({
            path: currentAction.action,
            data: {
                query: currentAction.placeholder
            }
        });
    }
});
var loaders = document.querySelectorAll(".loader");
var sidebarButtons = document.querySelectorAll("nav .dropdown .btn");
sidebarButtons.forEach(function (btn) {
    btn.addEventListener("click", function (event) {
        var target = event.target;
        console.log(target);
        if (target.id == "refreshBtn")
            return false;
        currentAction = actions[btn.id];
        sidebarButtons.forEach(function (b) {
            b.classList.remove("active");
        });
        btn.classList.add("active");
        footerUp();
    });
});
// footerTrigger.addEventListener("mouseenter", footerUp);
function footerUp() {
    isFooterUp = true;
    // footerTrigger.style.display = "none";
    // footer.style.transform = "translateY(0)";
    sidebarButtons.forEach(function (btn) {
        if (btn.id == currentAction.name)
            btn.classList.add("active");
    });
    goInp.value = currentAction.placeholder;
    setTimeout(function () {
        goInp.focus();
    }, 100);
}
function footerDown() {
    isFooterUp = false;
    // footerTrigger.style.display = "block";
    // footer.style.transform = "translateY(150px)";
    // footer.style.top = "100vh";
    // sidebarButtons.forEach(btn => {
    // 	btn.classList.remove("active");
    // });
    goInp.blur();
}
// noinspection JSUnusedGlobalSymbols
function handleTabClick(event) {
    var target = event.target;
    if (target.id == "tab0")
        currentTab = tabs.running;
    if (target.id == "tab1")
        currentTab = tabs.deployed;
    changeTab();
}
function changeTab() {
    var tabss = document.querySelectorAll(".tab");
    tabss.forEach(function (tab) { return tab.classList.remove("active"); });
    if (currentTab.name == "running") {
        tabss[0].classList.add("active");
        runningContainer.classList.remove("hide");
        deployedContainer.classList.add("hide");
    }
    if (currentTab.name == "deployed") {
        tabss[1].classList.add("active");
        deployedContainer.classList.remove("hide");
        runningContainer.classList.add("hide");
    }
}
function collapseToggle(event) {
    var target = event.target;
    if (!target.classList.contains("card-header"))
        return false;
    var bar = target;
    var t = document.querySelector(target.attributes.getNamedItem("data-target").value);
    // const next = t.parentElement.nextElementSibling;
    if (bar.attributes.getNamedItem("aria-expanded").value == "true") {
        t.classList.remove("show");
        bar.attributes.getNamedItem("aria-expanded").value = "false";
    }
    else if (bar.attributes.getNamedItem("aria-expanded").value == "false") {
        t.classList.add("show");
        bar.attributes.getNamedItem("aria-expanded").value = "true";
    }
}
function openExternal(event) {
    var target = event.target;
    event.preventDefault();
    openUrl(target.innerHTML);
}
function fromListExecute(event) {
    var target = event.target;
    event.preventDefault();
    setTimeout(function () {
        footerUp();
    }, 100);
    // noinspection JSIgnoredPromiseFromCall
    execute({
        path: actions[target.attributes.getNamedItem("data-action").value].action,
        data: {
            query: target.attributes.getNamedItem("data-id").value
        }
    });
}
function execute(payload) {
    return __awaiter(this, void 0, void 0, function () {
        var url, data, servers, sorted, e_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    url = formatUrl(getUrl().hostname, getUrl().port);
                    loaders.forEach(function (loader) {
                        loader.classList.remove("hide");
                    });
                    console.log(payload.data);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 4, , 5]);
                    return [4 /*yield*/, fetch(url + "/" + payload.path, {
                            method: "post",
                            headers: {
                                "Content-Type": "application/json; charset=utf-8"
                                // "Content-Type": "application/x-www-form-urlencoded",
                            },
                            body: JSON.stringify(payload.data)
                        })];
                case 2:
                    data = _a.sent();
                    return [4 /*yield*/, data.json()];
                case 3:
                    servers = _a.sent();
                    console.log(servers);
                    loaders.forEach(function (loader) {
                        loader.classList.add("hide");
                    });
                    if (payload.path != "find" && payload.path != "browse") {
                        // noinspection JSIgnoredPromiseFromCall
                        execute({
                            path: "find",
                            data: {
                                query: null
                            }
                        });
                        // noinspection JSIgnoredPromiseFromCall
                        execute({
                            path: "browse",
                            data: {
                                query: null
                            }
                        });
                    }
                    else {
                        sorted = servers.sort(function (a, b) {
                            return a.port > b.port;
                        });
                        render(sorted, payload.path);
                    }
                    return [3 /*break*/, 5];
                case 4:
                    e_1 = _a.sent();
                    loaders.forEach(function (loader) {
                        loader.classList.add("hide");
                    });
                    deployedContainer.innerHTML = "Server not running on selected host";
                    runningContainer.innerHTML = "Server not running on selected host";
                    return [3 /*break*/, 5];
                case 5: return [2 /*return*/];
            }
        });
    });
}
function render(data, template) {
    if (template == "browse") {
        deployedContainer.innerHTML = "";
        if (data.length == 0) {
            deployedContainer.innerHTML = "No servers found";
        }
        if (data instanceof Array)
            data.forEach(function (server, i) {
                deployedContainer.innerHTML += deployedTemplate(server, i);
            });
        else {
            deployedContainer.innerHTML += deployedTemplate(data, 0);
        }
    }
    else if (template == "find") {
        runningContainer.innerHTML = "";
        if (data.length == 0) {
            runningContainer.innerHTML = "No servers found";
        }
        if (data instanceof Array)
            data.forEach(function (server, i) {
                runningContainer.innerHTML += mainTemplate(server, serverUrl, i);
            });
        else {
            runningContainer.innerHTML += mainTemplate(data, serverUrl, 0);
        }
    }
}
