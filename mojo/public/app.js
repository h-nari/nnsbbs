/*
 * ATTENTION: The "eval" devtool has been used (maybe by default in mode: "development").
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./src/app.ts":
/*!********************!*\
  !*** ./src/app.ts ***!
  \********************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

eval("\r\nvar __importDefault = (this && this.__importDefault) || function (mod) {\r\n    return (mod && mod.__esModule) ? mod : { \"default\": mod };\r\n};\r\nObject.defineProperty(exports, \"__esModule\", ({ value: true }));\r\nvar nnsbbs_1 = __importDefault(__webpack_require__(/*! ./nnsbbs */ \"./src/nnsbbs.ts\"));\r\nvar nb = new nnsbbs_1.default();\r\nwindow.nssbss = nb;\r\nfunction set_main_size() {\r\n    var h = $(window).height();\r\n    if (h) {\r\n        h -= 100;\r\n        console.log('h:', h);\r\n        $(\"#main\").css(\"height\", h + \"px\");\r\n    }\r\n}\r\n$(function () {\r\n    $('#main').html(nb.html());\r\n    set_main_size();\r\n    nb.bind();\r\n});\r\n$(window).on('resize', function () {\r\n    set_main_size();\r\n});\r\n\n\n//# sourceURL=webpack://nnsbbs/./src/app.ts?");

/***/ }),

/***/ "./src/article_pain.ts":
/*!*****************************!*\
  !*** ./src/article_pain.ts ***!
  \*****************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

eval("\r\nvar __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {\r\n    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }\r\n    return new (P || (P = Promise))(function (resolve, reject) {\r\n        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }\r\n        function rejected(value) { try { step(generator[\"throw\"](value)); } catch (e) { reject(e); } }\r\n        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }\r\n        step((generator = generator.apply(thisArg, _arguments || [])).next());\r\n    });\r\n};\r\nvar __generator = (this && this.__generator) || function (thisArg, body) {\r\n    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;\r\n    return g = { next: verb(0), \"throw\": verb(1), \"return\": verb(2) }, typeof Symbol === \"function\" && (g[Symbol.iterator] = function() { return this; }), g;\r\n    function verb(n) { return function (v) { return step([n, v]); }; }\r\n    function step(op) {\r\n        if (f) throw new TypeError(\"Generator is already executing.\");\r\n        while (_) try {\r\n            if (f = 1, y && (t = op[0] & 2 ? y[\"return\"] : op[0] ? y[\"throw\"] || ((t = y[\"return\"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;\r\n            if (y = 0, t) op = [op[0] & 2, t.value];\r\n            switch (op[0]) {\r\n                case 0: case 1: t = op; break;\r\n                case 4: _.label++; return { value: op[1], done: false };\r\n                case 5: _.label++; y = op[1]; op = [0]; continue;\r\n                case 7: op = _.ops.pop(); _.trys.pop(); continue;\r\n                default:\r\n                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }\r\n                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }\r\n                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }\r\n                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }\r\n                    if (t[2]) _.ops.pop();\r\n                    _.trys.pop(); continue;\r\n            }\r\n            op = body.call(thisArg, _);\r\n        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }\r\n        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };\r\n    }\r\n};\r\nObject.defineProperty(exports, \"__esModule\", ({ value: true }));\r\nexports.ArticlePane = void 0;\r\nvar util_1 = __webpack_require__(/*! ./util */ \"./src/util.ts\");\r\nvar tag_1 = __webpack_require__(/*! ./tag */ \"./src/tag.ts\");\r\nvar toolbar_1 = __webpack_require__(/*! ./toolbar */ \"./src/toolbar.ts\");\r\n;\r\nvar ArticlePane = /** @class */ (function () {\r\n    function ArticlePane() {\r\n        this.id = \"article-pane\";\r\n        this.data = null;\r\n        this.toolbar = new toolbar_1.ToolBar('Article');\r\n        this.bDispHeader = false; // 記事のヘッダー部を表示するか\r\n        this.id_header = this.id + \"-header\";\r\n        this.clear();\r\n    }\r\n    ArticlePane.prototype.clear = function () {\r\n        this.data = { header: \"\", content: \"\" };\r\n    };\r\n    ArticlePane.prototype.html = function () {\r\n        var d = this.data;\r\n        return this.toolbar.html() +\r\n            tag_1.div({ id: this.id, class: 'article fill' }, tag_1.div({ class: 'article-header', id: this.id_header }, d ? d.header : \"\"), tag_1.div({ class: 'article-body fill' }, d ? d.content : \"\"));\r\n    };\r\n    ArticlePane.prototype.bind = function () {\r\n        if (!this.bDispHeader)\r\n            $('#' + this.id_header).addClass('no-display');\r\n        this.toolbar.bind();\r\n    };\r\n    ArticlePane.prototype.open = function (newsgroup_id, article_id) {\r\n        return __awaiter(this, void 0, void 0, function () {\r\n            var data, c, i;\r\n            return __generator(this, function (_a) {\r\n                switch (_a.label) {\r\n                    case 0: return [4 /*yield*/, util_1.get_json('/api/article', { data: { newsgroup_id: newsgroup_id, article_id: article_id } })];\r\n                    case 1:\r\n                        data = _a.sent();\r\n                        c = data.content;\r\n                        i = c.indexOf('\\n\\n');\r\n                        if (i >= 0) {\r\n                            data['header'] = c.substring(0, i);\r\n                            data['content'] = c.substring(i + 2);\r\n                        }\r\n                        else {\r\n                            data['header'] = \"\";\r\n                        }\r\n                        this.data = data;\r\n                        return [2 /*return*/];\r\n                }\r\n            });\r\n        });\r\n    };\r\n    ArticlePane.prototype.setHeaderDisp = function (bDisp) {\r\n        if (bDisp)\r\n            $('#' + this.id_header).removeClass('no-display');\r\n        else\r\n            $('#' + this.id_header).addClass('no-display');\r\n        this.bDispHeader = bDisp;\r\n    };\r\n    ArticlePane.prototype.toggle_header = function () {\r\n        this.setHeaderDisp(!this.bDispHeader);\r\n    };\r\n    return ArticlePane;\r\n}());\r\nexports.ArticlePane = ArticlePane;\r\n\n\n//# sourceURL=webpack://nnsbbs/./src/article_pain.ts?");

