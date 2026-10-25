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
const entryPath = path.join(root, "main.js");
if (!fs.existsSync(entryPath)) throw new Error("Missing generated main.js; run npm run build first.");
const entrypoint = fs.readFileSync(entryPath, "utf8");
if (!entrypoint.includes("module.exports = module.exports.default ?? module.exports;")) {
  throw new Error("main.js must end with dual-loader export normalization.");
}
if (fs.existsSync(path.join(root, "dist"))) {
  throw new Error("The shipped repository tree must not contain dist/; main.js must be self-contained.");
}
if (entrypoint.includes('require("./dist/')) {
  throw new Error('main.js must not depend on a separate "./dist/" runtime module.');
}

const output = path.join(root, "artifacts", "HoloTaxon");
fs.rmSync(output, { recursive: true, force: true });
fs.mkdirSync(output, { recursive: true });

const runtimeFiles = ["main.js", "manifest.json", "styles.css"];
for (const file of runtimeFiles) {
  const source = path.join(root, file);
  if (!fs.existsSync(source)) throw new Error(`Missing required plugin file: ${file}; run npm run build first.`);
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
const unexpected = relativeFiles.filter((file) => !runtimeFiles.includes(file));
if (unexpected.length) throw new Error(`Unexpected files in plugin bundle: ${unexpected.join(", ")}`);
if (relativeFiles.length !== runtimeFiles.length) {
  throw new Error(`Expected ${runtimeFiles.length} runtime files, found ${relativeFiles.length}.`);
}
console.log(`Packaged HoloTaxon ${manifest.version}: ${relativeFiles.length} runtime files in ${path.relative(root, output)}`);
