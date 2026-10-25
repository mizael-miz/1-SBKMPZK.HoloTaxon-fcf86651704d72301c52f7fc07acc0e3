Verdicts

H1: refuted confidence=0.05 — Obsidian’s loader already unwraps exports.default || exports, so the namespace object was not inherently fatal; the failure occurs earlier when the relative require cannot resolve.
H2: supported confidence=0.88 — Obsidian evals main.js inside its own wrapper with a private require, not Electron/Node’s file-relative resolver; a relative ./dist/main.js therefore cannot resolve on desktop, and Android’s WebView has no Node runtime at all.
H3: contested confidence=0.35 — manual three-file install and a missing/misplaced dist/ remain possible, but there is no captured filesystem listing or error from the Android device proving it.
H4: unresolved confidence=0.12 — manifest is valid, but Android Obsidian version, restricted mode, and Android path/filesystem behaviour were never captured.

Evidence

· [E] Pre-fix root main.js is a 99-byte stub: module.exports = require("./dist/main.js");, while dist/main.js ends with exports.default = HoloTaxonPlugin (data-pack facts 1–2).
· [E] Packaging copies dist/ and INSTALL.md explicitly warns not to omit it, so the intended install layout includes dist/ (data-pack fact 4).
· [E] Official Obsidian API README says main.js “Must export a default class which extends Plugin” and “Must bundle all external dependencies into this file” — https://github.com/obsidianmd/obsidian-api.
· [E] Official “Build a plugin” workflow produces a single compiled main.js in the plugin directory — https://docs.obsidian.md/Plugins/Getting+started/Build+a+plugin.
· [E] Obsidian forum: “we only load main.js using eval as a string so it doesn’t actually load from your file path”; relative require fails with Cannot find module and the fix is to bundle — https://forum.obsidian.md/t/the-import-of-third-party-module-is-failing-in-main-js-cannot-find-module/25180.
· [E] Reverse-engineered Obsidian loader: it wraps plugin code in window.eval("(function anonymous(require,module,exports){...") and selects (exports.default || exports); the injected require is “completely not the require provided by Electron” and is deliberately restricted — https://zhuanlan.zhihu.com/p/605669315.
· [E] Obsidian mobile (iOS/Android) runs plugins in a WebView without a Node.js runtime; top-level Node-builtin require throws during bundle evaluation and the whole plugin fails to load — https://github.com/kitelev/exocortex/blob/main/.archgate/adrs/MOBILE-001-no-toplevel-node-imports.md.
· [E] A “Fix Require Modules” plugin exists specifically to add relative-path require() support for desktop and mobile, confirming native relative require is limited — https://www.obsidianstats.com/plugins/fix-require-modules.
· [E] Official sample esbuild config uses bundle: true, format: "cjs", and externals obsidian, electron, @codemirror/*, @lezer/*, and Node builtins — https://raw.githubusercontent.com/anghunk/obsidian-ai-tags/refs/heads/main/esbuild.config.mjs.
· [I] Because the loader evals the source, there is no module-local __dirname, __filename, or file path for require("./dist/main.js") to resolve against; the private require is not a file-relative CommonJS resolver.
· [I] On Android, even if the private require returns an object rather than throwing, it may return null/{} for unsupported modules, producing a different downstream error such as Cannot read properties of null (reading 'default') or “No exports detected.”
· [S] The exact Android failure could be H2 or H3; the data pack contains no error string, no adb log, and no device filesystem listing.

Q2 — Applied fix: module.exports = require("./dist/main.js").default

· Necessary? No. [I] Obsidian’s loader already selects (exports.default || exports), so the original namespace object would have yielded the class if the require had resolved. The export shape was not the blocking defect.
· Sufficient? No. [E]/[I] The relative require("./dist/main.js") is evaluated before any export is inspected; under Obsidian’s eval-wrapper/private-require it cannot resolve, so .default is never reached reliably.
· Regression risks: [I] It makes the CI smoke test pass under Node for the wrong reason (Node resolves relative paths); it removes named exports from the root stub; it is brittle if dist/main.js ever changes its export interop shape; and it creates false confidence that the live loader problem is solved.

Q3 — Relative require() on desktop and Android; PR #13 harness

· Desktop: [E] No, the loader uses window.eval with a private require, and the forum explicitly says the code “doesn’t actually load from your file path.” Relative resolution is therefore not available in the real loader.
· Android: [E] No, and worse: mobile runs in a WebView without a Node runtime, so synchronous Node-style require and Node resolution semantics are unavailable.
· PR #13 simulated harness: [I] It is not evidence about the real loader. A simulation can encode its own assumption that relative require fails; unless it reproduces Obsidian’s exact eval wrapper and private-require implementation, it is a hypothesis test, not primary evidence. Only a live Obsidian load or a faithful extraction of the loader’s actual wrapper counts.

Q5 — Adopt a single-file esbuild bundle now?

[I] Yes, adopt it now regardless of the audit outcome, because it removes the relative-require failure mode and matches the officially blessed layout.

Tradeoffs:

· Install robustness: Strong win. One main.js eliminates the dist/ copy requirement, nested-folder mistakes, and missing-directory failures.
· Mobile: Strong win, provided all runtime dependencies are bundled and only obsidian (and truly external Electron/CodeMirror/Lezer modules) remain external. Avoid top-level Node-builtin imports.
· Debuggability/source maps: Production bundle is less readable; use development inline source maps, but do not ship source maps in the release unless intended. Stack traces need source-map tooling.
· CI reproducibility: esbuild is deterministic with a pinned version, but source-map paths and banners can introduce nondeterminism; pin the esbuild version and normalize paths. If the bundle is generated in CI, keep the reproducibility check against a committed artifact or a deterministic hash.
· Artifact size: Larger than a 99-byte stub, but likely well within plugin norms; the current compiled graph is only ~12.8 KB before bundling.
· Risk: Bundling can hide dynamic require calls; add a packaging guard that scans for non-whitelisted runtime require/import.

Q6 — Fix blind spots

(i) What the Node smoke test cannot catch

· [I] Obsidian’s eval wrapper and private require; Node resolves ./dist/main.js successfully, so the test cannot reproduce the live failure.
· [I] Android WebView’s missing Node runtime.
· [I] The real loader’s export interop (exports.default || module.exports) is not exercised if the test asserts a direct function export.
· [E]/[I] If the smoke test requires dist/main.js rather than the shipped root stub, it does not test the actual entrypoint at all.
· [I] Install layout, manifest.json, minAppVersion, restricted mode, CSS loading, and plugin onload lifecycle errors.

(ii) Brittleness of packaging guards

· [I] Exact string-matching 'require("./dist/main.js").default' is bypassable by whitespace, comments, a banner, or a different quote style.
· [I] Rejecting all relative require() calls can false-positive legitimate asset references or dynamic imports.
· [I] A semantic guard is better: eval the bundle under a private-require shim that only permits whitelisted externals and fails on any relative specifier; or scan the AST for require/import literals outside the whitelist.

(iii) Three parallel bundling PRs with zero live evidence

· [I] High process risk: duplicated work, inconsistent external lists, merge conflicts, review fatigue, and CI-green false confidence.
· [I] None of the three PRs should merge before a live Android or desktop load, because all three are architecture changes whose acceptance criterion is live loadability.
· [I] The project should freeze merges, designate one canonical bundling PR, and close or park the other two.

(iv) Which bundling PR is architecturally preferable?
[I] PR #14 is preferable. It bundles with esbuild, externalizes obsidian, electron, @codemirror/*, @lezer/*, and Node builtins, adds a packaging guard against relative runtime require(), and updates the smoke test to assert the default-exported plugin class. PR #15 is a close second, but its draft/stacked status and less explicit external list make it less complete. PR #13’s simulated harness is the least preferable because it substitutes a simulation for live-loader evidence.

Q7 — Android runtime differences and whether evidence ties to one hypothesis

· [K] Desktop Obsidian runs on Electron with Chromium plus Node integration; Android Obsidian runs in a WebView/Capacitor-style container without a Node runtime.
· [E] Mobile WebView lacks Node builtins and synchronous require; top-level builtin imports crash the entire plugin at module evaluation.
· [K] Android filesystem access is mediated by the app/SAF and vault adapter, not Node fs; paths may be content:// URIs or app-private paths, and there is no meaningful __dirname.
· [E]/[I] The data pack shows only an Android failure, with isDesktopOnly: false, and a stub that uses a relative require. That is consistent with H2, but it does not exclude H3 because the actual device install layout and error string were never captured. Android evidence therefore raises H2’s probability but does not uniquely tie the failure to H2.

Discriminating test

Cheapest test before any reinstall: capture the real Android loader error with adb logcat and inspect the device filesystem.

1. On the Android device, enable Developer options → USB debugging.
2. Connect USB; confirm with adb devices.
3. Clear the log: adb logcat -c.
4. Start capture in one terminal:
   adb logcat -v time | grep -iE "obsidian|chromium|holotaxon|plugin|require|module"
   or save full output: adb logcat -v time > holotaxon.log.
5. In Obsidian, disable and re-enable HoloTaxon, or force-stop and reopen Obsidian.
6. In a second terminal, list the actual plugin directory and dist/:
   adb shell ls -la /sdcard/<vault>/.obsidian/plugins/holotaxon/
   adb shell ls -la /sdcard/<vault>/.obsidian/plugins/holotaxon/dist/
   Replace <vault> with the real vault folder name; if the path is unknown, use adb shell find /sdcard -type d -name holotaxon 2>/dev/null.
7. Record the exact error text and whether dist/main.js exists.

Expected error strings per hypothesis

· H2: Failed to load plugin holotaxon plus one of:
  · Cannot find module './dist/main.js' — private require throws because it cannot resolve relative paths; no electron/js2c/renderer_init stack, because this is Obsidian’s private require, not Electron’s.
  · Cannot read properties of null (reading 'default') or Cannot read properties of undefined (reading 'default') — private require returned null/undefined.
  · Failed to load plugin holotaxon. No exports detected. — private require returned {} and .default was undefined.
    Crucially, adb shell ls .../dist/main.js succeeds, proving the file exists and the failure is resolution, not installation.
· H1: If the loader failed on export shape rather than resolution, the expected strings would be TypeError: t is not a constructor, Class extends value undefined is not a constructor or null, or Failed to load plugin holotaxon. No exports detected. But the observed loader code already unwraps .default, so H1 is unlikely to produce this on its own.
· H3: Same Cannot find module './dist/main.js' error, but adb shell ls .../dist/main.js returns No such file or directory, or the dist/ directory is absent/misplaced. This confirms the install-layout hypothesis rather than the loader-resolution hypothesis.
· H4: A version/restricted-mode message such as This plugin requires a newer version of Obsidian, or the plugin is not listed/enabled at all. The exact Android string is unknown and must be captured.

Recommended sequence

1. Freeze all merges of #12, #13, #14, and #15 until live acceptance evidence exists. [I]
2. Run the adb logcat + adb shell ls test above before touching the installed plugin. Capture the exact error and whether dist/main.js is present. [E]/[I]
3. If adb is unavailable, run the same test in a disposable desktop test vault with DevTools open (Ctrl+Shift+I) and capture the console error; this distinguishes H2 on desktop but does not replace Android evidence. [I]
4. Close or park #12 and #13; designate PR #14 as the canonical bundling PR, with PR #15 as fallback if its reproducibility check is stronger. [I]
5. Replace the Node smoke test with one faithful loader test: wrap the built main.js in the exact window.eval-style function anonymous(require,module,exports){...} wrapper, inject a private require that only permits obsidian (and explicitly whitelisted externals) and throws on relative specifiers, then assert the result exports a Plugin subclass. This is the single additional automated test. [I]
6. Add the packaging guard as a semantic check, not an exact string match: reject runtime relative require() and non-whitelisted externals in the bundle. [I]
7. Live acceptance: install the canonical bundle on the real Android device and on desktop, enable it, and confirm no loader error and a functioning plugin. Only then merge and close the other PRs. [E]/[I]

Uncertainties

· The exact Android developer-console error was never captured.
· Desktop load was never tested.
· The actual Android install layout and whether dist/ was present on the device are unknown.
· Android Obsidian version and Android OS version are unknown; minAppVersion 1.5.0 may or may not be satisfied.
· It is unknown whether the plugin was in restricted mode or was enabled at all.
· The private require implementation may differ across Obsidian versions; its exact relative-specifier behaviour is inferred from the reverse-engineered loader and forum reports, not from a controlled test on this device.
· It is unknown whether the private require throws, returns null, or returns {} for ./dist/main.js on the specific Android build.
· No live evidence yet proves that a single-file esbuild bundle will load on this specific Android device; that remains an acceptance criterion, not a proven fact.