/***/ }),

/***/ "./src/ng_pane.ts":
/*!************************!*\
  !*** ./src/ng_pane.ts ***!
  \************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

eval("\r\nObject.defineProperty(exports, \"__esModule\", ({ value: true }));\r\nexports.NewsGroupsPane = void 0;\r\nvar tag_1 = __webpack_require__(/*! ./tag */ \"./src/tag.ts\");\r\nvar toolbar_1 = __webpack_require__(/*! ./toolbar */ \"./src/toolbar.ts\");\r\n;\r\nvar NewsGroupsPane = /** @class */ (function () {\r\n    function NewsGroupsPane() {\r\n        this.id = \"newsgroups-pane\";\r\n        this.data = [];\r\n        this.clickCb = null;\r\n        this.toolbar = new toolbar_1.ToolBar('NewGroup');\r\n        this.toolbar.add_btn(new toolbar_1.Btn({ icon: 'caret-right' }));\r\n        this.toolbar.add_btn(new toolbar_1.Btn({ icon: 'caret-down-fill' }));\r\n        this.toolbar.add_btn(new toolbar_1.Btn({ icon: 'gear-fill' }));\r\n        this.toolbar.add_btn(new toolbar_1.Btn({ icon: 'x-square' }));\r\n    }\r\n    NewsGroupsPane.prototype.setData = function (data) {\r\n        this.data = data;\r\n    };\r\n    NewsGroupsPane.prototype.setClickCb = function (cb) {\r\n        this.clickCb = cb;\r\n    };\r\n    NewsGroupsPane.prototype.html = function () {\r\n        return this.toolbar.html() +\r\n            tag_1.div({ class: 'newsgroup' }, tag_1.div({ id: this.id, class: 'nb-list-group' }, this.data.map(function (d) { return tag_1.button({ 'newsgroup-id': d.id }, d.name); }).join('')));\r\n    };\r\n    NewsGroupsPane.prototype.bind = function () {\r\n        var _this = this;\r\n        this.toolbar.bind();\r\n        $(\"#\" + this.id + \" >button\").on('click', function (ev) {\r\n            var t = ev.currentTarget;\r\n            var ng_id = t.attributes['newsgroup-id'].value;\r\n            if (_this.clickCb)\r\n                _this.clickCb(ng_id);\r\n        });\r\n    };\r\n    NewsGroupsPane.prototype.select_newsgroup = function (id) {\r\n        $(\"#\" + this.id + \" >button\").removeClass('active');\r\n        $(\"#\" + this.id + \" >button[newsgroup-id=\" + id + \"]\").addClass('active');\r\n    };\r\n    NewsGroupsPane.prototype.id2name = function (id) {\r\n        for (var _i = 0, _a = this.data; _i < _a.length; _i++) {\r\n            var ng = _a[_i];\r\n            if (ng.id == id)\r\n                return ng.name;\r\n        }\r\n        return null;\r\n    };\r\n    NewsGroupsPane.prototype.name2id = function (name) {\r\n        for (var _i = 0, _a = this.data; _i < _a.length; _i++) {\r\n            var ng = _a[_i];\r\n            if (ng.name == name)\r\n                return ng.id;\r\n        }\r\n        return null;\r\n    };\r\n    return NewsGroupsPane;\r\n}());\r\nexports.NewsGroupsPane = NewsGroupsPane;\r\n\n\n//# sourceURL=webpack://nnsbbs/./src/ng_pane.ts?");

