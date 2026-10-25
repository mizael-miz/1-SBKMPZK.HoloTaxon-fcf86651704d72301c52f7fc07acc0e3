Verdicts

H1: refuted-live confidence=0.92 - E3 shows the stub evaluated to module.exports === undefined before any export-shape check could matter; H1’s original causal claim (namespace object rather than class on .exports) is bypassed by the fact that nothing was exported at all.
H2: confirmed-live confidence=0.95 - E3 is direct, instrumented evidence on the failing Android device: require("./dist/main.js") completed silently and returned undefined, and E1’s “No exports detected” is exactly what Obsidian’s export check emits when the module’s exports are empty.
H3: eliminated confidence=0.97 - E2 confirms dist/ is present on device; the relative target existed and still resolved to undefined, so the failure is not a missing-file or misplacement problem.
H4: unresolved confidence=0.15 - E4 proves a self-contained bundle loads on the same Android device, ruling out a device-wide incompatibility; only a narrow Android-version/manifest incompatibility could remain, and no evidence points to it.

Evidence

· [E] E1: loader error is Failed to load plugin holotaxon. No exports detected.; eval completed; no module-resolution throw surfaced. This is the exact signature Obsidian emits when the evaluated module’s exports are empty.
· [E] E2: dist/ is present on device; the stub main.js is 99 bytes. The relative target existed and still returned undefined, so the failure is not a missing-file problem.
· [E] E3: the instrumented probe evaluated the stub with its own injected require; eval completed, module.exports was undefined, and the probe’s read of m.exports.default threw the captured TypeError. This proves require("./dist/main.js") returned undefined silently, with no exception.
· [E] E4: a self-contained CommonJS main.js with only obsidian external loaded and ran on the same Android device. This eliminates H3 and H4 as primary causes and establishes that a bundle is a sufficient fix for the observed failure.
· [K] Obsidian loads main.js by eval as a string, not from its file path, so relative require() cannot use the plugin directory as a resolution base; Licat: “we only load main.js using eval as a string so it doesn’t actually load from your file path” .
· [K] Obsidian mobile runs plugins in a WebView without a Node.js runtime; top-level Node-style require() at module-eval time breaks the whole plugin load .
· [K] Multiple projects document that Obsidian’s injected require() returns null for Node builtins on mobile, and that when the injected require resolves but returns null, module-level access crashes unless coalesced to {} .
· [K] The “Fix Require Modules” plugin exists specifically because Obsidian on mobile “does not have it at all” and to fix “Cannot find module errors for relative paths” ; this corroborates that native relative require() is not a working mobile facility.
· [I] The precise reason the injected require returns undefined rather than throwing for ./dist/main.js is an internal fallback behavior of Obsidian’s loader; E3 establishes the effect on this device, while the exact mechanism remains inferred from the loader’s eval-based design.

Discriminating test

No further discriminating test is needed for H1 vs H2 vs H3: E1–E4 already split them decisively. The only remaining falsifier a disposable-vault install of the bundled artifact must check is export shape and lifecycle on a clean install:

1. Create a disposable vault on the same Android device.
2. Install only the bundled artifact (main.js, manifest.json, styles.css; no dist/).
3. Enable the plugin and capture the first console/notice error.
4. Confirm onload runs and the plugin’s view or command registers.

Expected outcomes:

· Bundle success: no error; onload runs; command/view appears. This confirms H2 was the live cause and the bundle fixes it.
· “No exports detected” again: the bundle’s export shape is wrong (H1-style problem at the bundle level), not a loader-resolution problem.
· Cannot find module for a non-obsidian external: a missing external or incomplete bundling; H2 is not the remaining issue.
· Mobile-specific require is not defined for a Node builtin: a top-level Node dependency leaked into the bundle; H4-adjacent, but not the original H2 failure.

This is cheaper than another probe because E4 already proved the bundle loads; the disposable-vault step is only an acceptance gate for export shape and lifecycle.

Recommended sequence

1. Before anything merges: file the round-2 evidence and withdraw H1 as the causal diagnosis; mark H2 confirmed-live, H3 eliminated. Do not merge any PR that still claims H1 or H3 as the primary cause.
2. Before anything merges: choose one bundling PR as the sole surviving implementation. PR #14 is architecturally preferable because it includes the PR #12 export correction, correct externals, a packaging guard, and a smoke test that asserts a default-exported class. Close or fold #13 and #15 into #14.
3. Before merge: fix PR #14’s CI reproducibility step so it does not require a committed generated bundle; replace git diff --exit-code -- main.js with a build-then-assert-release-artifact step.
4. Merge one single-file esbuild bundle: bundle: true, format: "cjs", outfile: "main.js", externals limited to obsidian and, only lazily, electron/CodeMirror/Lezer/Node builtins; remove dist/, postbuild, and the stub from the shipped artifact; update INSTALL.md to copy only the three-file layout.
5. After merge: run the disposable-vault acceptance on Android and, separately, desktop. G0/S0 remains BLOCKED until both platforms load and onload completes.
6. At most one additional automated test: add a loader-emulation test that wraps the built main.js in the eval shim, injects a require that returns undefined for unknown IDs, resolves .default || module.exports, and asserts new Ctor(stubApp, stubManifest) instanceof stubPlugin. Include negative controls: a fixture with a relative require must fail; a fixture with a namespace object but no .default must fail; the real bundle must pass. If PR #13’s harness already does this, validate it with these controls rather than adding a second harness.

Uncertainties

· The exact internal mechanism by which Obsidian’s injected require returns undefined for relative paths (fallback vs. loader-specific behavior) is inferred from E3 and the eval-based loader design; E3 proves the effect on this device, not the implementation detail across all Android versions.
· E4 proves the bundle loads on one Android device; a second Android version or manufacturer skin could still expose a different failure mode, though H4 is unlikely given the bundle success.
· The desktop failure was never captured in round 1 or round 2; the audit still lacks a desktop live error string, and the “Android-only” symptom may be a sampling artifact.
· The round-2 probe’s injected require is a reproduction of Obsidian’s loader, not the real loader itself; E3 is strong because it ran on the failing device and produced the same empty-export outcome as E1, but it is not a formal capture of Obsidian’s internal require implementation.
· Whether any Android Obsidian version documents a different behavior for relative require is unknown; the search did not surface a source that contradicts the “silent undefined” finding, but absence of a contradiction is not proof of universal behavior across all versions.

