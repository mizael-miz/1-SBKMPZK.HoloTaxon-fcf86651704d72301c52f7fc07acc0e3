"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isRecord = isRecord;
exports.nowIso = nowIso;
function isRecord(value) {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}
function nowIso() {
    return new Date().toISOString();
}
