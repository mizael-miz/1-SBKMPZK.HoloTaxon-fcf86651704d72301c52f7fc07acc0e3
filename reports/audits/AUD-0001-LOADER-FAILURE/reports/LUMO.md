

## Verdicts
H1: supported confidence=0.72 - Export shape mismatch is well-documented by public sources and addressed by PR #12, but lacks live validation  
H2: contested confidence=0.65 - Bundling best practices and forum errors support this, but no direct reproduction evidence exists  
H3: refuted confidence=0.80 - CI reproducibility checks and INSTALL.md warnings make missing dist/ unlikely in packaged artifacts, though manual install error remains possible  
H4: unresolved confidence=0.90 - Zero Android-specific error data or version/environment details prevent assessment  

## Evidence
- [E] PR #12 smoke test passes asserting "result is a function extending the stubbed Plugin base" but project records this as CI evidence ONLY, not live evidence (data pack #7)  
- [E] Official obsidian-sample-plugin esbuild config uses bundle: true, format: "cjs", external: ["obsidian", ...] yielding ONE self-contained main.js (data pack #9)  
- [E] Stack Overflow states "Obsidian expects either module.exports or exports.default to be your Plugin class directly" (data pack #9)  
- [E] Installed artifacts include dist/ directory per package-plugin.mjs and INSTALL.md mandate (data pack #4, #5)  
- [E] Forum error shows "Cannot find module" failure on desktop Electron requiring npm modules (data pack #9)  
- [E] Three bundling PRs (#13/#14/#15) are all OPEN despite CI-green status—zero merged solutions indicate unresolved uncertainty (data pack #8)  
- [I] Node smoke test cannot validate Android JS runtime behavior or Obsidian sandbox loader differences from Node module resolution [K]  
- [I] The 99-byte stub `module.exports = require("./dist/main.js")` exports a namespace object with __esModule, default, HOLOTAXON_VIEW_TYPE—not the Plugin class directly [E+K]  
- [S] Community "fix-require" plugins existing suggests relative-path resolution is a known pain point in Obsidian ecosystem (data pack #9)  
- [K] Obsidian plugins run in Electron renderer context on desktop with Chrome V8, while Android uses WebView JavaScript engine with different path/module semantics  

## Discriminating test
**Minimal wrapper test** (cheapest: ~30 minutes, zero reinstall needed):

1. Create `/test-wrapped/main.js` containing:
```javascript
console.log("[HOLOTAXON-TEST] ENTRYPOINT REACHED");
try {
  const mod = require("./dist/main.js");
  console.log("[HOLOTAXON-TEST] MODULE KEYS:", Object.keys(mod));
  console.log("[HOLOTAXON-TEST] HAS DEFAULT:", !!mod.default);
  if (typeof mod.default === 'function') {
    console.log("[HOLOTAXON-TEST] DEFAULT IS CONSTRUCTOR");
  }
  module.exports = mod.default || mod;
} catch (err) {
  console.error("[HOLOTAXON-TEST] LOAD FAILED:", err.message);
  throw err;
}
```

2. Replace main.js temporarily in `.obsidian/plugins/holotaxon/` with this wrapper (keep dist/ intact)

3. Reload Obsidian plugin list on ANDROID device

4. Expected outcomes:
   - **H1 confirmed**: "[HOLOTAXON-TEST] ENTRYPOINT REACHED" prints but instantiation fails later with "plugin is not a constructor" or similar
   - **H2 confirmed**: "[HOLOTAXON-TEST] LOAD FAILED: Cannot find module './dist/main.js'" or "module not found" error (relative resolution failure)
   - **H3 confirmed**: Same as H2, but verified by checking dist/ exists at expected path on Android filesystem
   - **Neither**: Wrapper loads successfully, original bug persists elsewhere (H4)

**Critical requirement**: Capture console output via Obsidian's developer tools on Android (Settings → Advanced → Open devTools) or via ADB logcat. Without error strings, all hypotheses remain unverifiable.

## Recommended sequence
**Before any merge:**
1. [REQUIRED] Deploy discriminating test above on ANDROID with full error logging—this gates all further work
2. [REQUIRED] Reproduce load failure on DESKTOP Obsidian with devTools open to capture exact error message
3. [REQUIRED] Document actual error string and Obsidian app version before proceeding

**Conditional actions:**
4. If H2 confirmed (relative require failure): Merge PR #13 or #14 (single-file esbuild bundle eliminates relative requires)
5. If H1 confirmed only (export shape): Merge PR #12 (export fix) with expanded mobile smoke test
6. If H3 confirmed: Fix packaging/install automation, not code

**Do NOT merge without:**
- Live evidence from at least one platform (desktop or Android) showing successful plugin load
- Updated smoke test that mocks Android WebView constraints, not just Node

**Process fixes (must precede bundling PR merges):**
7. Add mobile-specific CI job running on Android emulator with plugin load assertion
8. Consolidate PRs #13/#14/#15 into single discussion—parallel unbundled attempts waste review bandwidth
9. Define explicit "live acceptance criteria" (error-free console log on target platform) in CONTRIBUTING.md

## Uncertainties
- **Exact error message never captured**: This blocks hypothesis discrimination. Without the console error text, any fix is guessing.
- **Android Obsidian runtime specifics**: No authoritative documentation available on how Android's WebView differs from desktop Electron in module resolution; this requires empirical testing
- **Real-world install scenarios**: We don't know if end-users are following INSTALL.md correctly or manually installing incorrectly
- **App version mismatch**: Unknown if target Android devices have Obsidian ≥1.5.0 as required by minAppVersion
- **Restrictive mobile OS behavior**: Android's sandboxed filesystem permissions may block plugin loading regardless of code correctness

---

## Critical Blind Spots in Audit

### On Q6(i)—What Node smoke test CANNOT catch:
- Platform-specific module resolution (Electron vs WebView)
- Relative path normalization differences
- Filesystem permission failures on Android
- Obsidian's actual Plugin instantiation lifecycle vs mocked stub
- Performance characteristics (bundle size impact on mobile)

### On Q6(ii)—Packaging guard brittleness:
String-matching `require("./dist/main.js").default` in CI creates fragile coupling. If someone legitimately wraps imports differently, CI breaks. Better: validate artifact structure (file presence) + runtime smoke test than regex on source text.

### On Q6(iii)—Three parallel bundling PRs:
**Process risk**: High. Three teams solving identical problem with zero coordination creates merge conflicts and diluted review effort. PR #12 focuses on exports, PRs #13-15 focus on bundling—they address different failure modes but PR authors may not know which hypothesis is correct. Recommendation: pause bundling PRs pending discriminating test results.

### On Q6(iv)—Architectural preference:
**PR #13** is architecturally preferable IF H2 is confirmed because:
- Single main.js aligns with official sample plugin pattern
- Eliminates relative requires entirely (root cause if H2 true)
- Simpler artifact (one file vs main.js + dist/)
- Built-in "simulated Obsidian loader" provides better test coverage than Node-only smoke test

However, PR #13's simulated harness is NOT equivalent to real Obsidian loader—this is acknowledged in the PR itself. Without live validation, PR #13's advantage over PR #14/#15 is theoretical.

### Additional audit finding:
The project lacks a **definition of "done"** for this bug. "CI-green" ≠ "working plugin." Until a live load test passes on a target platform, formalizing this as RESOLVED would be premature and potentially release broken software.