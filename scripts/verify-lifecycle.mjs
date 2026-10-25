import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";

// Full plugin lifecycle check against the generated bundle.
//
// This goes beyond the loader check in verify-bundle.mjs: it instantiates the
// bundled plugin inside a simulated Obsidian app (in-memory vault, workspace,
// and plugin base class) and actually runs onload()/onunload(). It verifies
// command, view, ribbon, and event registration, data-file initialization,
// and the fail-closed behavior when existing graph/registry data is invalid:
// startup must abort without overwriting or resetting the user's data.

const root = process.cwd();
const entry = path.resolve(process.argv[2] ?? path.join(root, "main.js"));

function fail(message) {
  console.error(`Lifecycle check failed: ${message}`);
  process.exit(1);
}

if (!fs.existsSync(entry)) fail(`entry point not found: ${entry}`);
const code = fs.readFileSync(entry, "utf8");

// --- Simulated Obsidian environment ---

class TFile {
  constructor(filePath) {
    this.path = filePath;
  }
}

class InMemoryVault {
  constructor(seed = []) {
    this.files = new Map(seed); // path -> content
    this.folders = new Set();
  }
  adapter = {
    exists: async (p) => this.files.has(p) || this.folders.has(p),
  };
  async createFolder(p) {
    this.folders.add(p);
  }
  async create(p, content) {
    this.files.set(p, content);
    return new TFile(p);
  }
  getAbstractFileByPath(p) {
    return this.files.has(p) ? new TFile(p) : null;
  }
  async read(file) {
    return this.files.get(file.path);
  }
  async modify(file, content) {
    this.files.set(file.path, content);
  }
  async delete(file) {
    this.files.delete(file.path);
  }
}

class MockWorkspace {
  constructor() {
    this.detached = [];
    this.eventHandlers = [];
  }
  on(name, callback) {
    this.eventHandlers.push({ name, callback });
    return { name, callback };
  }
  getLeavesOfType() {
    return [];
  }
  getRightLeaf() {
    return { setViewState: async () => {} };
  }
  revealLeaf() {}
  detachLeavesOfType(type) {
    this.detached.push(type);
  }
}

class MockPluginBase {
  constructor(app, manifest) {
    this.app = app;
    this.manifest = manifest;
    this.commands = [];
    this.ribbons = [];
    this.views = [];
    this.registeredEvents = [];
  }
  addCommand(command) {
    this.commands.push(command);
    return command;
  }
  addRibbonIcon(icon, title, callback) {
    this.ribbons.push({ icon, title, callback });
    return null;
  }
  registerView(type, factory) {
    this.views.push({ type, factory });
  }
  registerEvent(eventRef) {
    this.registeredEvents.push(eventRef);
    return eventRef;
  }
  async onload() {}
  async onunload() {}
}

function loadBundle(source) {
  const notices = [];
  const mockObsidian = {
    Plugin: MockPluginBase,
    ItemView: class ItemView {
      constructor(leaf) {
        this.leaf = leaf;
      }
    },
    Modal: class Modal {
      constructor() {}
      open() {}
      close() {}
    },
    Notice: class Notice {
      constructor(message) {
        notices.push(String(message));
      }
    },
    Setting: class Setting {
      addButton() {
        return this;
      }
    },
    TFile,
    normalizePath: value => value,
  };
  const moduleObject = { exports: {} };
  const factory = new vm.Script(
    `(function (require, module, exports) {\n${source}\n})`,
    { filename: "plugin:holotaxon" }
  ).runInNewContext({});
  factory(
    id => {
      if (id === "obsidian") return mockObsidian;
      throw new Error(`load-time require("${id}") cannot be resolved by Obsidian's plugin loader`);
    },
    moduleObject,
    moduleObject.exports
  );
  const pluginClass = moduleObject.exports.default;
  if (typeof pluginClass !== "function") fail("bundle does not export a default class");
  if (!(pluginClass.prototype instanceof mockObsidian.Plugin)) {
    fail("bundle default export does not extend the Obsidian Plugin base class");
  }
  return { pluginClass, notices };
}

