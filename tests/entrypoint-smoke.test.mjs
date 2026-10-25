import assert from "node:assert/strict";
import { builtinModules } from "node:module";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import ts from "typescript";

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

function evaluate(code) {
  const module = { exports: {} };
  const requireStub = (specifier) => specifier === "obsidian" ? obsidian : undefined;
  new Function("require", "module", "exports", code)(requireStub, module, module.exports);
  return module.exports;
}
function assertPluginConstructor(value) {
  const exported = value?.default || value;
  assert.equal(typeof exported, "function", "entrypoint must export a plugin constructor");
  assert.ok(exported.prototype instanceof StubPlugin, "exported constructor must extend the Obsidian Plugin stub");
  return exported;
}

test("built main.js is self-contained and passes both loader variants", () => {
  assertOnlyWhitelistedImports(source);
  assert.match(source.trimEnd(), /module\.exports = module\.exports\.default \?\? module\.exports;$/);
  assertPluginConstructor(evaluate(source));
});

test("negative control: silent undefined stub re-export fails constructor assertion", () => {
  const fixture = 'module.exports = require("./stub");';
  assert.equal(evaluate(fixture), undefined);
  assert.throws(() => assertPluginConstructor(evaluate(fixture)), /plugin constructor/);
});

test("positive control: namespace export is rescued by normalization", () => {
  const fixture = 'class FixturePlugin extends require("obsidian").Plugin {}\nmodule.exports = { default: FixturePlugin };\nmodule.exports = module.exports.default ?? module.exports;';
  assertPluginConstructor(evaluate(fixture));
});

test("AST guard rejects relative and non-whitelisted imports", () => {
  assert.throws(() => assertOnlyWhitelistedImports('require("../escape"); require("not-whitelisted");'), /non-whitelisted module specifiers/);
});
