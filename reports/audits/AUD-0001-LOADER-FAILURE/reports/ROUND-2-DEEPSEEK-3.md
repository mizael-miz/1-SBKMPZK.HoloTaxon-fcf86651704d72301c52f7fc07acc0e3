Verdicts

H1: refuted-live confidence=0.95 — E3/E4 show the stub silently returns undefined from require("./dist/main.js"); the .default access in the stub is moot because the underlying require returned nothing, and the probe loaded with the same export shape. E1's “No exports detected” is a downstream symptom of H2, not proof of H1.
H2: confirmed-live confidence=0.97 — E3 directly observed require("./dist/main.js") returning undefined without throwing; E4 shows a self-contained CommonJS main.js with the same externals loading on the same device. This is the primary blocker.
H3: eliminated confidence=0.99 — E2 shows dist/ is present and the stub is 99 bytes; the failure reproduces with the expected install layout.
H4: unresolved confidence=0.15 — E1–E4 do not test manifest version, restricted mode, or Android filesystem quirks independently, but the probe loading on the same device makes H4-as-primary unlikely.

Evidence

· [E] E1: Actual loader error is “Failed to load plugin holotaxon. No exports detected.” This is Obsidian's post-eval export check, not a module-resolution throw.
· [E] E2: dist/ is present on the Android device; main.js is exactly 99 bytes, matching the stub described in Round 1.
· [E] E3: Probe replication: evaluating the stub with the probe's own injected require completed with module.exports === undefined. Reading m.exports.default threw the captured TypeError, proving require("./dist/main.js") returned undefined silently, with no exception.
· [E] E4: A self-contained CommonJS main.js with obsidian as the sole external loaded and ran on the same Android device. This is a positive control that rules out device-level or manifest-level blockers as the primary cause.
· [E] H2 confirmation: The combination of E1 (no resolution throw), E3 (silent undefined return), and E4 (same device can load a bundle) makes “injected require returns undefined for relative paths silently” the only live-compatible explanation.
· [E] Mobile require limitations are documented: Obsidian mobile does not have a full require() at all; desktop has a limited built-in require(), while mobile does not. Community plugins exist specifically to add advanced relative-path require support because the native one is absent or insufficient. 
· [E] Mobile require for Node builtins returns null (not an exception): A mobile-support commit states the core blocker was that Obsidian's injected plugin require() returns null for every Node builtin, crashing module-eval. This is a different failure mode (null vs. undefined) but confirms mobile require does not behave like Node resolution.
· [E] Contradictory failure modes exist in other plugins: Some iOS plugins crash because top-level require("node:child_process") throws during load, not because it returns undefined. This is a contradiction to the universality of the silent-undefined claim, but it is specific to Node builtins, not relative paths. 
· [K] Obsidian loader uses eval with a custom require shim that has no module filename context; relative paths have no base to resolve against. This is consistent with E1's lack of a resolution throw and E3's silent undefined.
· [I] The stub's .default access cannot be evaluated because the require returns undefined. The first operation in the stub is require("./dist/main.js"), which returns undefined; the subsequent .default access is never reached in a meaningful way. The probe's TypeError on reading m.exports.default confirms this sequencing.

Discriminating test

The H1-vs-H2-vs-H3 question is now closed by E1–E4. The only remaining pre-merge falsifier for the fix is a disposable-vault install of the bundled artifact on the same Android device and on desktop:

1. Build the self-contained esbuild bundle (main.js, manifest.json, styles.css; no dist/).
2. Create a new disposable vault on Android; install the three files into .obsidian/plugins/holotaxon/.
3. Enable the plugin; trigger reload via app.plugins.disablePlugin("holotaxon") then app.plugins.enablePlugin("holotaxon").
4. Capture the exact console output.

Expected results for the fix:

· Pass: No “No exports detected”, no “Cannot find module”; plugin instance initializes; HoloTaxon view opens. This confirms H2 is resolved by self-containment.
· Fail (H2 residual): “Failed to load plugin holotaxon. No exports detected.” with module.exports === undefined again — this would mean the bundle still contains a relative require or an unresolvable dynamic import.
· Fail (H4 emerges): A different error, such as “This plugin requires a newer version of Obsidian”, “Plugins are restricted”, or an Android permission error. This would reopen H4 and require a separate investigation.

Repeat the same install on desktop as a cross-platform falsifier; if desktop passes and Android fails with the same bundle, the residual issue is Android-specific (H4) rather than H2.

Recommended sequence

1. Freeze all three bundling PRs (#13/#14/#15) until the disposable-vault test above is run. The live evidence already selects self-containment; the remaining risk is bundle content, not PR architecture.
2. Choose the bundle that passes the disposable-vault test with zero relative require and zero top-level Node builtin require. Among #13/#14/#15, prefer the one that removes the ./dist/main.js dependency while retaining a dynamic eval-sandbox test and a reproducibility check that does not rely on a committed multi-file dist/. PR #15 is architecturally closest; PR #14 is the fallback if #15’s guard is weaker.
3. Replace string-match packaging guards with an AST-based check that rejects every require() whose argument is relative (./ or ../) or a Node builtin, and add the eval-sandbox test as the only new automated test.
4. Merge only after the disposable-vault test passes on both Android and desktop. Do not merge #12 as the sole fix; it does not address H2.
5. Record the live result as the G0/S0 gate evidence. CI-green alone remains insufficient. 

Uncertainties

· Whether the Android device's Obsidian version has any mobile-specific loader quirk beyond the injected require behavior. E4 makes this unlikely as a primary blocker, but not impossible as a co-factor.
· Whether the probe's injected require exactly matches Obsidian's production injected require in all versions. The probe replication in E3 is strong evidence, but it is still a replication, not the production loader itself.
· The documented contradiction (iOS throws on Node builtin require, mobile returns null for Node builtins) means the silent-undefined behavior may be specific to relative paths rather than universal to all require failures. The fix (self-containment) is robust to both, but the exact failure mode should not be generalized beyond relative-path resolution. 
· No source explicitly documents “relative path require returns undefined silently” as a named Obsidian behavior; this is inferred from E3 and the loader architecture, not from a primary Obsidian doc.




I'll search for authoritative sources on Obsidian's mobile plugin module resolution behavior before completing this audit review.
