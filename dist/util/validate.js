"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isHandicap = exports.isMaxLength = exports.isMinLength = void 0;
const isMinLength = (val, minLength) => {
    return val.length >= minLength;
};
exports.isMinLength = isMinLength;
const isMaxLength = (val, maxLength) => {
    return val.length <= maxLength;
};
exports.isMaxLength = isMaxLength;
const isHandicap = (value) => {
    const valStr = String(value);
    const regex = /^[+-]?\d+(?:\.(?:25|5|75))?$/;
    if (!regex.test(valStr))
        return false;
    const num = parseFloat(valStr);
    if (num < -10 || num > 10)
        return false;
    return true;
};
exports.isHandicap = isHandicap;
