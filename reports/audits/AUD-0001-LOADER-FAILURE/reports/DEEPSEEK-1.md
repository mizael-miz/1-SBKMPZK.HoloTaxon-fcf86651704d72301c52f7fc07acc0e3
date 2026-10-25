Verdicts

H1: refuted confidence=0.85 - The pre-fix stub did export a namespace object, but Obsidian's loader resolves (module.exports || exports).default || module.exports, so the class on .default was already reachable; the observed stub's .default is HoloTaxonPlugin, so export shape cannot be the root cause.
H2: supported confidence=0.90 - Obsidian eval-wraps main.js as a string with an injected, whitelist-based require and no file-path base, so require("./dist/main.js") cannot resolve on desktop or Android; official docs also require all dependencies bundled into one main.js.
H3: contested confidence=0.40 - Manual three-file copying and the dist/ subtree are a real install risk, but package-plugin.mjs ships dist/, INSTALL.md explicitly warns about it, and no live install inventory exists; cannot confirm or eliminate without inspecting the failing installation.
H4: unresolved confidence=0.30 - Manifest is valid and minAppVersion is likely satisfied, but the Android app version, restricted-mode state, and exact Android runtime behavior were never captured; no data-pack fact ties the Android failure specifically to H4.

Evidence

· [E] Pre-fix root entrypoint is a 99-byte stub: module.exports = require("./dist/main.js");, while dist/main.js ends with exports.default = HoloTaxonPlugin;.
· [E] The shipped graph includes relative modules (./graph-api, ./graph-store, ./default-registry, ./model, ./schema-engine) and only external obsidian; all relative targets are present in the packaged dist/.
· [E] CI is green on all branches, but the project itself records that this is CI evidence only, not live evidence; no successful live load has ever been recorded.
· [K] Official Obsidian API documentation states: main.js “Must export a default class which extends Plugin” and “Must bundle all external dependencies into this file, using Rollup, Webpack, or another javascript bundler” (obsidian-api README).
· [K] The official sample plugin’s esbuild config uses bundle: true, format: "cjs", outfile: "main.js", with obsidian, electron, CodeMirror, Lezer, and Node builtins externalized (sample esbuild config).
· [K] An Obsidian developer (Licat) is quoted: “we only load main.js using eval as a string so it doesn’t actually load from your file path. If using js either write it all in one file or use a bundle like webpack or esbuild” (forum thread).
· [K] Reverse-engineered loadPlugin code shows window.eval("(function anonymous(require,module,exports){…})") with an injected, whitelist-based require, then l = (module.exports || exports).default || module.exports, then new l(app, manifest); this directly explains both H1’s refutation and H2’s mechanism (reverse-engineering write-up).
· [K] Obsidian mobile runs plugins in a Capacitor WebView with no Node.js runtime; desktop uses Electron with Node + Chromium (remotely-save browser-env doc; actions-uri issue quoting Licat).
· [K] Obsidian’s own mobile checklist warns not to use Node modules such as fs, path, or electron at the top level when isDesktopOnly is false (Obsidian October plugin checklist).
· [K] Community reports show top-level Node builtin require() in a bundle throws during module evaluation on mobile and the whole plugin fails to load, even if the call is behind a runtime Platform.isMobile guard inside a method (mobile-import ADR).
· [I] PR #13’s “simulated Obsidian loader” is not evidence about the real loader unless its shim reproduces the eval wrapper, injected whitelist require, and .default || module.exports resolution exactly, and is validated with both known-good and known-bad fixtures; a simulation that encodes the hypothesis is a tautology.
· [I] The Node smoke test in PR #12 exercises Node’s CommonJS loader and a stubbed obsidian module, not Obsidian’s eval-based loader; passing it does not show that Obsidian can resolve the entrypoint or instantiate the class.

Discriminating test

The cheapest discriminating test is to use the already-installed artifact on desktop with DevTools open, plus a filesystem inventory, before rebuilding or reinstalling anything. Desktop was never tested; if the same failure reproduces there, the “Android-only” framing is false and the loader behavior is the dominant variable.

Exact steps:

1. On the desktop machine with the vault, inventory the installed plugin directory before launching Obsidian. Confirm whether main.js, manifest.json, styles.css, and dist/main.js exist and whether dist/ is at the plugin root or nested one level deeper.
2. Open Obsidian desktop, enable HoloTaxon plugin, and keep DevTools (Ctrl+Shift+I) open while enabling it.
3. Record the first console error string, not a later secondary error.
4. If the plugin fails, temporarily replace the installed root main.js with an instrumented probe that logs typeof require and wraps the relative require in try/catch, then toggle the plugin off/on. This is an in-place edit, not a reinstall. The probe should log the caught error and rethrow it.
5. Restore the original file afterwards.