const manifest = { id: "holotaxon", version: "0.1.0" };
const expectedCommandIds = [
  "open-dashboard",
  "validate-graph",
  "create-entity",
  "create-relation",
  "export-snapshot",
  "merge-registry",
].sort();

// --- Scenario 1: clean vault, full lifecycle ---

{
  const vault = new InMemoryVault();
  const workspace = new MockWorkspace();
  const { pluginClass, notices } = loadBundle(code);
  const plugin = new pluginClass({ vault, workspace }, manifest);
  await plugin.onload();

  const commandIds = plugin.commands.map(command => command.id).sort();
  if (JSON.stringify(commandIds) !== JSON.stringify(expectedCommandIds)) {
    fail(`onload registered commands ${JSON.stringify(commandIds)}; expected ${JSON.stringify(expectedCommandIds)}`);
  }
  if (plugin.ribbons.length !== 1) fail(`expected exactly one ribbon icon, found ${plugin.ribbons.length}`);
  if (!plugin.views.some(view => view.type === "holotaxon-dashboard")) {
    fail("onload did not register the holotaxon-dashboard view");
  }
  if (plugin.registeredEvents.length !== 1) {
    fail(`expected exactly one registered workspace event, found ${plugin.registeredEvents.length}`);
  }
  if (notices.length !== 0) fail(`clean load produced unexpected notices: ${notices.join(" | ")}`);

  for (const folder of ["HoloTaxon", "HoloTaxon/backups", "HoloTaxon/reports"]) {
    if (!vault.folders.has(folder)) fail(`onload did not create folder ${folder}`);
  }
  if (!vault.files.has("HoloTaxon/graph.json")) fail("onload did not initialize HoloTaxon/graph.json");
  if (!vault.files.has("HoloTaxon/registry.json")) fail("onload did not initialize HoloTaxon/registry.json");
  const graph = JSON.parse(vault.files.get("HoloTaxon/graph.json"));
  if (!graph.entities || !graph.relations || graph.generation !== 0) {
    fail("initialized graph.json is not a valid empty graph envelope");
  }
  const registry = JSON.parse(vault.files.get("HoloTaxon/registry.json"));
  if (!registry.entity_types || !registry.relation_types || !registry.bundled_registry_version) {
    fail("initialized registry.json is not a valid registry envelope");
  }

  await plugin.onunload();
  if (!workspace.detached.includes("holotaxon-dashboard")) {
    fail("onunload did not detach the dashboard view leaves");
  }
}

// --- Fail-closed scenarios: invalid existing data must abort startup
// --- without modifying or resetting the user's files.

async function expectOnloadFailure(label, seed, expectedPattern) {
  const vault = new InMemoryVault(seed);
  const { pluginClass } = loadBundle(code);
  const plugin = new pluginClass({ vault, workspace: new MockWorkspace() }, manifest);
  let rejected = false;
  try {
    await plugin.onload();
  } catch (error) {
    rejected = true;
    if (!expectedPattern.test(error.message)) {
      fail(`${label}: unexpected failure message: ${error.message}`);
    }
  }
  if (!rejected) fail(`${label}: onload unexpectedly succeeded with invalid data`);
  for (const [filePath, content] of seed) {
    if (vault.files.get(filePath) !== content) {
      fail(`${label}: onload modified the pre-existing file ${filePath}; user data must be preserved`);
    }
  }
}

await expectOnloadFailure(
  "corrupt graph.json",
  [["HoloTaxon/graph.json", "{ not valid json"]],
  /refused to overwrite invalid JSON/
);
await expectOnloadFailure(
  "invalid graph envelope",
  [["HoloTaxon/graph.json", "{}"]],
  /Graph envelope at HoloTaxon\/graph\.json is invalid/
);
await expectOnloadFailure(
  "corrupt registry.json",
  [["HoloTaxon/registry.json", "not json at all"]],
  /refused to overwrite invalid JSON/
);
await expectOnloadFailure(
  "invalid registry envelope",
  [["HoloTaxon/registry.json", '{"entity_types": {}}']],
  /Registry at HoloTaxon\/registry\.json is invalid/
);

console.log(`Lifecycle check passed: ${entry} loads, registers all commands/views, initializes data files, fails closed on invalid data, and unloads cleanly.`);
