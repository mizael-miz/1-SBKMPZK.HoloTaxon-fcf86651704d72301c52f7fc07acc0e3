import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";

// Regression check for Obsidian's plugin loader.
//
// Obsidian evaluates a plugin's main.js as a string inside its own loader, so
// the entry point cannot rely on Node's file-based module resolution: a
// relative require("./dist/main.js") loads fine under plain Node but fails in
// Obsidian with "Cannot find module './dist/main.js'". This check evaluates
// the generated entry point in a fresh VM context whose require serves only a
// mocked "obsidian" module and rejects every other load-time dependency,
// mirroring that constraint. The legacy two-line dist wrapper is evaluated
// first as a control: it must fail, proving the harness discriminates.

const root = process.cwd();
const entry = path.resolve(process.argv[2] ?? path.join(root, "main.js"));

function fail(message) {
  console.error(`Bundle check failed: ${message}`);
  process.exit(1);
}

function evaluateLikeObsidianLoader(source, filename) {
  const requests = [];
  class MockPlugin {}
  const mockObsidian = {
    Plugin: MockPlugin,
    ItemView: class ItemView {},
    Modal: class Modal {},
    Notice: class Notice {},
    Setting: class Setting {},
    TFile: class TFile {},
    normalizePath: value => value,
  };
  const moduleObject = { exports: {} };
  const factory = new vm.Script(
    `(function (require, module, exports) {\n${source}\n})`,
    { filename }
  ).runInNewContext({});
  factory(
    id => {
      requests.push(id);
      if (id === "obsidian") return mockObsidian;
      throw new Error(`load-time require("${id}") cannot be resolved by Obsidian's plugin loader`);
    },
    moduleObject,
    moduleObject.exports
  );
  return { pluginClass: moduleObject.exports.default, requests, MockPlugin };
}

// Control: the legacy wrapper that delegated to ./dist/main.js must fail here,
// exactly as it failed inside Obsidian.
try {
  evaluateLikeObsidianLoader(
    'module.exports = require("./dist/main.js");',
    "control:legacy-dist-wrapper"
  );
  fail("the harness loaded the legacy dist wrapper; it does not reproduce the loader constraint");
} catch {
  // Expected: the control must fail.
}

if (!fs.existsSync(entry)) fail(`entry point not found: ${entry}`);
const code = fs.readFileSync(entry, "utf8");

let result;
try {
  result = evaluateLikeObsidianLoader(code, "plugin:holotaxon");
} catch (error) {
  fail(`${entry} does not load under the Obsidian-style harness: ${error.message}`);
}

if (typeof result.pluginClass !== "function") {
  fail(`${entry} does not expose a default plugin class export`);
}
if (!(result.pluginClass.prototype instanceof result.MockPlugin)) {
  fail(`${entry} default export does not extend the Obsidian Plugin base class`);
}
const unexpected = [...new Set(result.requests)].filter(id => id !== "obsidian");
if (unexpected.length) {
  fail(`${entry} has load-time require targets other than "obsidian": ${unexpected.join(", ")}`);
}

console.log(`Bundle check passed: ${entry} loads in the Obsidian-style harness (default plugin class, only "obsidian" required).`);