/***/ }),

/***/ "./src/nnsbbs.ts":
/*!***********************!*\
  !*** ./src/nnsbbs.ts ***!
  \***********************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

eval("\r\nvar __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {\r\n    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }\r\n    return new (P || (P = Promise))(function (resolve, reject) {\r\n        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }\r\n        function rejected(value) { try { step(generator[\"throw\"](value)); } catch (e) { reject(e); } }\r\n        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }\r\n        step((generator = generator.apply(thisArg, _arguments || [])).next());\r\n    });\r\n};\r\nvar __generator = (this && this.__generator) || function (thisArg, body) {\r\n    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;\r\n    return g = { next: verb(0), \"throw\": verb(1), \"return\": verb(2) }, typeof Symbol === \"function\" && (g[Symbol.iterator] = function() { return this; }), g;\r\n    function verb(n) { return function (v) { return step([n, v]); }; }\r\n    function step(op) {\r\n        if (f) throw new TypeError(\"Generator is already executing.\");\r\n        while (_) try {\r\n            if (f = 1, y && (t = op[0] & 2 ? y[\"return\"] : op[0] ? y[\"throw\"] || ((t = y[\"return\"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;\r\n            if (y = 0, t) op = [op[0] & 2, t.value];\r\n            switch (op[0]) {\r\n                case 0: case 1: t = op; break;\r\n                case 4: _.label++; return { value: op[1], done: false };\r\n                case 5: _.label++; y = op[1]; op = [0]; continue;\r\n                case 7: op = _.ops.pop(); _.trys.pop(); continue;\r\n                default:\r\n                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }\r\n                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }\r\n                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }\r\n                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }\r\n                    if (t[2]) _.ops.pop();\r\n                    _.trys.pop(); continue;\r\n            }\r\n            op = body.call(thisArg, _);\r\n        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }\r\n        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };\r\n    }\r\n};\r\nObject.defineProperty(exports, \"__esModule\", ({ value: true }));\r\nvar util_1 = __webpack_require__(/*! ./util */ \"./src/util.ts\");\r\nvar tag_1 = __webpack_require__(/*! ./tag */ \"./src/tag.ts\");\r\nvar ng_pane_1 = __webpack_require__(/*! ./ng_pane */ \"./src/ng_pane.ts\");\r\nvar titles_pane_1 = __webpack_require__(/*! ./titles_pane */ \"./src/titles_pane.ts\");\r\nvar article_pain_1 = __webpack_require__(/*! ./article_pain */ \"./src/article_pain.ts\");\r\nvar toolbar_1 = __webpack_require__(/*! ./toolbar */ \"./src/toolbar.ts\");\r\nvar NssBss = /** @class */ (function () {\r\n    function NssBss() {\r\n        this.ng_pane = new ng_pane_1.NewsGroupsPane();\r\n        this.titles_pane = new titles_pane_1.TitlesPane();\r\n        this.article_pane = new article_pain_1.ArticlePane();\r\n        this.cur_newsgroup = \"\";\r\n        this.cur_newsgroup_id = 0;\r\n    }\r\n    NssBss.prototype.html = function () {\r\n        var s = \"\";\r\n        s += tag_1.div({ id: 'newsgroup' }, this.ng_pane.html());\r\n        s += tag_1.div({ id: 'gutter1', class: 'gutter' });\r\n        s += tag_1.div({ id: 'titles' }, this.titles_pane.html());\r\n        s += tag_1.div({ id: 'gutter2', class: 'gutter' });\r\n        s += tag_1.div({ id: 'article' }, this.article_pane.html());\r\n        return s;\r\n    };\r\n    NssBss.prototype.bind = function () {\r\n        var _this = this;\r\n        this.ng_pane.bind();\r\n        this.titles_pane.bind();\r\n        this.article_pane.bind();\r\n        this.ng_pane.setClickCb(function (id) {\r\n            _this.select_newsgroup(id);\r\n        });\r\n        this.titles_pane.setClickCb(function (newsgroup_id, article_id) {\r\n            _this.select_article(newsgroup_id, article_id);\r\n        });\r\n        this.article_pane.toolbar.add_btn(new toolbar_1.Btn({\r\n            icon: 'card-heading',\r\n            explain: '記事のヘッダの表示を切替',\r\n            action: function () {\r\n                _this.article_pane.toggle_header();\r\n            }\r\n        }));\r\n    };\r\n    NssBss.prototype.top_page = function (newsgroup, article_id) {\r\n        return __awaiter(this, void 0, void 0, function () {\r\n            var data, id;\r\n            return __generator(this, function (_a) {\r\n                switch (_a.label) {\r\n                    case 0: return [4 /*yield*/, util_1.get_json('/api/newsgroup')];\r\n                    case 1:\r\n                        data = _a.sent();\r\n                        this.ng_pane.setData(data);\r\n                        $('#newsgroup').html(this.ng_pane.html());\r\n                        this.ng_pane.bind();\r\n                        if (!(newsgroup != \"\")) return [3 /*break*/, 3];\r\n                        return [4 /*yield*/, this.select_newsgroup(newsgroup)];\r\n                    case 2:\r\n                        _a.sent();\r\n                        if (article_id != \"\") {\r\n                            id = parseInt(article_id);\r\n                            this.select_article(this.cur_newsgroup_id, id);\r\n                        }\r\n                        _a.label = 3;\r\n                    case 3: return [2 /*return*/];\r\n                }\r\n            });\r\n        });\r\n    };\r\n    NssBss.prototype.select_article = function (newsgroup_id, article_id) {\r\n        return __awaiter(this, void 0, void 0, function () {\r\n            return __generator(this, function (_a) {\r\n                switch (_a.label) {\r\n                    case 0: return [4 /*yield*/, this.article_pane.open(newsgroup_id, article_id)];\r\n                    case 1:\r\n                        _a.sent();\r\n                        this.titles_pane.select_article(article_id);\r\n                        $('#article').html(this.article_pane.html());\r\n                        this.article_pane.bind();\r\n                        window.history.pushState(null, '', \"/\" + this.cur_newsgroup + \"/\" + article_id);\r\n                        document.title = \"nnsbbs/\" + this.cur_newsgroup + \"/\" + article_id;\r\n                        return [2 /*return*/];\r\n                }\r\n            });\r\n        });\r\n    };\r\n    NssBss.prototype.select_newsgroup = function (newsgroup) {\r\n        return __awaiter(this, void 0, void 0, function () {\r\n            var id, name;\r\n            return __generator(this, function (_a) {\r\n                switch (_a.label) {\r\n                    case 0:\r\n                        if (typeof newsgroup == 'number') {\r\n                            id = newsgroup;\r\n                            name = this.ng_pane.id2name(id);\r\n                            if (!name)\r\n                                throw Error(\"newsgroup_id:\" + id + \" not found\");\r\n                        }\r\n                        else if (/\\d+/.test(newsgroup)) {\r\n                            id = parseInt(newsgroup);\r\n                            name = this.ng_pane.id2name(id);\r\n                            if (!name)\r\n                                throw Error(\"newsgroup_id:\" + id + \" not found\");\r\n                        }\r\n                        else {\r\n                            id = this.ng_pane.name2id(newsgroup);\r\n                            name = newsgroup;\r\n                            if (!id)\r\n                                throw Error(\"newsgroup:\" + newsgroup + \" not found\");\r\n                        }\r\n                        this.ng_pane.select_newsgroup(id);\r\n                        this.article_pane.clear();\r\n                        $('#article').html(this.article_pane.html());\r\n                        return [4 /*yield*/, this.titles_pane.open(id)];\r\n                    case 1:\r\n                        _a.sent();\r\n                        $('#titles').html(this.titles_pane.html());\r\n                        this.titles_pane.bind();\r\n                        window.history.pushState(null, '', \"/\" + name);\r\n                        document.title = \"nnsbbs/\" + name;\r\n                        this.cur_newsgroup = name;\r\n                        this.cur_newsgroup_id = id;\r\n                        return [2 /*return*/];\r\n                }\r\n            });\r\n        });\r\n    };\r\n    return NssBss;\r\n}());\r\nexports.default = NssBss;\r\n\n\n//# sourceURL=webpack://nnsbbs/./src/nnsbbs.ts?");

