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
if (!fs.existsSync(path.join(root, "main.js"))) throw new Error("Missing generated main.js; run npm run build first.");
const entrypoint = fs.readFileSync(path.join(root, "main.js"), "utf8");
if (!entrypoint.includes('require("./dist/main.js").default')) {
  throw new Error('main.js must export the plugin constructor from require("./dist/main.js").default.');
}
if (!fs.existsSync(path.join(root, "dist", "main.js"))) throw new Error("Missing dist/main.js; run npm run build first.");

const output = path.join(root, "artifacts", "HoloTaxon");
fs.rmSync(output, { recursive: true, force: true });
fs.mkdirSync(output, { recursive: true });

for (const file of ["main.js", "manifest.json", "styles.css"]) {
  const source = path.join(root, file);
  if (!fs.existsSync(source)) throw new Error(`Missing required plugin file: ${file}`);
  fs.copyFileSync(source, path.join(output, file));
}
fs.cpSync(path.join(root, "dist"), path.join(output, "dist"), { recursive: true });

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
  file === "styles.css" ||
  (file.startsWith("dist/") && file.endsWith(".js"))
));
if (unexpected.length) throw new Error(`Unexpected files in plugin bundle: ${unexpected.join(", ")}`);
if (!relativeFiles.includes("dist/main.js")) throw new Error("Bundle is missing dist/main.js.");
console.log(`Packaged HoloTaxon ${manifest.version}: ${relativeFiles.length} runtime files in ${path.relative(root, output)}`);
