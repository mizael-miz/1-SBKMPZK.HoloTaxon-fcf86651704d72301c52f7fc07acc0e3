# Independent audit request — HoloTaxon Obsidian plugin load failure

You are an independent technical auditor with no stake in any prior diagnosis or
fix. Everything you need is in this message. Audit the data pack, render verdicts
on the competing hypotheses, design the cheapest discriminating test, and review
the proposed fixes. Do not fabricate. Tag every claim: [E] evidence from the data
pack, [K] your prior knowledge, [I] inference, [S] speculation. If you have web
access, verify against primary sources and cite URLs. State unknowns explicitly.
Do not propose new features; propose at most one additional automated test.

## Context
- Project: HoloTaxon v0.1.0, an Obsidian plugin (manifest id "holotaxon",
  minAppVersion 1.5.0, isDesktopOnly false).
- Symptom: the plugin fails to load in a real Obsidian vault. The only observed
  failure was on an ANDROID device. Desktop load was never tested. The exact
  developer-console error was never captured.
- No successful live load has ever been recorded; the project's installability
  gate (G0/S0) is formally BLOCKED.
- Several AI agents work this repo in parallel; PR churn is high. Open PRs:
  #12 (entrypoint export fix), #13/#14/#15 (three independent single-file
  bundling attempts). All CI-green; none claims live acceptance.

## Data pack (verbatim facts)
1. Pre-fix build: tsc compiles TypeScript to CommonJS per-module files under
   dist/ (no bundler). scripts/postbuild.mjs writes the root entrypoint, a
   99-byte stub: module.exports = require("./dist/main.js");
2. dist/main.js (compiled, 12.8 KB): "__use strict"; sets the __esModule
   marker; named export HOLOTAXON_VIEW_TYPE; class HoloTaxonPlugin extends
   (require("obsidian")).Plugin; ends with: exports.default = HoloTaxonPlugin;
3. dist module graph (all targets present in the shipped bundle):
   main.js -> obsidian, ./graph-api, ./graph-store;
   graph-api.js -> ./default-registry, ./model, ./schema-engine;
   graph-store.js -> obsidian, ./default-registry, ./model;
   schema-engine.js -> ./model; default-registry.js -> (none); model.js -> (none)
4. Packaging: package-plugin.mjs copies main.js, manifest.json, styles.css AND
   dist/ into artifacts/HoloTaxon/. INSTALL.md mandates copying dist/ into
   .obsidian/plugins/holotaxon/ and warns "do not omit the dist/ directory".
5. CI (passes on all branches): npm ci -> typecheck -> tests -> build ->
   git diff --exit-code -- main.js styles.css dist (reproducibility) ->
   package -> upload artifact.
6. manifest.json: valid JSON, all required fields (id holotaxon, version
   0.1.0, minAppVersion 1.5.0, isDesktopOnly false).
7. Fix history: issue #10 diagnosed the export shape. PR #11 and PR #12 both
   changed the stub to module.exports = require("./dist/main.js").default;
   and added a Node smoke test (stub the "obsidian" module, require built
   main.js, assert the result is a function extending the stubbed Plugin
   base). PR #11 closed as duplicate; PR #12 open, CI-green (run 40199546293:
   smoke test 1/1 passing; 9-file bundle packaged). The project itself
   recorded on issue #2 that this is CI evidence ONLY, not live evidence.