/***/ }),

/***/ "./src/tag.ts":
/*!********************!*\
  !*** ./src/tag.ts ***!
  \********************/
/***/ (function(__unused_webpack_module, exports) {

eval("\r\n// import printf = require('printf');\r\nvar __spreadArray = (this && this.__spreadArray) || function (to, from) {\r\n    for (var i = 0, il = from.length, j = to.length; i < il; i++, j++)\r\n        to[j] = from[i];\r\n    return to;\r\n};\r\nObject.defineProperty(exports, \"__esModule\", ({ value: true }));\r\nexports.li = exports.ul = exports.label = exports.option = exports.select = exports.input = exports.button = exports.img = exports.span = exports.div = exports.tag = void 0;\r\nfunction tag(name) {\r\n    var args = [];\r\n    for (var _i = 1; _i < arguments.length; _i++) {\r\n        args[_i - 1] = arguments[_i];\r\n    }\r\n    var attr = {};\r\n    var html = '<' + name;\r\n    for (var _a = 0, args_1 = args; _a < args_1.length; _a++) {\r\n        var a = args_1[_a];\r\n        if (typeof a != 'string') {\r\n            for (var k in a) {\r\n                if (k in attr)\r\n                    attr[k] += ' ' + a[k];\r\n                else\r\n                    attr[k] = a[k];\r\n            }\r\n        }\r\n    }\r\n    for (var k in attr) {\r\n        html += ' ' + k;\r\n        html += '=\"' + attr[k] + '\"';\r\n        html += k + \"=\" + attr[k];\r\n    }\r\n    html += '>';\r\n    for (var _b = 0, args_2 = args; _b < args_2.length; _b++) {\r\n        var a = args_2[_b];\r\n        if (typeof a == 'string')\r\n            html += a;\r\n    }\r\n    html += '</' + name + '>';\r\n    return html;\r\n}\r\nexports.tag = tag;\r\nfunction div() {\r\n    var args = [];\r\n    for (var _i = 0; _i < arguments.length; _i++) {\r\n        args[_i] = arguments[_i];\r\n    }\r\n    return tag.apply(void 0, __spreadArray(['div'], args));\r\n}\r\nexports.div = div;\r\nfunction span() {\r\n    var args = [];\r\n    for (var _i = 0; _i < arguments.length; _i++) {\r\n        args[_i] = arguments[_i];\r\n    }\r\n    return tag.apply(void 0, __spreadArray(['span'], args));\r\n}\r\nexports.span = span;\r\nfunction img() {\r\n    var args = [];\r\n    for (var _i = 0; _i < arguments.length; _i++) {\r\n        args[_i] = arguments[_i];\r\n    }\r\n    return tag.apply(void 0, __spreadArray(['img'], args));\r\n}\r\nexports.img = img;\r\nfunction button() {\r\n    var args = [];\r\n    for (var _i = 0; _i < arguments.length; _i++) {\r\n        args[_i] = arguments[_i];\r\n    }\r\n    return tag.apply(void 0, __spreadArray(['button'], args));\r\n}\r\nexports.button = button;\r\nfunction input() {\r\n    var args = [];\r\n    for (var _i = 0; _i < arguments.length; _i++) {\r\n        args[_i] = arguments[_i];\r\n    }\r\n    return tag.apply(void 0, __spreadArray(['input'], args));\r\n}\r\nexports.input = input;\r\nfunction select() {\r\n    var args = [];\r\n    for (var _i = 0; _i < arguments.length; _i++) {\r\n        args[_i] = arguments[_i];\r\n    }\r\n    return tag.apply(void 0, __spreadArray(['select'], args));\r\n}\r\nexports.select = select;\r\nfunction option() {\r\n    var args = [];\r\n    for (var _i = 0; _i < arguments.length; _i++) {\r\n        args[_i] = arguments[_i];\r\n    }\r\n    return tag.apply(void 0, __spreadArray(['option'], args));\r\n}\r\nexports.option = option;\r\nfunction label() {\r\n    var args = [];\r\n    for (var _i = 0; _i < arguments.length; _i++) {\r\n        args[_i] = arguments[_i];\r\n    }\r\n    return tag.apply(void 0, __spreadArray(['label'], args));\r\n}\r\nexports.label = label;\r\nfunction ul() {\r\n    var args = [];\r\n    for (var _i = 0; _i < arguments.length; _i++) {\r\n        args[_i] = arguments[_i];\r\n    }\r\n    return tag.apply(void 0, __spreadArray(['ul'], args));\r\n}\r\nexports.ul = ul;\r\nfunction li() {\r\n    var args = [];\r\n    for (var _i = 0; _i < arguments.length; _i++) {\r\n        args[_i] = arguments[_i];\r\n    }\r\n    return tag.apply(void 0, __spreadArray(['li'], args));\r\n}\r\nexports.li = li;\r\n\n\n//# sourceURL=webpack://nnsbbs/./src/tag.ts?");

/***/ }),

