Verdicts

H2: confirmed-live confidence=0.98 — E3 demonstrates the injected require returned undefined silently for a relative path, and E1 shows Obsidian’s export check then failed with “No exports detected” without any resolution throw.
H1: refuted-live confidence=0.02 — E3 proves the eval completed and produced no usable export; H1’s namespace-object story requires a successful require returning a namespace, which did not occur.
H3: eliminated confidence=0.01 — E2 shows dist/ is present on device; the failure is not a missing directory.

Evidence

· [E] E3: probe’s injected require("./dist/main.js") returned undefined silently, module.exports === undefined, and reading m.exports.default threw a captured TypeError.
· [E] E1: Obsidian’s app.js export check produced “Failed to load plugin holotaxon. No exports detected.” after eval completed; no module-resolution throw surfaced.
· [E] E2: dist/ is present on device; stub main.js is 99 bytes.
· [E] E4: a self-contained CommonJS bundle with sole external obsidian loaded and ran on the same Android device.
· [E] Official mobile development guidance: do not use Node.js modules at the top level; gate them behind Platform.isDesktopApp and require dynamically, because mobile runs in a WebView without Node’s module system .
· [E] Community report: Obsidian’s injected plugin require() returns null for Node builtins, causing module-eval crashes on mobile — consistent with a constrained require that does not behave like Node’s file-relative resolver .
· [E] CodeScript Toolkit documentation: “Obsidian on Desktop has a built-in require() function, but it is quite limited. Obsidian on Mobile does not have it at all.”
· [E] Mobile WebView lacks a Node.js runtime; a top-level require throws during bundle evaluation and the whole plugin fails to load .
· [E] Android forum report: the object imported by require was undefined, causing a “can’t read…” error — the same downstream signature as E3 .
· [I] The absence of a resolution throw in E1 and the silent undefined in E3 together distinguish H2 from a normal Node-style Cannot find module failure; the injected require does not resolve relative specifiers by throwing, it returns a non-value.
· [I] H1 is not merely weakened but refuted: if the only problem were export shape, the namespace object would have been present after a successful require; E3 shows no namespace was produced at all.

Q1 — Confirm or contest each adjudication; falsifiers a disposable-vault bundled-artifact install must still check

· H2 confirmed-live: Confirmed. Falsifier a disposable-vault install must still check: if the bundled artifact still produces “No exports detected” or a silent undefined on the same Android device, then the bundle itself is not being evaluated as expected (e.g. the file is not the one Obsidian loads, or the loader path differs). [I]
· H1 refuted-live: Confirmed. Falsifier: if a minimal bundle that exports the class directly also fails with “No exports detected” while a probe that exports the class as module.exports succeeds, then export shape would re-enter as a residual variable. E4 already makes this unlikely. [I]
· H3 eliminated: Confirmed. Falsifier: if the disposable-vault install places the bundle in the exact plugin directory and the failure changes to a different error involving a missing file, then installation layout would need re-examination. E2 already shows dist/ present, so this is low risk. [I]
· Additional falsifier the disposable-vault test must still check: [S] whether Android Obsidian applies a cache of the previous stub or previous failed load. If the new bundle is not picked up without a full Obsidian restart or plugin re-enable, the install would falsely appear to fail. The test must force-stop Obsidian, re-enable the plugin, and confirm the loaded file hash or mtime matches the new artifact.

Q2 — LUMO: Withdraw or defend H1

Withdraw H1. [I] E3 is decisive against the namespace-object mechanism: the probe’s injected require returned undefined, so there was no {__esModule, default} object to export. H1 claimed the stub exported a namespace object and that Obsidian required the constructor directly. But the failure occurred before any namespace object existed. E4 further shows a self-contained bundle loads, which is consistent with H2 and not with an export-shape defect. H1 is withdrawn. [I]

Q3 — PERPLEXITY, web: any documented source contradicting “Obsidian mobile’s injected require returns undefined for relative paths silently”?