8. Bundling PRs (open):
   - PR #13 (standalone): esbuild single main.js (external: obsidian only);
     removes dist/, postbuild, tsconfig.build; adds a "simulated Obsidian
     loader" harness + lifecycle tests; claims the relative require "cannot
     resolve under Obsidian's loader (reproduced in the simulated harness)".
   - PR #14 (stacked on #12): esbuild bundle; externals obsidian, electron,
     @codemirror/*, @lezer/*, Node builtins; stops committing the generated
     bundle; packaging rejects relative runtime require(); smoke test updated
     to assert Obsidian's "default-exported plugin class, not a raw
     constructor".
   - PR #15 (draft, stacked on #12): esbuild bundle, similar externals;
     removes the ./dist/main.js dependency; retains smoke test, packaging
     guard, reproducibility check.
9. Public references gathered so far:
   - Official obsidian-sample-plugin esbuild config: bundle: true,
     format: "cjs", external: ["obsidian", "electron", "@codemirror/*",
     "@lezer/*", ...node builtins] — the blessed layout is ONE self-contained
     main.js.
   - Stack Overflow (Obsidian plugin export): "Obsidian expects either
     module.exports or exports.default to be your Plugin class directly."
   - Obsidian forum error (desktop, Electron): plugin code requiring an npm
     module fails with "Plugin failure: <id> Error: Cannot find module 'X'
     Require stack: - electron/js2c/renderer_init at Module._resolveFilename..."
   - Obsidian developer docs "Build a plugin": compile source into a main.js
     in the plugin directory; the sample workflow yields a single main.js.
   - Community "fix-require"-style plugins exist specifically to add
     relative-path module loading inside Obsidian environments.

## Competing hypotheses
- H1 (export shape): Obsidian requires the plugin constructor directly on
  module.exports; the stub exported the CommonJS namespace object
  ({__esModule, default, HOLOTAXON_VIEW_TYPE}), so instantiation fails.
- H2 (sandbox require): Obsidian evaluates main.js inside its own loader and
  cannot resolve relative requires like ./dist/main.js (desktop Electron eval
  context; Android JS runtime without Node resolution) — so the stub fails
  regardless of export shape, even with dist/ present.
- H3 (install layout): dist/ missing or misplaced at install (three-file
  manual copy, nested folder, wrong plugin dir), so ./dist/main.js cannot
  resolve at load time.
- H4 (other): minAppVersion vs installed app version, restricted mode,
  manifest problems, Android filesystem/path quirks.

## Questions — answer every one
Q1 Verdict per hypothesis: {supported | contested | refuted | unresolved},
   confidence (0.00-1.00), strongest argument for and against.
Q2 The applied fix module.exports = require("./dist/main.js").default:
   necessary? sufficient? regression risks?
Q3 Does Obsidian's loader resolve relative require() from plugin main.js on
   desktop AND on Android? Cite primary sources if web-capable; otherwise
   mark as inference. Also: does PR #13's simulated harness constitute
   evidence about the real loader?
Q4 Design the single cheapest discriminating test for H1 vs H2 vs H3 that can
   run BEFORE any reinstall (exact steps; exact error string that would
   confirm each hypothesis).
Q5 Should the project adopt a single-file esbuild bundle now regardless of
   audit outcome? Tradeoffs: install robustness, mobile, debuggability/source
   maps, CI reproducibility check, artifact size.
Q6 Audit the fixes for blind spots: (i) what can the Node smoke test NOT
   catch? (ii) brittleness of packaging guards that string-match
   'require("./dist/main.js").default' or reject relative requires;
   (iii) three parallel bundling PRs with zero live evidence — process
   risks; (iv) which of PR #13/#14/#15 is architecturally preferable, and why?
Q7 Android specifically: how does its plugin runtime differ from desktop
   (module loading, filesystem, paths)? Does any data-pack evidence tie the
   Android failure to one hypothesis?

## Required output format (use exactly these headings)
## Verdicts
One line per hypothesis: "H1: <status> confidence=<0.00-1.00> - <rationale>"
## Evidence
Bulleted; each item tagged [E]/[K]/[I]/[S]; cite URLs for web-verified claims.
## Discriminating test
Exact steps; expected error string per hypothesis.
## Recommended sequence
Ordered, bounded; mark what must happen BEFORE anything merges; no speculative
extras.

## Uncertainties
Explicit unknowns that block certainty.

## Verdicts

H1: contested confidence=0.95 - [I] The claim that Obsidian requires the constructor directly on `module.exports` is too strong: official guidance requires a default-exported Plugin subclass. [E] The original stub forwards an object containing `default: HoloTaxonPlugin`, which is not, by itself, proof of an invalid export. [I] Against H1 as the observed cause: the relative `require()` can fail before export interpretation is reached. The installed loader’s actual export selection remains unobserved.[1]

H2: supported confidence=0.93 - [K] Official guidance requires bundling dependencies into `main.js`; a forum report reproduces a maintainer explanation that Obsidian evaluates that file as a string, without its filesystem module context. [I] This strongly supports a loader-resolution defect in the stub, despite shipped files being present. Against certainty: there is no captured Android exception or inspection of the affected app’s loader.[1][2]

H3: unresolved confidence=0.98 - [E] Packaging includes `dist/`, and installation instructions require it; neither establishes the contents of the actual Android installation. [I] A missing or misplaced file remains possible, but no installation inventory supports it. Even a perfect installation would not establish that the loader resolves relative imports.

H4: unresolved confidence=0.98 - [E] The supplied manifest is structurally valid, but the installed app version, restricted-mode state, actual installed manifest, and filesystem conditions are unknown. [I] Manifest syntax problems are weakened by the pack; the other alternatives have neither affirmative nor exclusionary evidence.

[I] Confidence here measures confidence in the verdict classification, not a probability that each hypothesis caused the failure. The hypotheses can coexist.

## Evidence

- [E] **Bottom line:** only an Android load failure is observed; no exception, desktop result, or successful live load exists. CI-green is not live acceptance, and G0/S0 remains BLOCKED.

- [K] The official API repository says `main.js` “Must export a default class which extends `Plugin`” and “Must bundle all external dependencies into this file.” This directly contradicts treating a raw constructor as the only permitted export contract. Primary URL: [https://github.com/obsidianmd/obsidian-api](https://github.com/obsidianmd/obsidian-api) .[1]

- [K] The desktop forum report includes `Cannot find module`, an Electron require stack, and a successful absolute-path workaround. It quotes Licat: “we only load main.js using eval as a string so it doesn’t actually load from your file path.” This is a firsthand failure report plus an attributed maintainer explanation—not inspected current loader source. Primary report URL: [https://forum.obsidian.md/t/the-import-of-third-party-module-is-failing-in-main-js-cannot-find-module/25180](https://forum.obsidian.md/t/the-import-of-third-party-module-is-failing-in-main-js-cannot-find-module/25180) .[2]

- [I] Q3, desktop: do not assume plugin-directory-relative Node resolution for `require("./dist/main.js")`. The preceding evidence supports that it is not the standard supported loading model; it does not prove that every desktop version or modified environment rejects every relative request.[1][2]

- [K] Q3/Q7, Android: official documentation states that Node.js and Electron APIs are unavailable on mobile and that calls to them can crash plugins. It also documents inspecting the actual Android WebView through USB debugging and `chrome://inspect/`. Primary URL: [https://docs.obsidian.md/Plugins/Getting+started/Mobile+development](https://docs.obsidian.md/Plugins/Getting+started/Mobile+development) .[3]

- [I] Consequently, Android must not be treated as a Node filesystem/module environment. Obsidian’s provision of its own API module does not imply that it supplies general filesystem-relative CommonJS loading. The verified sources support bundling and reject reliance on Node APIs; they do not expose the exact Android resolver implementation or its exact exception text.[1][3]

- [I] Filesystem access and module resolution are separate questions: a vault adapter may successfully read `dist/main.js` while the plugin loader still cannot `require()` it. Desktop filesystem workarounds therefore do not establish Android compatibility.[2][3]

- [E] The supplied module graph contains only `obsidian` and local modules, and all local targets exist in the shipped artifact. [I] This weakens an artifact-level missing-dependency claim, not an installed-layout defect or loader defect. Nothing in the pack specifically establishes an Android path or filesystem bug.

- [I] PR #13’s simulated harness establishes how its simulation behaves, not how Obsidian behaves. If the harness deliberately denies relative imports, its failure is an assumption exercised, not independent confirmation of that assumption. Its lifecycle tests may still be useful unit tests; real-loader fidelity requires separate evidence.

- [I] Q2, necessity: the `.default` change is not established as necessary. The original forwarded object already exposes the documented default class, provided loading reaches it. Q2, sufficiency: it is not sufficient to repair H2 or H3, since the same relative `require()` executes first. [E] PR #12 establishes only that Node, with a stubbed `obsidian`, can resolve the installed-on-disk build and return the expected subclass.[1]

- [I] Q2, regression risks: selecting `.default` discards the other forwarded exports and becomes coupled to that precise compiler output shape. A later build exporting the constructor directly could make `.default` undefined. Whether this changes actual Obsidian compatibility cannot be decided from the supplied smoke test.

- [I] Q6(i), the Node smoke test cannot establish Android loader behavior, Obsidian export normalization, real API compatibility, lifecycle success, actual installation contents, app-version eligibility, or restricted-mode state. Its stub also cannot expose failures that depend on the real `Plugin` implementation.

- [I] Q6(ii), matching the literal text `require("./dist/main.js").default` tests a spelling, not an export contract; equivalent quoting, whitespace, or generated code can change the result. Conversely, that exact spelling can be present while loading remains broken.

- [I] A textual ban on relative `require()` can miss alternate syntax or dynamic requests and can flag comments or strings. Even a structural check cannot infer all dynamic loading behavior. Prefer reviewing esbuild’s dependency/output metadata for unexpected external local modules, while retaining explicit limits on what that proves.

- [I] Q5, adopt a single-file bundle now as the build direction, not as a declaration of incident resolution. It removes this local-runtime-import dependency and the extra installation obligation. [K] The official release repository states that Obsidian downloads `manifest.json`, `main.js`, and optional `styles.css`; this makes reliance on separately installed `dist/` unsuitable for that standard distribution path. Primary URL: [https://github.com/obsidianmd/obsidian-releases](https://github.com/obsidianmd/obsidian-releases) .[4]

- [I] Bundling tradeoffs:
  - Installation robustness: fewer required files and no local module-resolution chain.
  - Mobile: beneficial, but bundling does not make Node/Electron-dependent code mobile-safe; externalizing those modules is not a compatibility fix.[3]
  - Debugging: source-level debugging must be preserved deliberately through a chosen source-map policy; otherwise one generated file makes diagnosis less convenient.
  - Size: compare actual artifacts. A larger root `main.js` need not mean a larger total package when it replaces several compiled files; no measured size delta is supplied.
  - Reproducibility: preserve a meaningful clean-build comparison, not merely a green command that no longer observes generated output.

- [I] Q6(iv), PR #14 is the preferable architectural starting point, conditionally: its described external allowlist follows the supplied official sample configuration, and it avoids committing a generated bundle. However, its export assertion must be justified against the real contract, and its reproducibility mechanism must change if generated output becomes untracked. [E] PR #15 explicitly retains a reproducibility check, but the pack does not establish whether that check still has a meaningful baseline. PR #13’s `obsidian`-only external list is not inherently wrong for the supplied small graph; its simulation-based causal claim is the larger concern.

- [I] A `git diff` check over an untracked generated `main.js` does not prove that file is reproducible. If generated output is no longer committed, compare outputs from clean builds rather than silently retaining the old tracked-file check.

## Discriminating test

[I] The cheapest useful test is one diagnostic session against the existing Android installation: inventory its files, then capture one real-loader attempt. Do not reinstall, rebuild, substitute a Node loader, or modify the plugin files first. No single error string uniquely separates H1–H3.

1. [K] Connect the affected Android device by USB, enable USB debugging, open `chrome://inspect/` in a desktop Chromium-based browser, and inspect Obsidian’s WebView. This is the official mobile-debugging procedure. [https://docs.obsidian.md/Plugins/Getting+started/Mobile+development](https://docs.obsidian.md/Plugins/Getting+started/Mobile+development) .[3]

2. [I] Preserve the console log. Record the installed Obsidian version and whether community plugins are enabled. In the inspected console, inventory the active configuration directory without assuming its name:

   ```js
   const dir = `${app.vault.configDir}/plugins/holotaxon`;
   const paths = [
     "manifest.json", "main.js",
     "dist/main.js", "dist/graph-api.js", "dist/graph-store.js",
     "dist/default-registry.js", "dist/model.js", "dist/schema-engine.js"
   ];

   for (const p of paths) {
     console.log(p, await app.vault.adapter.exists(`${dir}/${p}`));
   }
   console.log(await app.vault.adapter.read(`${dir}/manifest.json`));
   console.log(await app.vault.adapter.read(`${dir}/main.js`));
   ```

   [I] These console operations use Obsidian runtime objects; their availability must be checked on that app version. This is a manual diagnostic, not an additional automated test.

3. [I] Enable “Pause on caught exceptions” and “Pause on uncaught exceptions” in DevTools. Enable HoloTaxon once through Obsidian’s UI. At the first relevant exception, save the exact message, stack, failing request, and caller. If execution reaches export selection/instantiation, inspect the value returned by the evaluated entrypoint and which value the loader actually tries to construct.

4. [I] Interpret the combined observations:

   | Hypothesis | Discriminating observation and error expectations |
   |---|---|
   | H1 | All required loads complete; the entrypoint returns the namespace object; the actual loader attempts to construct that object rather than its `default` class. A constructor-related `TypeError` is compatible, but its exact wording is unknown. No honest universal exact error string can be specified. |
   | H2 | `dist/main.js` is readable at the expected location, but the actual loader fails at the stub’s relative request. `Cannot find module './dist/main.js'` is a candidate signature, not a guaranteed Android message. That text alone cannot distinguish H2 from H3. |
   | H3 | The inventory proves a required file absent or misplaced. The loader may emit the same `Cannot find module './dist/main.js'` text as H2. Missing-file evidence confirms a layout defect, not that it is the only defect. |
   | Other | Failure occurs before entrypoint execution, or at a different operation. Preserve that result instead of forcing it into H1/H2/H3. |

[I] This session can identify the first failure and concurrent layout defects. If H2 stops execution first, it cannot establish whether an additional export defect would occur afterward; a demand for complete mutually exclusive classification from one untouched run is not achievable.

## Recommended sequence

1. [I] BEFORE anything merges: freeze competing build changes long enough to run the diagnostic session above. Preserve the current installed files and record the tested commit/artifact identity where available. Keep G0/S0 BLOCKED.

2. [I] BEFORE anything merges: designate one bundling PR as the integration candidate; use #14 provisionally, subject to its actual diff. Consolidate useful changes rather than merging three competing build systems. Remove claims that the simulator reproduces the real loader, and do not merge #12 as a proven incident fix.

3. [I] BEFORE the selected bundling change merges: resolve the export-contract assertion, ensure the packaged artifact contains the intended generated `main.js`, verify no unexpected local runtime imports remain, and make the reproducibility check meaningful for the chosen tracked/untracked-output policy. Retain typechecking because bundling is not a substitute for it. No additional automated test is proposed.

4. [I] BEFORE merging the load-fix claim: install the exact candidate artifact on the affected Android device and record real load/enable results and any exception. Test that same artifact on desktop before claiming desktop acceptance. A successful bundle load establishes acceptance of that artifact; because bundling changes multiple variables, it does not retrospectively prove H1 or H2 alone.

5. [I] Close or rebase the redundant PRs around the accepted implementation. [E] Until live acceptance is recorded, CI evidence does not unblock the project’s stated gate.

## Uncertainties

- [E] The original Android exception and stack were never captured.
- [E] Desktop loading has never been tested.
- [I] The actual installed file layout, file contents, app version, configuration directory, and runtime modifications are unknown.
- [I] The affected Android loader’s exact module-resolution and export-normalization implementation remains unverified; the primary evidence supports bundling but does not supply that implementation.
- [I] The forum maintainer explanation is attributed through another participant and concerns an older desktop report, not this Android incident.[2]
- [E] The full PR diffs, simulator implementation, source-map choices, generated-output tracking rules, and artifact-size measurements are absent.
- [I] Parallel PRs create risks of incompatible build conventions, stale tests, duplicate fixes, and false confidence from testing different artifacts. No supplied evidence establishes that any particular PR currently avoids all of these.
- [I] The Android observation makes H2 especially plausible, but platform coincidence is not causal proof. H1, H3, and H4 cannot be excluded without the missing runtime evidence.

Citations:
[1] obsidianmd/obsidian-api: Type definitions for the latest ... - GitHub https://github.com/obsidianmd/obsidian-api
[2] The import of third party module is failing in main.js : Cannot find ... https://forum.obsidian.md/t/the-import-of-third-party-module-is-failing-in-main-js-cannot-find-module/25180
[3] Mobile development - Developer Documentation https://docs.obsidian.md/Plugins/Getting+started/Mobile+development
[4] Community plugins list, theme list, and releases of Obsidian. - GitHub https://github.com/obsidianmd/obsidian-releases
[5] User Scripts | QuickAdd https://quickadd.guide/docs/UserScripts/
[6] Modules - Obsidian Plugin https://community.obsidian.md/plugins/modules
[7] Dev Loader Updater - Obsidian Plugin https://community.obsidian.md/plugins/dev-loader-updater
[8] GitHub - obsidianmd/obsidian-sample-plugin https://github.com/obsidianmd/obsidian-sample-plugin
[9] esbuild.config.mjs - obsidianmd/obsidian-sample-plugin - GitHub https://github.com/obsidianmd/obsidian-sample-plugin/blob/master/esbuild.config.mjs
[10] package.json - obsidianmd/obsidian-sample-plugin - GitHub https://github.com/obsidianmd/obsidian-sample-plugin/blob/master/package.json
[11] GitHub - davidvkimball/obsidian-sample-plugin-plus https://github.com/davidvkimball/obsidian-sample-plugin-plus
[12] obsidian-sample-plugin/esbuild.config.mjs at ... - GitHub https://git.fifitido.net/tpl/obsidian-sample-plugin/src/commit/f40c720d4e701c200d04c789c7fcbfd3b412d186/esbuild.config.mjs
[13] Plugin JS minification - Devs - Obsidian Forum https://forum.obsidian.md/t/plugin-js-minification/82011
[14] Expose `obsidian` module to be used outside plugins - Devs - Obsidian Forum https://forum.obsidian.md/t/expose-obsidian-module-to-be-used-outside-plugins/49988
[15] Guide to develop and execute modular JavaScript in Obsidian https://forum.obsidian.md/t/guide-to-develop-and-execute-modular-javascript-in-obsidian/88339
[16] stroiman/obsidian-sample-plugin-with-tests - GitHub https://github.com/stroiman/obsidian-sample-plugin-with-tests
[17] Fix Require Modules – Obsidian Plugin https://www.obsidianstats.com/plugins/fix-require-modules
[18] Install this plugin loader to make your Obsidian SUPER FAST! - Reddit https://www.reddit.com/r/ObsidianMD/comments/1ekea52/install_this_plugin_loader_to_make_your_obsidian/
[19] mnaoumov/obsidian-codescript-toolkit - GitHub https://github.com/mnaoumov/obsidian-fix-require-modules
[20] Failed to load plugin · Issue #4 · KosmosisDire/obsidian-webpage-export https://github.com/KosmosisDire/obsidian-webpage-export/issues/4
[21] Broken links in relative path mode on move/rename - Obsidian Forum https://forum.obsidian.md/t/broken-links-in-relative-path-mode-on-move-rename/4386
[22] Rust library and CLI to export an Obsidian vault to regular Markdown https://github.com/zoni/obsidian-export
[23] Mobile, startup: Reduce the time until the user can write - Page 2 https://forum.obsidian.md/t/mobile-startup-reduce-the-time-until-the-user-can-write/57450?page=2
[24] Templater: custom.js + module load throws error : r/ObsidianMD https://www.reddit.com/r/ObsidianMD/comments/1gjc1k0/templater_custom.js_module_load_throws_error/
[25] Why does fs.writeFile not save file? - Devs - Obsidian Forum https://forum.obsidian.md/t/why-does-fs.writeFile-not-save-file/31972
[26] Obsidian Cheatsheet.md - GitHub https://github.com/kobbled/Obsidian-Cheatsheet/blob/main/Obsidian%20Cheatsheet.md
[27] Does there exist self-hosting solutions? : r/ObsidianMD - Reddit https://www.reddit.com/r/ObsidianMD/comments/kw1l91/does_there_exist_self-hosting_solutions/ 
[28] Regression: Even in a new vault, typing "[Untit#" shows "No match ... https://forum.obsidian.md/t/regression-even-in-a-new-vault-typing-untit/106446
[29] How do I work with Obsidian on Mobile? - Page 11 - Basement https://forum.obsidian.md/t/how-do-i-work-with-Obsidian-on-Mobile/471?page=11
[30] GitHub - KosmosisDire/obsidian-webpage-export https://github.com/KosmosisDire/obsidian-webpage-export