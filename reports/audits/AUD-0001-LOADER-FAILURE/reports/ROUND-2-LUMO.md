## ROUND-2-AUDIT.md

## Verdicts
H1: refuted confidence=0.95 - E3 proves require("./dist/main.js") returned undefined BEFORE any export shape could be evaluated; the export defect became irrelevant once H2 blocked module resolution
H2: supported confidence=0.98 - E3 directly demonstrates silent-undefined return from relative require; E4 validates bundled solution bypasses the failure
H3: refuted confidence=0.99 - E2 confirms dist/ present on device; packaging CI passed; elimination is near-definitive
H4: unresolved confidence=0.85 - While H2 explains the observed failure, edge cases remain untested (device OS version, Obsidian app version, restricted mode state)

## Evidence
- [E] E1: "Failed to load plugin holotaxon. No exports detected." error originates from Obsidian's app.js export validation checkpoint, confirming eval reached that line without throwing a require exception [E1]
- [E] E2: dist/ directory present on Android device; stub main.js = 99 bytes as specified [E2]
- [E] E3: Probe replication shows `require("./dist/main.js")` returned undefined SILENTLY—probe reading m.exports.default threw TypeError, proving the module loader provided undefined without exception [E3]
- [E] E4: Self-contained CommonJS main.js (single external "obsidian") loaded and executed successfully on same Android device [E4]
- [K] Obsidian developer docs state Node.js/Electron APIs unavailable on mobile; relative module resolution semantics differ between Electron renderer (desktop) and WebView (mobile) contexts [web_search#8, #9]
- [E] Multiple community plugins (obsidian-modules, fix-require-modules) exist specifically to add relative-path require support on mobile, implying native resolution is deficient [web_search#0, #1]
- [E] Forum reports document "ReferenceError: require is not defined on android" and similar on iOS—different from silent-undefined, suggesting behavior varies by context/version [web_search#2, #6]
- [I] Silent-undefined vs exception-throwing likely depends on whether the relative path resolves to an existing file (file present but unreachable vs. missing entirely) [I]
- [S] The bundling fix (PR #13/14/15 approach) eliminates relative requires entirely, sidestepping the sandbox resolution issue regardless of the underlying mechanism [I+S]
- [S] Obsidian's internal app.js export check runs after module eval completes; "No exports detected" means module.exports existed but lacked expected Plugin class constructor [I]

## Discriminating test
**Original test remains valid.** E1-E4 effectively executed it already.

**Additional falsifier checks** for disposable-vault install:
```
Steps:
1. Install bundled artifact into fresh Obsidian vault on ANDROID
2. Enable plugin via UI (not programmatic load)
3. Check console: must see NO "Failed to load plugin" errors
4. Trigger plugin initialization command—if applicable
5. Reload Obsidian app completely, verify plugin persists as enabled
6. Repeat on DESKTOP (same Obsidian version)
7. Repeat with Restricted Mode ON, then OFF
8. Verify on Obsidian versions: minAppVersion (1.5.0) and current stable

Expected error strings per unfalsified condition:
- If bundled artifact fails on mobile: "Failed to load plugin holotaxon. <specific error>"
- If desktop behaves differently: platform-specific loader error (should not occur with bundle)
- If restricted mode blocks: "Plugin holotaxon disabled in restricted mode" (expected behavior, not bug)
- If version mismatch: "Plugin requires Obsidian 1.5.0+" (manifest validation error)
```

## Recommended sequence
**Must merge immediately (unconditional):**
1. Merge one single-file bundling PR (#13 preferred per prior audit) with self-contained main.js artifact
2. Update INSTALL.md to specify: "Install ONLY main.js and manifest.json; do not include dist/"
3. Update package-plugin.mjs to produce single main.js output instead of main.js + dist/

**Before merge (blocking gates):**
4. Execute disposable-vault falsifier checklist above on at least 2 Android devices, 1 iOS device
5. Capture full console logs from each platform during load
6. Document Obsidian app versions tested

**Post-merge cleanup:**
7. Close PRs #12, #13, #14, #15 with consolidated rationale referencing E1-E4 adjudication
8. Add automated mobile-load CI job using Android emulator with plugin enablement assertion
9. Publish CHANGELOG entry: "Fixed Android plugin load failure caused by sandbox-relative require resolution"

**Process improvements:**
10. Define explicit "live acceptance criteria" before future bug fixes: minimum one target platform with full console log proving successful load
11. Establish "single-bundler" policy to prevent concurrent unsynchronized bundling efforts

## Uncertainties
- **Silent-undefined mechanism**: No official Obsidian documentation confirms the exact internal behavior causing undefined return; this remains empirically observed but undocumented
- **Device variation**: Evidence from ONE Android device may not generalize—unknown if WebView version, Android OS version, or device manufacturer affects require resolution
- **iOS behavior**: Zero iOS evidence provided; the fix's portability to iOS is inferred but not verified
- **Edge case triggers**: Unknown conditions that might cause the bundled version to fail (large vaults, network throttling, low memory, filesystem permission quirks)
- **Future Obsidian changes**: If Obsidian updates their plugin loader to better handle relative requires, the bundle-only approach may be unnecessary overhead

---

## Adjudication Confirmation/Contest Details

### Q1: Confirm or contest each adjudication

**H2 confirmed-live** — CONFIRMED
- E3 is direct evidence: `require("./dist/main.js")` returned undefined without throwing
- E4 proves the workaround (single-file bundle with no relative requires) succeeds
- No contest possible given E3's clarity

**H1 refuted-live** — CONFIRMED WITH CAVEAT
- The export shape defect in the stub (`module.exports = require("./dist/main.js")` exports namespace object) WAS present
- However, E3 shows the require returned undefined, so the export shape was never evaluated
- Caveat: Export shape remains a latent defect—if require somehow succeeded (e.g., on desktop), the wrong export would cause failure
- Verdict: Refuted AS THE ROOT CAUSE, but remains a secondary quality issue worth fixing

**H3 eliminated** — CONFIRMED
- E2: dist/ present on device
- CI reproducibility check passed
- No contest possible

**Fix = self-contained bundle** — CONFIRMED
- E4 proves this approach works on Android
- Aligns with official obsidian-sample-plugin pattern

**Falsifiers for disposable-vault install:**
| Falsifier | Test Method | Failure Signal |
|-----------|-------------|----------------|
| Platform-specific loader quirk | Run on iOS + multiple Android versions | "Cannot find module" or "eval error" |
| Version-dependent behavior | Test Obsidian 1.5.0 through latest | Different error message per version |
| Restricted mode interference | Toggle Restricted Mode ON/OFF | Plugin auto-disable or error |
| Large vault performance | Load in 10k+ file vault | Timeout or memory-related failure |
| Concurrent plugin conflict | Enable 10+ other plugins simultaneously | Loader collision error |

---

## Q2: Lumo withdraw or defend H1

As Lumo, I **withdraw H1 as the root cause** based on E3/E4:

- E3 proves the require returned undefined SILENTLY—the module loader failed to resolve the path, so no code execution occurred within dist/main.js
- H1 assumed the stub's export shape caused instantiation failure; however, if the require returns undefined, the export structure becomes unreachable
- The error "No exports detected" (E1) came from Obsidian seeing `module.exports === undefined` on the stub—not from evaluating dist/main.js's exports

However, H1 contains **partial truth**: The stub's export pattern IS nonstandard for Obsidian plugins. Even if H2 were fixed (require works), the current stub structure would still cause problems on platforms where relative resolution succeeds. Recommend fixing exports as a **secondary hygiene concern**, not as the primary bug fix.

---

## Q3: Perplexity/web search on contradicting sources

**No authoritative source contradicts the "silent-undefined" observation**, but critical caveats exist:

**Search findings:**
- [web_search#2] Forum thread "ReferenceError: require is not defined on android" — reports exception, not silent undefined
- [web_search#6] iOS thread "Can't find variable: require" — also exception-based
- [web_search#1, #5] Community plugins (fix-require-modules, CodeScript Toolkit) exist to WORK AROUND mobile require limitations
- [web_search#9] Official docs state Node.js/Electron APIs unavailable on mobile but do not detail module resolution behavior

**Analysis:**
The forum reports show EXCEPTIONS ("ReferenceError", "can't find variable"), not silent-undefined. This suggests:
1. Obsidian's native require behavior MAY vary by version/context
2. The "silent-undefined" observed in E3 could be specific to:
   - Particular Obsidian app version
   - The relative path pointing to EXISTING but unreachable file vs. non-existent file
   - WebView configuration differences across devices

**Conclusion:** No source contradicts E3's observation, but neither do sources confirm "silent-undefined" as standard behavior. The community plugin ecosystem (requiring dedicated workarounds) confirms RELATIVE PATH RESOLUTION IS BROKEN ON MOBILE—mechanism (exception vs. undefined) appears secondary to the core incompatibility.

---

## Audit Integrity Statement

This audit remains adversarial as instructed. Key adversarial findings:

1. **Overconfidence in H2**: While strongly supported, labeling H2 as "confirmed-live" at 0.98+ confidence assumes one device's behavior generalizes. Recommend lowering confidence to 0.90 pending multi-device validation.

2. **H1 dismissal incomplete**: The export shape IS defective even if not the immediate failure cause. Future developers merging the fix may overlook this, creating latent bugs on desktop.

3. **Single-device evidence risk**: E1-E4 from ONE Android device could reflect device-specific quirks. The fix's robustness remains unproven across the Android ecosystem.

4. **Missing iOS data**: Zero iOS evidence submitted. The fix may or may not work on iOS—this uncertainty should be flagged until tested.

5. **"Silent-undefined" terminology**: This phrase does not appear in Obsidian documentation. It is an empirical observation, not established terminology. Using it as definitive language risks confusion in future debugging.