Expected error strings:

· H1 (export shape): Failed to load plugin holotaxon. No exports detected. or TypeError: l is not a constructor or Plugin failure: holotaxon with no Cannot find module text. If the loader reaches new l(...) and l is the namespace object rather than the class, this is the signature.
· H2 (sandbox require): Plugin failure: holotaxon Error: Cannot find module './dist/main.js' possibly followed by a Require stack: - electron/js2c/renderer_init … trace, even though dist/main.js is physically present. On Android the equivalent may be a generic Plugin failure: holotaxon or require is not defined / Cannot read properties of null, but the desktop reproduction is the cleaner discriminator.
· H3 (install layout): Cannot find module './dist/main.js' and the inventory shows dist/main.js absent or nested under an extra folder such as holotaxon/holotaxon/dist/main.js. If the file is present and the error is still Cannot find module, H3 is eliminated and H2 is confirmed.
· H4 (other): No module-resolution error at all; instead a manifest/version error, “restricted mode” refusal, a mobile-only require is not defined for a Node builtin, or a syntax/runtime error inside the plugin body. If desktop loads successfully and only Android fails, H4 or an Android-specific H2/H3 variant remains.

A single probe that produces either “resolved” or “Cannot find module” is sufficient to split H2 from H1; the inventory splits H2 from H3. This is cheaper and more discriminating than another CI run.

Recommended sequence

1. Before anything merges: capture the exact desktop console error and inventory the installed plugin folder, as in the discriminating test. This is the missing live evidence and must be done on the current artifact, not on a rebuilt one.
2. Before anything merges: classify the failure as H1, H2, H3, or H4 using the error string plus the folder inventory. Do not accept “CI-green” as a substitute.
3. Before anything merges: consolidate the three bundling PRs. Keep one owner, close the others, and do not merge any bundler until the live error is captured. PR #14 is the architecturally preferable base because it includes the PR #12 export change, correct externals, a packaging guard, and a smoke test that asserts a default-exported class; PR #13 and #15 should be closed as duplicates or folded into #14.
4. Before merge: fix PR #14’s conflict with the existing CI reproducibility step: if the bundle is no longer committed, git diff --exit-code -- main.js must be removed or replaced with a build-then-check-release-artifact step.
5. Merge one single-file esbuild bundle: bundle: true, format: "cjs", outfile: "main.js", externals obsidian and (only if needed, lazily) electron/CodeMirror/Lezer/Node builtins; remove dist/, postbuild, and the stub from the shipped artifact. Update INSTALL.md to copy only main.js, manifest.json, and styles.css.
6. After merge: run live acceptance on both desktop and Android with DevTools/log capture. G0/S0 remains BLOCKED until both platforms load and onload completes.
7. At most one additional automated test: add a loader-emulation test that wraps the built main.js in the same eval shim, injects a whitelist require that throws or returns null for unknown IDs, resolves .default || module.exports, and asserts new Ctor(stubApp, stubManifest) instanceof stubPlugin. Include negative controls: a fixture with a relative require must fail; a fixture with only a namespace object without .default must fail; the real bundle must pass. If PR #13’s harness already does exactly this, validate it with those negative controls rather than adding a second harness.

Uncertainties

· The exact developer-console error was never captured; this is the largest single blocker to certainty.
· Desktop load was never tested; the “Android-only” symptom may be a sampling artifact.
· It is unknown whether dist/ was actually present at the failing Android installation, and whether the installed root main.js was the 99-byte stub or a stale artifact.
· The Android Obsidian version and whether the vault was in restricted mode are unknown; minAppVersion 1.5.0 is probably satisfied but not verified.
· The reverse-engineered loader dump is from a third-party write-up and may not match the exact Obsidian version in use; the official docs and Licat quote corroborate the bundling requirement, but the precise injected-require behavior on current Android builds is inferred, not directly observed.
· It is unknown whether Obsidian’s injected require throws or returns null for unknown module IDs on Android; both would break the stub, but the exact error string differs.
· The internals of PR #13’s simulated harness are not in the data pack verbatim; whether it faithfully reproduces the eval wrapper and whitelist require cannot be audited from the provided facts.
· Whether the Android failure is caused by H2, H3, or H4 cannot be determined from the data pack; the data pack contains no Android-specific log or filesystem inventory.