/***/ "./src/titles_pane.ts":
/*!****************************!*\
  !*** ./src/titles_pane.ts ***!
  \****************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

eval("\r\nvar __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {\r\n    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }\r\n    return new (P || (P = Promise))(function (resolve, reject) {\r\n        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }\r\n        function rejected(value) { try { step(generator[\"throw\"](value)); } catch (e) { reject(e); } }\r\n        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }\r\n        step((generator = generator.apply(thisArg, _arguments || [])).next());\r\n    });\r\n};\r\nvar __generator = (this && this.__generator) || function (thisArg, body) {\r\n    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;\r\n    return g = { next: verb(0), \"throw\": verb(1), \"return\": verb(2) }, typeof Symbol === \"function\" && (g[Symbol.iterator] = function() { return this; }), g;\r\n    function verb(n) { return function (v) { return step([n, v]); }; }\r\n    function step(op) {\r\n        if (f) throw new TypeError(\"Generator is already executing.\");\r\n        while (_) try {\r\n            if (f = 1, y && (t = op[0] & 2 ? y[\"return\"] : op[0] ? y[\"throw\"] || ((t = y[\"return\"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;\r\n            if (y = 0, t) op = [op[0] & 2, t.value];\r\n            switch (op[0]) {\r\n                case 0: case 1: t = op; break;\r\n                case 4: _.label++; return { value: op[1], done: false };\r\n                case 5: _.label++; y = op[1]; op = [0]; continue;\r\n                case 7: op = _.ops.pop(); _.trys.pop(); continue;\r\n                default:\r\n                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }\r\n                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }\r\n                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }\r\n                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }\r\n                    if (t[2]) _.ops.pop();\r\n                    _.trys.pop(); continue;\r\n            }\r\n            op = body.call(thisArg, _);\r\n        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }\r\n        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };\r\n    }\r\n};\r\nObject.defineProperty(exports, \"__esModule\", ({ value: true }));\r\nexports.TitlesPane = void 0;\r\nvar util_1 = __webpack_require__(/*! ./util */ \"./src/util.ts\");\r\nvar tag_1 = __webpack_require__(/*! ./tag */ \"./src/tag.ts\");\r\nvar toolbar_1 = __webpack_require__(/*! ./toolbar */ \"./src/toolbar.ts\");\r\n;\r\nvar TitlesPane = /** @class */ (function () {\r\n    function TitlesPane() {\r\n        this.id = \"titles-pane\";\r\n        this.titles = [];\r\n        this.threads = null;\r\n        this.newsgroup_id = null;\r\n        this.bDispTherad = true;\r\n        this.thread_depth = 20;\r\n        this.clickCb = null;\r\n        this.toolbar = new toolbar_1.ToolBar('Titles');\r\n    }\r\n    TitlesPane.prototype.open = function (newsgroup_id) {\r\n        return __awaiter(this, void 0, void 0, function () {\r\n            var data, _i, _a, d, id, parent_1;\r\n            return __generator(this, function (_b) {\r\n                switch (_b.label) {\r\n                    case 0: return [4 /*yield*/, util_1.get_json('/api/titles', { data: { newsgroup_id: newsgroup_id } })];\r\n                    case 1:\r\n                        data = _b.sent();\r\n                        this.titles = [];\r\n                        this.threads = [];\r\n                        for (_i = 0, _a = data; _i < _a.length; _i++) {\r\n                            d = _a[_i];\r\n                            id = d.article_id;\r\n                            this.titles[id] = d;\r\n                            parent_1 = this.titles[d.reply_to];\r\n                            if (parent_1) {\r\n                                if (!parent_1.children)\r\n                                    parent_1.children = [];\r\n                                parent_1.children.push(d);\r\n                            }\r\n                            else {\r\n                                this.threads.push(d);\r\n                            }\r\n                        }\r\n                        this.newsgroup_id = newsgroup_id;\r\n                        return [2 /*return*/];\r\n                }\r\n            });\r\n        });\r\n    };\r\n    TitlesPane.prototype.setClickCb = function (cb) {\r\n        this.clickCb = cb;\r\n    };\r\n    TitlesPane.prototype.html = function () {\r\n        var s = \"\";\r\n        if (this.bDispTherad && this.threads) {\r\n            for (var _i = 0, _a = this.threads; _i < _a.length; _i++) {\r\n                var t = _a[_i];\r\n                s += this.thread_html(t, 0);\r\n            }\r\n        }\r\n        else {\r\n            for (var id in this.titles) {\r\n                var d = this.titles[id];\r\n                s += this.title_html(d, 0);\r\n            }\r\n        }\r\n        return this.toolbar.html() + tag_1.div({ class: 'titles' }, tag_1.div({ id: this.id, class: 'nb-list-group' }, s));\r\n    };\r\n    TitlesPane.prototype.thread_html = function (t, depth) {\r\n        var s = this.title_html(t, depth);\r\n        if (t.children) {\r\n            for (var _i = 0, _a = t.children; _i < _a.length; _i++) {\r\n                var c = _a[_i];\r\n                s += this.thread_html(c, depth + this.thread_depth);\r\n            }\r\n        }\r\n        return s;\r\n    };\r\n    TitlesPane.prototype.title_html = function (d, depth) {\r\n        var s = tag_1.button({ article_id: d.article_id }, tag_1.div({ class: 'article-id' }, String(d.article_id)), tag_1.div({ class: 'article-from' }, d.disp_name), tag_1.div({ class: 'article-time' }, d.date), tag_1.div({ class: 'article-title', style: \"left: \" + depth + \"px;\" }, d.title));\r\n        return s;\r\n    };\r\n    TitlesPane.prototype.bind = function () {\r\n        var _this = this;\r\n        this.toolbar.bind();\r\n        $(\"#\" + this.id + \" >button\").on('click', function (ev) {\r\n            var target = ev.currentTarget;\r\n            var article_id = target.attributes['article_id'].value;\r\n            _this.select_article(article_id);\r\n            if (_this.newsgroup_id && _this.clickCb) {\r\n                _this.clickCb(_this.newsgroup_id, article_id);\r\n            }\r\n        });\r\n    };\r\n    TitlesPane.prototype.select_article = function (id) {\r\n        $(\"#\" + this.id + \" >button\").removeClass('active');\r\n        $(\"#\" + this.id + \" >button[article_id=\" + id + \"]\").addClass('active');\r\n    };\r\n    return TitlesPane;\r\n}());\r\nexports.TitlesPane = TitlesPane;\r\n\n\n//# sourceURL=webpack://nnsbbs/./src/titles_pane.ts?");

