import assert from "node:assert/strict";
import { createRequire } from "node:module";
import test from "node:test";

const require = createRequire(import.meta.url);
const Module = require("node:module");

test("bundled root main.js exports the default Obsidian plugin class", () => {
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
    normalizePath: value => value,
  };

  const originalLoad = Module._load;
  Module._load = function (request, parent, isMain) {
    if (request === "obsidian") return obsidianStubs;
    return originalLoad.call(this, request, parent, isMain);
  };

  try {
    delete require.cache[require.resolve("../main.js")];
    const pluginModule = require("../main.js");
    assert.equal(typeof pluginModule.default, "function", "Obsidian expects the default-exported plugin class");
    assert.ok(pluginModule.default.prototype instanceof Plugin, "default export must inherit from Obsidian's Plugin class");
  } finally {
    Module._load = originalLoad;
  }
});
