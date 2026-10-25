import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const packageJson = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
const manifestPath = path.join(root, "manifest.json");
const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));

if (manifest.id !== "holotaxon") throw new Error(`Unexpected plugin id: ${manifest.id}`);
if (manifest.version !== packageJson.version) {
  throw new Error(`Version mismatch: package.json=${packageJson.version}, manifest.json=${manifest.version}`);
}
if (!fs.existsSync(path.join(root, "main.js"))) throw new Error("Missing bundled main.js; run npm run build first.");
const mainCode = fs.readFileSync(path.join(root, "main.js"), "utf8");
if (mainCode.includes('require("./dist/main.js")')) {
  throw new Error('main.js still delegates to "./dist/main.js"; it must be a single self-contained bundle.');
}

// Behavioral validation: the entry point must load under the Obsidian-style
// harness before it is packaged.
const precheck = spawnSync(
  process.execPath,
  [path.join(root, "scripts", "verify-bundle.mjs"), path.join(root, "main.js")],
  { stdio: "inherit" }
);
if (precheck.status !== 0) throw new Error("Bundled main.js failed the Obsidian-style loader check; not packaging.");

const output = path.join(root, "artifacts", "HoloTaxon");
fs.rmSync(output, { recursive: true, force: true });
fs.mkdirSync(output, { recursive: true });

for (const file of ["main.js", "manifest.json", "styles.css"]) {
  const source = path.join(root, file);
  if (!fs.existsSync(source)) throw new Error(`Missing required plugin file: ${file}`);
  fs.copyFileSync(source, path.join(output, file));
}

function walk(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const absolute = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(absolute) : [absolute];
  });
}

const packagedFiles = walk(output);
const relativeFiles = packagedFiles.map((file) => path.relative(output, file).split(path.sep).join("/"));
const unexpected = relativeFiles.filter((file) => !(
  file === "main.js" ||
  file === "manifest.json" ||
  file === "styles.css"
));
if (unexpected.length) throw new Error(`Unexpected files in plugin bundle: ${unexpected.join(", ")}`);

// The packaged entry point must itself pass the loader check, so the artifact
// is validated, not just the repository copy.
const artifactCheck = spawnSync(
  process.execPath,
  [path.join(root, "scripts", "verify-bundle.mjs"), path.join(output, "main.js")],
  { stdio: "inherit" }
);
if (artifactCheck.status !== 0) throw new Error("Packaged main.js failed the Obsidian-style loader check.");

console.log(`Packaged HoloTaxon ${manifest.version}: ${relativeFiles.length} runtime files in ${path.relative(root, output)}`);
