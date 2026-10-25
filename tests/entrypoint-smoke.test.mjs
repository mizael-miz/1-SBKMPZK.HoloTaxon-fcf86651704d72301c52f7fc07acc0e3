import assert from "node:assert/strict";
import { createRequire } from "node:module";
import test from "node:test";

const require = createRequire(import.meta.url);
const Module = require("node:module");

test("root main.js exports the Obsidian plugin constructor", () => {
  class Plugin {}

  const obsidianStubs = {
    App: class App {},
    ItemView: class ItemView {},
    Modal: class Modal {},
    Notice: class Notice {},
    Plugin,
    Setting: class Setting {},
    TFile: class TFile {},
    WorkspaceLeaf: class WorkspaceLeaf {},
  };

  const originalLoad = Module._load;
  Module._load = function (request, parent, isMain) {
    if (request === "obsidian") return obsidianStubs;
    return originalLoad.call(this, request, parent, isMain);
  };

  try {
    const EntryPoint = require("../main.js");
    assert.equal(typeof EntryPoint, "function", "main.js must return a class/function, not a module namespace object");
    assert.equal(EntryPoint.name, "HoloTaxonPlugin");
    assert.ok(EntryPoint.prototype instanceof Plugin, "entrypoint must inherit from Obsidian's Plugin class");
  } finally {
    Module._load = originalLoad;
  }
});
