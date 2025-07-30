"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.transformPost = exports.parseDateString = void 0;
const array_1 = require("./array");
const parseDateString = (dateStr) => {
    const parts = dateStr.split("/");
    if (parts.length !== 3)
        return null;
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const year = parseInt(parts[2], 10);
    if (isNaN(day) ||
        isNaN(month) ||
        isNaN(year) ||
        day < 1 ||
        day > 31 ||
        month < 0 ||
        month > 11) {
        return null;
    }
    return new Date(year, month, day);
};
exports.parseDateString = parseDateString;
const transformPost = (post) => {
    var _a, _b;
    const handicapMovements = post.handicapMovements;
    const maxWin = (0, array_1.getMaxByKey)(handicapMovements, "winRate", "totalMatches");
    const maxDraw = (0, array_1.getMaxByKey)(handicapMovements, "drawRate", "totalMatches");
    const maxLost = (0, array_1.getMaxByKey)(handicapMovements, "lostRate", "totalMatches");
    const maxHomeWin = (0, array_1.getMaxByKey)(handicapMovements
        .filter((e) => e.type === "HDP" && e.ahSide === "HOME")
        .sort((a, b) => b.totalMatches - a.totalMatches), "winRate");
    const maxAwayWin = (0, array_1.getMaxByKey)(handicapMovements
        .filter((e) => e.type === "HDP" && e.ahSide === "AWAY")
        .sort((a, b) => b.totalMatches - a.totalMatches), "winRate");
    const maxOUWin = (0, array_1.getMaxByKey)(handicapMovements
        .filter((e) => e.type === "OU")
        .sort((a, b) => b.totalMatches - a.totalMatches), "winRate");
    return Object.assign(Object.assign({}, post), { _id: undefined, id: post._id, userId: undefined, author: ((_a = post.userId) === null || _a === void 0 ? void 0 : _a.name) || ((_b = post.userId) === null || _b === void 0 ? void 0 : _b.username), handicapMovements: [...post.handicapMovements], mostWin: (maxWin === null || maxWin === void 0 ? void 0 : maxWin.winRate) > 0 ? sanitizeMax(maxWin) : null, mostDraw: (maxDraw === null || maxDraw === void 0 ? void 0 : maxDraw.drawRate) > 0 ? sanitizeMax(maxDraw) : null, mostLost: (maxLost === null || maxLost === void 0 ? void 0 : maxLost.lostRate) > 0 ? sanitizeMax(maxLost) : null, mostHomeWin: maxHomeWin ? sanitizeMax(maxHomeWin) : null, mostAwayWin: maxAwayWin ? sanitizeMax(maxAwayWin) : null, mostOUWin: maxOUWin ? sanitizeMax(maxOUWin) : null });
};
exports.transformPost = transformPost;
function sanitizeMax(maxObj) {
    if (typeof maxObj.toObject === "function") {
        maxObj = maxObj.toObject();
    }
    return Object.assign(Object.assign({}, maxObj), { _id: undefined, postId: undefined, matches: undefined });
}
