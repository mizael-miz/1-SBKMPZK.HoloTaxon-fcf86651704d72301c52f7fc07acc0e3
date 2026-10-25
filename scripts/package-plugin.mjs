import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const packageJson = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
const manifestPath = path.join(root, "manifest.json");
const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));

if (manifest.id !== "holotaxon") throw new Error(`Unexpected plugin id: ${manifest.id}`);
if (manifest.version !== packageJson.version) {
  throw new Error(`Version mismatch: package.json=${packageJson.version}, manifest.json=${manifest.version}`);
}

const required = ["main.js", "manifest.json", "styles.css"];
for (const file of required) {
  if (!fs.existsSync(path.join(root, file))) throw new Error(`Missing required plugin file: ${file}; run npm run build first.`);
}

const entrypoint = fs.readFileSync(path.join(root, "main.js"), "utf8");
if (!entrypoint.includes('require("obsidian")') && !entrypoint.includes("require('obsidian')")) {
  throw new Error("main.js does not retain Obsidian's runtime API as an external dependency.");
}
if (/\brequire\((['"])(?:\.\.?\/|\.\.?\\)/.test(entrypoint)) {
  throw new Error("main.js contains a relative runtime require; the packaged plugin must be a single self-contained bundle.");
}

const output = path.join(root, "artifacts", "HoloTaxon");
fs.rmSync(output, { recursive: true, force: true });
fs.mkdirSync(output, { recursive: true });
for (const file of required) fs.copyFileSync(path.join(root, file), path.join(output, file));

const packagedFiles = fs.readdirSync(output).sort();
if (packagedFiles.join(",") !== "main.js,manifest.json,styles.css") {
  throw new Error(`Unexpected packaged files: ${packagedFiles.join(", ")}`);
}
console.log(`Packaged HoloTaxon ${manifest.version}: single-file runtime bundle in ${path.relative(root, output)}`);
