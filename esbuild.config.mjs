import { builtinModules } from "node:module";
import * as esbuild from "esbuild";

const nodeBuiltins = builtinModules.flatMap((name) => {
  const bareName = name.replace(/^node:/, "");
  return [bareName, `node:${bareName}`];
});

const buildOptions = {
  entryPoints: ["src/main.ts", "src/styles.css"],
  outdir: ".",
  outbase: "src",
  bundle: true,
  platform: "browser",
  format: "cjs",
  target: "es2022",
  external: [...new Set([
    "obsidian",
    "electron",
    "@codemirror/*",
    "@lezer/*",
    ...nodeBuiltins,
  ])],
  footer: {
    js: "module.exports = module.exports.default ?? module.exports;",
  },
  sourcemap: false,
  logLevel: "info",
};

if (process.argv.includes("--watch")) {
  const context = await esbuild.context(buildOptions);
  await context.watch();
  console.log("HoloTaxon esbuild watcher started.");
} else {
  await esbuild.build(buildOptions);
}