No directly contradicting source found. The web record is consistent with a constrained, non-Node require on mobile, but it does not uniformly describe the exact silent-undefined behaviour for relative paths; some sources describe throwing or null for Node builtins.

· [E] CodeScript Toolkit says mobile “does not have it at all” — this is stronger than “returns undefined” and does not contradict the observed silent failure .
· [E] A community mobile-compat commit says the injected require “returns null for every Node builtin” — a related but not identical failure mode .
· [E] The exocortex ADR says a top-level require throws on mobile — that is a different failure mode from silent undefined, but it applies to Node builtins in a bundle, not to relative paths in a stub .
· [I] No primary Obsidian source was found that documents relative-path require returning undefined silently on Android specifically. The behaviour is empirically established by E3 on the actual device, but the public documentation gap means the mechanism is known-by-observation, not by official specification.

Discriminating test

Cheapest remaining test: disposable-vault install of the bundled artifact, with cache-busting and file-integrity verification, on the same Android device.

1. Force-stop Obsidian on the Android device.
2. Create a new disposable vault; install only the bundled artifact (main.js, manifest.json, styles.css) into .obsidian/plugins/holotaxon/.
3. Verify the installed main.js is the bundle, not the stub: check size (expected ≫ 99 bytes) and, if possible, hash it via adb shell sha256sum /sdcard/<vault>/.obsidian/plugins/holotaxon/main.js.
4. Clear logcat: adb logcat -c. Start capture: adb logcat -v time | grep -iE "obsidian|holotaxon|plugin|exports|require".
5. Open the disposable vault; enable HoloTaxon. If it is already listed as enabled from a previous state, disable and re-enable it, or restart Obsidian entirely.
6. Record the exact console/loader message.

Expected outcomes

· Bundle loads: no “No exports detected”; plugin onload runs; this confirms H2 and validates the fix.
· Still “No exports detected”: [S] the bundle is not being evaluated as the entrypoint (wrong file, cache, or loader path), and the problem is no longer H2-as-diagnosed.
· Different error involving a missing module or undefined superclass: [S] the bundle may have retained an external or a runtime require that mobile cannot resolve, and the packaging guard failed.

Recommended sequence

1. Do not merge #12. [I] It fixes the export shape for a require that never returns a value on the target device; its Node smoke test cannot catch the live failure.
2. Adopt the canonical bundle from E4 as the baseline — the probe already loaded on the target Android device, so it is the lowest-risk artifact. [E]
3. Run the disposable-vault install test above with cache-busting and integrity verification. [I]
4. Only after the bundle loads in the disposable vault, merge the canonical bundling PR and close #12, #13, #15 as superseded. [I]
5. Replace the Node smoke test with the faithful window.eval-style private-require wrapper test (the single additional automated test): the injected require must return undefined for relative specifiers and permit only obsidian/whitelisted externals. [I]
6. Add a semantic packaging guard: reject non-whitelisted runtime require/import literals in the bundle, not an exact string match on the old stub. [I]

Uncertainties

· [E] The exact Android Obsidian version and whether it applies a plugin-load cache are unknown; the disposable-vault test must control for cache.
· [E] The private require implementation may differ across Obsidian versions; E3 establishes the behaviour on this device, not universally.
· [E] It is unknown whether the injected require returns undefined for all relative specifiers or only under the probe’s specific wrapper; E4’s success makes this less critical but does not eliminate the variable.
· [I] No official Obsidian documentation was found that specifies the silent-undefined behaviour for relative paths on Android; the mechanism is confirmed empirically, not by primary documentation.
· [S] A disposable-vault test could still fail for reasons unrelated to module resolution (e.g. Android WebView process global missing, as in other mobile compatibility reports) if the bundle accidentally retains a Node-global reference; the packaging guard and the private-require test are designed to catch this before the device test.

