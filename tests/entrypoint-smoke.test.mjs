import assert from "node:assert/strict";
import { builtinModules } from "node:module";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import * as ts from "typescript";

const root = process.cwd();
const source = fs.readFileSync(path.join(root, "main.js"), "utf8");
const builtinNames = new Set(builtinModules.flatMap((name) => [name, name.replace(/^node:/, ""), `node:${name.replace(/^node:/, "")}`]));
const allowed = (specifier) =>
  specifier === "obsidian" ||
  specifier === "electron" ||
  specifier.startsWith("@codemirror/") ||
  specifier.startsWith("@lezer/") ||
  builtinNames.has(specifier);

function assertOnlyWhitelistedImports(code) {
  const ast = ts.createSourceFile("main.js", code, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);
  const violations = [];
  const inspect = (specifier, node) => {
    if (!allowed(specifier)) violations.push({ specifier, line: ast.getLineAndCharacterOfPosition(node.getStart(ast)).line + 1 });
  };
  const visit = (node) => {
    if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && node.expression.text === "require" &&
        node.arguments.length === 1 && ts.isStringLiteralLike(node.arguments[0])) {
      inspect(node.arguments[0].text, node.arguments[0]);
    }
    if ((ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) && node.moduleSpecifier && ts.isStringLiteralLike(node.moduleSpecifier)) {
      inspect(node.moduleSpecifier.text, node.moduleSpecifier);
    }
    ts.forEachChild(node, visit);
  };
  visit(ast);
  assert.deepEqual(violations, [], `main.js contains non-whitelisted module specifiers: ${JSON.stringify(violations)}`);
}

class StubPlugin {}
const obsidian = {
  App: class App {}, ItemView: class ItemView {}, Modal: class Modal {}, Notice: class Notice {},
  Plugin: StubPlugin, Setting: class Setting {}, TFile: class TFile {}, WorkspaceLeaf: class WorkspaceLeaf {},
};

function evaluateModule(code) {
  const module = { exports: {} };
  const requireStub = (specifier) => specifier === "obsidian" ? obsidian : undefined;
  new Function("require", "module", "exports", code)(requireStub, module, module.exports);
  return module;
}
function evaluate(code) {
  return evaluateModule(code).exports;
}
function assertPluginConstructor(value) {
  const exported = value?.default || value;
  assert.equal(typeof exported, "function", "entrypoint must export a plugin constructor");
  assert.ok(exported.prototype instanceof StubPlugin, "exported constructor must extend the Obsidian Plugin stub");
  return exported;
}

test("Android loader contract: real bundle, AST whitelist, and negative/positive controls", () => {
  assertOnlyWhitelistedImports(source);
  assert.ok(source.trimEnd().endsWith("module.exports = module.exports.default ?? module.exports;"), "bundle must end with the F1 normalization line");
  const realModule = evaluateModule(source);
  assertPluginConstructor(realModule.exports.default || realModule.exports);
  assert.equal(typeof realModule.exports, "function", "normalization must leave module.exports directly constructible");

  // Observed Android semantics: a relative require returns undefined silently, rather than throwing.
  const stubReExport = 'module.exports = require("./stub");';
  const failedModule = evaluateModule(stubReExport);
  assert.equal(failedModule.exports, undefined);
  assert.throws(() => assertPluginConstructor(failedModule.exports), /plugin constructor/);

  // Without normalization, the namespace object is not a constructor; the F1 footer rescues it.
  const namespaceWithoutNormalization = `class FixturePlugin extends require("obsidian").Plugin {}\nmodule.exports = { default: FixturePlugin };`;
  const namespaceModule = evaluateModule(namespaceWithoutNormalization);
  assertPluginConstructor(namespaceModule.exports.default || namespaceModule.exports);
  assert.notEqual(typeof namespaceModule.exports, "function", "without normalization the exported value remains a namespace object");
  const namespaceWithNormalization = namespaceWithoutNormalization + `
module.exports = module.exports.default ?? module.exports;`;
  const normalizedNamespaceModule = evaluateModule(namespaceWithNormalization);
  assertPluginConstructor(normalizedNamespaceModule.exports);
  assert.equal(typeof normalizedNamespaceModule.exports, "function");

  assert.throws(() => assertOnlyWhitelistedImports('require("../escape"); require("not-whitelisted");'), /non-whitelisted module specifiers/);
});