/***/ }),

/***/ "./src/toolbar.ts":
/*!************************!*\
  !*** ./src/toolbar.ts ***!
  \************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

eval("\r\nObject.defineProperty(exports, \"__esModule\", ({ value: true }));\r\nexports.Btn = exports.ToolBar = void 0;\r\nvar tag_1 = __webpack_require__(/*! ./tag */ \"./src/tag.ts\");\r\nvar sn = 0;\r\nvar ToolBar = /** @class */ (function () {\r\n    function ToolBar(title) {\r\n        if (title === void 0) { title = \"\"; }\r\n        this.btns = [];\r\n        this.open_icon_name = 'bi-caret-down-fill';\r\n        this.close_icon_name = 'bi-caret-right-fill';\r\n        this.bOpen = true;\r\n        this.id = \"toolbar-\" + sn++;\r\n        this.id_chk = this.id + \"-chk\";\r\n        if (title != \"\")\r\n            this.title = title;\r\n        else\r\n            this.title = this.id;\r\n    }\r\n    ToolBar.prototype.html = function () {\r\n        var s = tag_1.tag('i', { id: this.id_chk, class: this.bOpen ? this.open_icon_name : this.close_icon_name });\r\n        s += tag_1.span({ class: 'toolbar-title' }, this.title);\r\n        for (var _i = 0, _a = this.btns; _i < _a.length; _i++) {\r\n            var btn = _a[_i];\r\n            s += btn.html();\r\n        }\r\n        return tag_1.div({ class: 'toolbar', id: this.id }, s);\r\n    };\r\n    ToolBar.prototype.bind = function () {\r\n        var _this = this;\r\n        $('#' + this.id_chk).on('click', function () {\r\n            _this.setState(!_this.bOpen);\r\n        });\r\n        for (var _i = 0, _a = this.btns; _i < _a.length; _i++) {\r\n            var btn = _a[_i];\r\n            btn.bind();\r\n        }\r\n    };\r\n    ToolBar.prototype.add_btn = function (btn) {\r\n        this.btns.push(btn);\r\n    };\r\n    ToolBar.prototype.setState = function (bOpen) {\r\n        console.log('setState:', bOpen);\r\n        this.bOpen = bOpen;\r\n        if (bOpen) {\r\n            $('#' + this.id_chk).removeClass(this.close_icon_name);\r\n            $('#' + this.id_chk).addClass(this.open_icon_name);\r\n            $('#' + this.id).removeClass('closed');\r\n        }\r\n        else {\r\n            $('#' + this.id_chk).addClass(this.close_icon_name);\r\n            $('#' + this.id_chk).removeClass(this.open_icon_name);\r\n            $('#' + this.id).addClass('closed');\r\n        }\r\n    };\r\n    return ToolBar;\r\n}());\r\nexports.ToolBar = ToolBar;\r\n;\r\nvar btn_sn = 0;\r\nvar Btn = /** @class */ (function () {\r\n    function Btn(opt) {\r\n        this.opt = opt;\r\n        this.id = 'toolbar-btn-' + btn_sn++;\r\n    }\r\n    Btn.prototype.html = function () {\r\n        var opt = { id: this.id, class: \"bi-\" + this.opt.icon };\r\n        if (this.opt.explain)\r\n            opt['title'] = this.opt.explain;\r\n        return tag_1.tag('i', opt);\r\n    };\r\n    Btn.prototype.bind = function () {\r\n        var _this = this;\r\n        $('#' + this.id).on('click', function (e) {\r\n            if (_this.opt.action)\r\n                _this.opt.action(e, _this);\r\n        });\r\n    };\r\n    return Btn;\r\n}());\r\nexports.Btn = Btn;\r\n\n\n//# sourceURL=webpack://nnsbbs/./src/toolbar.ts?");

/***/ }),

/***/ "./src/util.ts":
/*!*********************!*\
  !*** ./src/util.ts ***!
  \*********************/
/***/ ((__unused_webpack_module, exports) => {

eval("\r\nObject.defineProperty(exports, \"__esModule\", ({ value: true }));\r\nexports.get_json = void 0;\r\nfunction get_json(path, option) {\r\n    if (option === void 0) { option = {}; }\r\n    var opt = { url: path, type: \"GET\", dataType: \"json\" };\r\n    for (var key in option)\r\n        opt[key] = option[key];\r\n    return new Promise(function (resolve, reject) {\r\n        opt['success'] = function (data, dataType) { resolve(data); };\r\n        opt['error'] = function (xhr, ts, es) { reject(ts); };\r\n        $.ajax(opt);\r\n    });\r\n}\r\nexports.get_json = get_json;\r\n\n\n//# sourceURL=webpack://nnsbbs/./src/util.ts?");

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module is referenced by other modules so it can't be inlined
/******/ 	var __webpack_exports__ = __webpack_require__("./src/app.ts");
/******/ 	
/******/ })()
;