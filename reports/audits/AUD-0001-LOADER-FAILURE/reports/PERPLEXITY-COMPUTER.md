M
Completed 14 steps
Independent Audit — HoloTaxon v0.1.0 Load Failure
Verdicts
H1: contested, confidence 0.70 (that H1 is NOT the load-blocker) — The pre-fix stub's export shape ({__esModule, default, named export}) is byte-for-byte the shape real esbuild-CJS Obsidian plugins ship and load with, so the "constructor must be directly on module.exports" premise is likely wrong [I]. But no live load of any shape was ever tested, and the loader's exact unwrap logic is unverified [I], so it cannot be fully refuted. Strongest argument for H1: the data pack's Stack Overflow quote that Obsidian "expects either module.exports or exports.default to be your Plugin class directly" [E], plus zero successful loads ever recorded [E]. Strongest against: the failure was a load failure at module-evaluation time, and under H2 the relative require throws before Obsidian ever inspects the export shape — H2 masks H1 entirely [I].
H2: supported, confidence 0.90 — Obsidian's lead developer states verbatim that "we only load main.js using eval as a string so it doesn't actually load from your file path", which means require("./dist/main.js") resolves against Electron's renderer init, not the plugin folder — confirmed by real desktop traces showing Require stack: - electron/js2c/renderer_init for plugin-code requires [E]. On Android there is no Node/Electron runtime at all. This hypothesis alone fully explains the observed Android failure even with a perfect install [I]. The 0.10 held back: the Android error string was never captured, so attribution is inference, not observation [E].�
H3: unresolved, confidence 0.50 — No evidence exists about the actual installed file layout on the Android device [E]. It cannot be excluded, but it is not needed to explain the failure: under H2 the plugin fails even with a flawless install [I]. It also does not explain the design-level defect that H2 exposes.
H4: contested, confidence 0.75 (that H4 is NOT the cause) — The manifest is valid with all required fields [E], and restricted mode would disable all community plugins, not just fail this one's load [K]. The installed Android app version vs minAppVersion 1.5.0 is unknown [E], so H4 cannot be fully refuted; but nothing in the data pack points to it, and H2 already accounts for the symptom [I].
Evidence
[E] The root entrypoint is a 99-byte stub whose only action is a relative require: module.exports = require("./dist/main.js"); — the entire dist graph is only reachable through that one relative path (data pack items 1, 3).
[K] Obsidian evaluates plugin main.js as a string via eval; it "doesn't actually load from your file path," so plugins must be bundled into one file — Obsidian's lead developer, verbatim: Obsidian Forum thread 25180.�
[K] Desktop plugin-code requires that fail show Plugin failure: <id> Error: Cannot find module 'X' with Require stack: - electron/js2c/renderer_init, proving the injected require resolves against Electron's renderer init, not the plugin directory — same forum thread, error trace included: forum.obsidian.md.�
[K] The official API contract: main.js "Must export a default class which extends Plugin" and "Must bundle all external dependencies into this file, using Rollup, Webpack, or another javascript bundler" — obsidian-api README.�
[K] The blessed sample layout is a single self-contained main.js via esbuild (bundle: true, format: 'cjs', externals: obsidian, electron, @codemirror/*, @lezer/*, node builtins) — obsidian-sample-plugin esbuild.config.mjs; docs describe the same one-main.js outcome.�
[K] Mobile is a WebView runtime without Node.js/Electron; calls to those APIs crash plugins — Obsidian Mobile development docs. Node built-ins are explicitly disallowed for mobile-compatible plugins.�
[I] The pre-fix export shape is not demonstrably invalid: a real published plugin's esbuild-CJS main.js ends in module.exports = se(ue) producing {__esModule: true, default: …} — the same namespace shape as HoloTaxon's stub — and loads on desktop. This is ecosystem inference, not a statement of Obsidian's exact loader code.�
[E] The observed failure was Android-only, no console error captured, desktop never tested, G0/S0 formally BLOCKED (data pack context).
[E] All fixes and bundling PRs are CI-green with zero live acceptance claims; the project itself flagged issue #2 noting CI evidence is not live evidence (data pack item 7).
[I] The existence of community plugins whose entire purpose is making require/relative paths work inside Obsidian (e.g., Fix Require Modules) corroborates that the stock runtime does not provide path-based module resolution to eval'd plugin code.�
[K] Mobile developer consoles are hard to reach; Obsidian recommends the Logstravaganza plugin to capture logs on mobile.�
Q2 — Is the applied fix necessary / sufficient?
Necessary: no. [I] The namespace export shape was most likely already acceptable (see Evidence above), and the fix addresses a premise that is probably false.
Sufficient: no. [I] The stub still executes require("./dist/main.js") — the exact statement H2 kills on both platforms. .default is never reached because the require throws first. The fix changes which property is read off a module that never loads.
Regression risks: [I] brittle property access (a TypeError if dist/main.js ever lacks default); divergence risk between stub and compiled output; false confidence from the CI-green smoke test; and the packaging guard that string-matches the literal require("./dist/main.js").default will false-fail on innocuous formatting changes and can be bypassed by aliased/dynamic requires (see Q6).
Q3 — Does Obsidian's loader resolve relative require() from plugin main.js?
Desktop: No. [K] Primary source: Licat's eval-as-string statement plus the renderer_init require stack. The injected require resolves relative to Electron's renderer init module, so ./dist/main.js cannot resolve. Android: No. [K] Mobile runs a WebView with no Node.js/Electron; there is no filesystem-backed synchronous require at all — community tooling states mobile "doesn't have require() at all, as it doesn't have any Node.js engine running". Exact Android error wording for a failed require is unverified [I] — it may be a "Cannot find module" from Obsidian's shim or a ReferenceError if no require is injected at all.�
PR #13's simulated harness is NOT evidence about the real loader. [I] It is a reimplementation of the loader written by the same agents whose hypothesis it "confirms" — circular. Its "reproduced in the simulated harness" claim tests the harness's model, not Obsidian's code. The documented facts (Licat's quote) already establish H2; the harness adds no independent weight.
Q5 — Adopt a single-file esbuild bundle now?
Yes, regardless of audit outcome. [I] It aligns with the official contract ("must bundle all external dependencies into this file" — obsidian-api README) and the official sample layout. Tradeoffs:�
Install robustness: strong gain — one file, no dist/ to mis-copy, H3 becomes structurally impossible [I].
Mobile: effectively mandatory — no relative requires and no Node builtins survive bundling with the right externals [I].
Debuggability: minor loss — esbuild supports inline/external sourcemaps (sourcemap: prod ? false : 'inline' in the sample config); stack traces in a 12.8 KB bundle are only mildly worse than 9 small files [I].
CI reproducibility check: the existing git diff --exit-code gate only works while the bundle is committed; esbuild output is deterministic, so a committed bundle keeps the gate meaningful — this is an argument against PR #14's "stop committing the bundle" [I].
Artifact size: negligible — the graph is ~13 KB total; a bundle is comparable [E/I].
Q6 — Blind-spot audit
(i) What the Node smoke test cannot catch: [I] everything that differs between Node's CJS loader and Obsidian's eval-based loader — the eval context, the injected require's resolution base, the loader's export-unwrap logic, the real Plugin base class behavior, the installed file layout, restricted mode, mobile runtime differences, and manifest/version gating. It is circular: it proves Node semantics to Node.
(ii) Brittleness of packaging guards: [I] string-matching require("./dist/main.js").default fails on quote-style/formatting changes and is bypassed by const p = "./dist/main.js"; require(p) or aliased requires; a guard rejecting all relative runtime requires can false-positive on harmless literals. Guards should assert behavior (evaluate the built main.js the way Obsidian does), not source text.
(iii) Three parallel bundling PRs, zero live evidence: [I] merge-conflict and churn risk; "CI-green" theater creating false confidence while G0 stays blocked; and PR #13's overclaim ("reproduced" in a simulated harness) is exactly the kind of pseudo-evidence that erodes audit trails. Consolidate to one PR; close the others.
(iv) Architectural preference: PR #15. [I] It is stacked on #12 (keeps the export fix and smoke test), removes the ./dist/main.js dependency, and retains the smoke test, packaging guard, and reproducibility check — closest to the official sample layout while preserving existing gates. Amend it to adopt #14's complete externals list (electron, @codemirror/*, @lezer/*, node builtins), which matches the official sample verbatim. PR #14's "stop committing the generated bundle" is a blind spot: it silently disables the tracked-file reproducibility diff and diverges from the sample-plugin convention of committing main.js (which release/submission flows rely on). PR #13 is weakest: standalone (orphaning the export fix lineage), removes tsconfig.build, and carries an evidence-free "reproduced" claim. Caveat: this ranking is based on data-pack descriptions only; the actual diffs were not inspected [E].
Q7 — Android runtime differences and attribution
[K] Desktop is Electron with Node integration (sync require, full fs); Android is a WebView/Capacitor app with no Node.js or Electron APIs, and calls to them crash plugins.�
[K/I] Mobile file access is async-only; there is no synchronous filesystem-backed module resolution, so the stub's top-level require("./dist/main.js") fails at module evaluation — before any plugin code runs (mirrored by a real Android plugin-load failure where unguarded require('util') aborted module evaluation: Obsidian_FolderBridge issue #18).�
[K] Mobile console access is limited; Obsidian recommends capturing logs via the Logstravaganza plugin. Android WebView apps can also be inspected via chrome://inspect with USB debugging enabled [I].�
[E] No data-pack evidence ties the Android failure to any specific hypothesis — no error string, no install inspection, no app version. H2 is the only hypothesis that predicts failure even with a perfect install and a correct manifest, which is why it carries the attribution, but this remains inference [I].
Discriminating test
One test, run on the existing Android install, before any reinstall. Console capture via chrome://inspect (USB debugging) or the Logstravaganza plugin. Takes ~15 minutes and touches nothing outside the plugin's own folder.
Step 0 — Preserve evidence. Back up the whole <vault>/.obsidian/plugins/holotaxon/ directory with a file manager. Record the app version (Settings → About).
Step 1 — H3 check (file inspection). In the file manager, verify the installed directory contains: main.js (99 bytes), manifest.json, styles.css, and dist/ with the 9-file module graph.
H3 confirmed if dist/ is missing, empty, or misplaced (e.g., nested holotaxon/holotaxon/, or dist files copied next to main.js instead of inside dist/) — a file-system observation, no error string needed.
Step 2 — H1/H2 probe (in-place edit of main.js only; not a reinstall). Replace main.js with:
const { Plugin } = require("obsidian");
let inner = null, loadErr = null;
try { inner = require("./dist/main.js"); } catch (e) { loadErr = e; }
module.exports = class Probe extends Plugin {
  onload() {
    console.log("PROBE relative-require:", loadErr ? "FAILED: " + loadErr.message : "OK");
    if (inner) console.log("PROBE dist keys:", Object.keys(inner).join(","), "default type:", typeof inner.default);
  }
};
Toggle the plugin on and read the console.
Interpretation and expected strings (note: the probe emits its own labels; Obsidian's native strings are wrapped as Plugin failure: holotaxon <err> per the forum traces [K], and the exact native wording for each case below is unverified [I]):
H2 confirmed if Step 1 shows all files present AND the probe logs PROBE relative-require: FAILED: Cannot find module './dist/main.js' (desktop equivalent shows Require stack: - electron/js2c/renderer_init [K]). Caveat: this string alone cannot distinguish a missing file from an unsupported resolver — that is why the Step 1 file check must come first.
H1 confirmed if the probe logs PROBE relative-require: OK AND the probe class loads (proving module.exports = class works), and then restoring the original 99-byte stub produces a Plugin failure: holotaxon TypeError ... is not a constructor-style error — the exact native string is unverified; the probe's PROBE dist keys line is the reliable discriminator (it shows whether default is a function).
H3 confirmed only by Step 1's file-system observation.
Bonus discriminator: if the Android console instead shows ReferenceError: require is not defined, that means mobile injects no require at all — still H2, different failure mode [I].
Recommended sequence
Ordered and bounded; steps 1–2 must happen BEFORE anything merges.
[Before any merge] Run the Q4 test on the existing Android install. Additionally, load the current CI artifact on desktop in a real vault (cheapest corroboration — expect Plugin failure: holotaxon Error: Cannot find module './dist/main.js' with the renderer_init stack). Capture both error strings verbatim; attach to issue #2.
[Before any merge] Record verdicts: expected outcome is H2 confirmed on both platforms. Update issue #2 and the G0/S0 gate rationale with the captured evidence (still BLOCKED until a live load succeeds).
[Before any merge] Pick ONE bundling path: PR #15 (amended with #14's full externals list). Close PR #13 and #14, porting anything unique from them into #15. Merge #12 first if #15 stacks on it.
Post-merge, run the existing CI (build → package → upload) and verify the packaged artifact contains exactly main.js, manifest.json, styles.css.
Live-load the new artifact on desktop AND on the Android device (fresh install this time). Capture the console output.
Only on a successful live load with a captured clean console: flip G0/S0 from BLOCKED. Not before.
One additional automated test (the only one proposed): replace/extend the Node smoke test with an "Obsidian-shaped loader" test — evaluate the packaged main.js via new Function("module", "exports", "require", code) where require serves only the stubbed obsidian module and throws on everything else; assert module.exports (or .default) is a constructor extending the stubbed Plugin base. Unlike PR #13's harness, this encodes the documented loader constraint (eval'd string, no path-based resolution) rather than an invented model — its assumption should still be labeled as such in the test file.
Uncertainties
The exact native Android error string for the failed require was never captured; my expected strings are probe-emitted labels plus desktop analogues, not verified mobile wording [I].
Obsidian's loader code (app.js) is minified; the precise module.exports vs .default unwrap logic is unverified — H1's refutation rests on ecosystem inference (working esbuild-CJS plugins), not on the loader source [I].
The installed Android app version vs minAppVersion 1.5.0 is unknown — H4 cannot be fully excluded [E].
The actual installed file layout on the Android device is unknown — H3 is untestable without Step 1 of the probe [E].
Whether Obsidian mobile injects any require shim into plugin code (vs none at all) is unknown; the two cases produce different error strings [I].
The PR #13/#14/#15 diffs were not inspected — the architectural ranking in Q6(iv) is based on data-pack descriptions only [E].
Whether restricted mode or community-plugins.json state contributed to the Android observation is unknown [E].
Desktop behavior was never tested on this project; the desktop prediction is inference from documented loader behavior, not an observation of this artifact [I].