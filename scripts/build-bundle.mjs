import fs from "node:fs";
import { builtinModules } from "node:module";
import path from "node:path";
import esbuild from "esbuild";

const watch = process.argv.includes("--watch");
const production = process.argv.includes("--production");
const nodeBuiltins = [...new Set([
  ...builtinModules,
  ...builtinModules.map(name => name.startsWith("node:") ? name : `node:${name}`)
])];

const context = await esbuild.context({
  entryPoints: ["src/main.ts"],
  bundle: true,
  platform: "browser",
  format: "cjs",
  target: "es2022",
  outfile: "main.js",
  external: [
    "obsidian",
    "electron",
    "@codemirror/*",
    "@lezer/*",
    ...nodeBuiltins
  ],
  treeShaking: true,
  minify: production,
  sourcemap: false,
  logLevel: "info"
});

fs.copyFileSync(path.join("src", "styles.css"), "styles.css");

if (watch) {
  await context.watch();
  console.log("HoloTaxon esbuild watch mode active.");
} else {
  await context.rebuild();
  await context.dispose();
  console.log(`HoloTaxon single-file bundle complete (${production ? "production" : "development"}).`);
}
