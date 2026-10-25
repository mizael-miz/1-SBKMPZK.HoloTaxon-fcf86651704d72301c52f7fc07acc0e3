Verdicts

H1: refuted confidence=0.85 — Obsidian’s loader explicitly unwraps .default before instantiating, so a namespace object with default is accepted; export shape cannot be the blocker.
H2: supported confidence=0.90 — main.js is eval’d as a string under a custom require with no module path; require("./dist/main.js") has no resolvable base on desktop or mobile.
H3: contested confidence=0.45 — manual install can omit dist/, but no data-pack evidence records whether dist/ existed on the Android device; if it existed, H3 is false.
H4: unresolved confidence=0.20 — Android runtime differences are real, but no evidence ties the failure to version, restricted mode, or filesystem quirks.

Evidence

· [E] Obsidian loads plugin main.js via eval, not as a file-backed module. Licat: “we only load main.js using eval as a string so it doesn’t actually load from your file path.” Reverse engineering shows the wrapper: window.eval("(function anonymous(require,module,exports){…})"), with a custom require shim passed in. This shim has no module filename or directory context, so relative path resolution has no base. https://forum.obsidian.md/t/the-import-of-third-party-module-is-failing-in-main-js-cannot-find-module/25180; https://zhuanlan.zhihu.com/p/605669315
· [E] The loader accepts exports.default. The observed loader code is (a = s.exports || a).default || s.exports, then new l(…) instanceof Plugin. If s.exports is the namespace object {__esModule, default: HoloTaxonPlugin, …}, the loader selects .default; if s.exports is the class directly, it falls back to the class. Both shapes are accepted. H1’s claim that the namespace object itself fails is therefore refuted. https://zhuanlan.zhihu.com/p/605669315
· [E] Mobile has no Node.js/Electron APIs. Official docs: “The Node.js API, and the Electron API aren't available on mobile devices. Any calls to these libraries … can cause your plugin to crash.” https://docs.obsidian.md/Plugins/Getting+started/Mobile+development
· [E] Mobile has no full require, and the injected shim returns null for Node builtins. CodeScript Toolkit documentation: “Obsidian on desktop has a built-in require() function … Obsidian on mobile does not have it at all.” Other mobile-compat reports: Obsidian’s injected plugin require() returns null for every Node builtin, crashing module-eval at load. https://gothub.r4fo.com/mnaoumov/obsidian-fix-require-modules/tree/main; https://git.macenka.de (mobile support commit)
· [E] The blessed layout is one self-contained main.js. Official sample plugin esbuild config: bundle: true, format: "cjs", outfile: "main.js", externals obsidian, electron, @codemirror/*, @lezer/*, and Node builtins. https://raw.githubusercontent.com/obsidianmd/obsidian-sample-plugin/master/esbuild.config.mjs
· [E] Data pack: stub is 99 bytes and only does module.exports = require("./dist/main.js"); dist/ is copied by packaging and mandated by INSTALL.md; CI is green on all branches but no live acceptance has been recorded.
· [K] TypeScript export default compiles to exports.default. Every standard Obsidian plugin build therefore emits a .default property, and Obsidian must support unwrapping it for backward compatibility.
· [I] Therefore H2 is the primary blocker, H1 is refuted, and H3 is a possible co-factor only if dist/ was absent. The only observed failure was on Android, but H2 predicts failure on desktop too; desktop was never tested.
· Q2 — Applied fix: module.exports = require("./dist/main.js").default is not necessary for H1 (the loader already unwraps .default) and not sufficient for H2/H3 (the relative require still cannot resolve). Regression risk is low but non-zero: if .default is ever missing, module.exports becomes undefined, producing “No exports detected,” whereas the original stub would still expose the namespace object for the loader to unwrap.
· Q3 — Relative require on desktop and Android: No. The loader’s custom require is not Node’s resolver and has no module path; desktop Electron’s eval context does not set a filename for the eval’d source. Android additionally has no Node require at all, and the shim returns null for Node builtins. PR #13’s “simulated Obsidian loader” harness is a model of assumptions, not evidence about the real loader; it can reproduce the hypothesis but cannot establish live Obsidian behavior. [E/I]
· Q5 — Adopt single-file esbuild now? Yes, regardless of audit outcome. The loader architecture makes multi-file relative requires unsupported. Tradeoffs: install robustness improves (3 files, no dist/ tree); mobile safety improves (no relative requires, provided Node builtins are not required at top level); debuggability can be preserved with source maps; CI reproducibility must be redesigned (hash the generated bundle or commit it, rather than relying on git diff against a checked-in multi-file dist/); artifact size grows modestly but remains small.
· Q6(i) — What the Node smoke test cannot catch: It runs under Node’s real module resolver, so it happily resolves ./dist/main.js; it cannot catch the eval-based loader’s lack of path context, the Android WebView’s missing Node builtins, install-layout mistakes (dist/ omitted), manifest/minAppVersion issues, CSS loading, or the real Obsidian lifecycle.
· Q6(ii) — Packaging-guard brittleness: String-matching require("./dist/main.js").default is brittle: quoting, whitespace, path normalization, minification, bundler transformation, dynamic requires, or comments can bypass or falsely trigger it. A stronger guard is a JS-parser AST check rejecting every require() call whose argument is relative (./ or ../) or a Node builtin, plus a dynamic eval-sandbox load test.
· Q6(iii) — Three parallel bundling PRs with zero live evidence: This is a process risk: duplicated effort, divergent external lists, merge conflicts after #12 lands, and false confidence from CI-green. Freeze them, designate one owner, and require live acceptance before any merge.
· Q6(iv) — Architecturally preferable PR: PR #15 narrowly, because it removes the ./dist/main.js dependency while retaining the smoke test, packaging guard, and reproducibility check; PR #14 is the mature fallback but its “stop committing the generated bundle” needs a CI reproducibility redesign. PR #13’s removal of dist/ and its dynamic harness are directionally good, but the harness is not evidence and the PR is standalone. Whichever is chosen must add a Node-builtin guard for mobile and upgrade the string-match guard to a dynamic eval test.
· Q7 — Android runtime differences: Android runs the plugin in a WebView without Node.js/Electron APIs; there is no full require, and Node builtins are unavailable. The vault path is typically /storage/emulated/0/<vault>/.obsidian/plugins/holotaxon/; .obsidian is hidden, and manual file transfer may omit subdirectories such as dist/. The data pack ties the failure to H2 or H3, not H1; H2 vs H3 cannot be resolved without knowing whether dist/ was present on the Android device. https://docs.obsidian.md/Plugins/Getting+started/Mobile+development

Discriminating test

Cheapest test — run before any reinstall, on the existing Android failure:

1. Check dist/ presence without reinstalling.
   · On the Android device, use a file manager to navigate to <vault>/.obsidian/plugins/holotaxon/ and check whether dist/main.js exists.
   · Or, if you can open Obsidian’s console, run:
     ```js
     await app.vault.adapter.exists(".obsidian/plugins/holotaxon/dist/main.js")
     ```
   · If false → H3 is live (or co-live with H2); the installer omitted dist/.
   · If true → H3 is false for this install; proceed to step 2 to distinguish H1 vs H2.
2. Capture the actual loader error.
   · Enable USB debugging on Android, connect to desktop, open Chrome → chrome://inspect, inspect the Obsidian WebView.
   · In DevTools, trigger a reload:
     ```js
     await app.plugins.disablePlugin("holotaxon");
     await app.plugins.enablePlugin("holotaxon");
     ```
   · Capture the first red error and its stack.

Expected error strings:

Hypothesis Expected error Additional signal
H1 (export shape) Error: Failed to load plugin holotaxon with no Cannot find module; or TypeError: … is not a constructor; or Error: Failed to load plugin holotaxon. No exports detected. Should not occur given loader .default unwrapping.
H2 (sandbox require) Error: Cannot find module './dist/main.js'; on desktop often with Require stack: - electron/js2c/renderer_init; on Android possibly TypeError: Cannot read properties of null (reading 'default') or ReferenceError: require is not defined dist/main.js exists at the checked path.
H3 (install layout) Same Cannot find module './dist/main.js' dist/main.js does not exist at the checked path.
H4 (other) Error unrelated to module resolution, e.g. This plugin requires a newer version of Obsidian, Plugins are restricted, manifest parse error, or permission error Manifest/version/restricted-mode check.

If Android inspection is impossible, copy the exact artifact (including dist/) to a desktop test vault and repeat step 2. A desktop Cannot find module './dist/main.js' with dist/ present confirms H2 and rules out Android-only H4.

Recommended sequence

1. Before anything merges: run the discriminating test above on the existing Android install; record the exact error and dist/ presence.
2. Freeze PR #13/#14/#15 and designate one owner; close duplicates only after the live result is recorded.
3. Adopt a single-file esbuild bundle as the target layout; remove dist/ from the install contract and update INSTALL.md to the standard 3-file layout (main.js, manifest.json, styles.css).
4. Choose PR #15 (fallback: PR #14) and require these criteria before merge: no relative runtime require(), no top-level Node builtin require(), a dynamic eval-sandbox test rather than only string matching, and a reproducible build check that does not depend on a committed multi-file dist/.
5. Add exactly one automated test: an eval-loader test that loads the built main.js inside new Function("require","module","exports", source) with a restricted require that allows only obsidian and rejects relative paths; assert it loads and exports a Plugin subclass. This directly catches the H2 class of failure.
6. Live acceptance on desktop AND Android from the packaged artifact: install, enable, open the HoloTaxon view, reload the plugin, and verify no console error.
7. Merge only after live acceptance; do not merge the export-only fix (#12) as the sole fix, because it does not address the loader’s require limitation.

Uncertainties

· The exact Obsidian version on the Android device.
· Whether dist/ was actually present in the Android plugin folder.
· Whether the current artifact has ever been loaded on desktop.
· The actual developer-console error was never captured; all error strings above are inferred from loader behavior and forum reports.
· The loader implementation may differ across Obsidian versions; the reverse-engineered loader is from 2023, though backward compatibility with exports.default makes the .default behavior stable.
· It is unknown whether the plugin uses any Node builtins at runtime; the data pack suggests it does not, but this should be confirmed by static analysis.
· Android filesystem restrictions may prevent easy inspection of the hidden .obsidian folder, which could block the cheapest test.
· Whether restricted mode, minAppVersion, or manifest-folder-name mismatch contributed; manifest data looks valid, but live settings were not recorded.