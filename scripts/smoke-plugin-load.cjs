const assert = require("node:assert/strict");
const Module = require("node:module");

class Plugin {}
const obsidianMock = {
  Plugin,
  ItemView: class ItemView {},
  Modal: class Modal {},
  Notice: class Notice {},
  Setting: class Setting {},
};

const originalLoad = Module._load;
Module._load = function (request, parent, isMain) {
  if (request === "obsidian") return obsidianMock;
  return originalLoad.call(this, request, parent, isMain);
};

try {
  const pluginEntry = require("../main.js");
  assert.equal(
    typeof pluginEntry,
    "function",
    "main.js must export the plugin constructor directly, not a module namespace object",
  );
  assert.ok(
    pluginEntry.prototype instanceof Plugin,
    "the exported constructor must extend Obsidian's Plugin base class",
  );
  console.log("Plugin entrypoint smoke test passed.");
} finally {
  Module._load = originalLoad;
}
