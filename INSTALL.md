# HoloTaxon v0.1.0 — installation and rollback

## Scope and safety

HoloTaxon is a custom Obsidian plugin and is not assumed to be listed in Obsidian's community-plugin directory. This guide installs the project build manually. Use a **new disposable vault** for the S0 acceptance test; do not use a production vault.

The manifest declares Obsidian `1.5.0` as the minimum version. S0 is not complete until the plugin is enabled in a real Obsidian instance, its commands register, and no startup exception is observed. A successful build or CI run is not a substitute for that check.

## Create the installation bundle

From a clean checkout of the target commit, using Node.js 20:

```sh
npm ci --no-audit --no-fund
npm run typecheck
npm test
npm run build
npm run package:plugin
```

The installable folder is written to `artifacts/HoloTaxon/`. It contains the Obsidian entrypoint, manifest, stylesheet, and all compiled `dist/*.js` modules. The root `main.js` requires `dist/main.js`, so **do not omit the `dist/` directory**. The package script validates the version and expected entrypoints and excludes source files and development dependencies.

On GitHub, the CI workflow also uploads this folder as a workflow artifact named `HoloTaxon-plugin`. Download the artifact associated with the exact commit being tested; artifacts expire according to the workflow retention period.

## Install into a disposable vault

1. Create a new empty vault in Obsidian. Record the Obsidian version and operating system.
2. In that vault, create or locate `.obsidian/plugins/holotaxon/`. On desktop Obsidian, the community-plugin settings provide a way to open the plugins folder. If the directory is hidden, enable display of hidden files.
3. Copy the **contents** of the packaged `HoloTaxon` folder into `.obsidian/plugins/holotaxon/`. The resulting layout must be:

   ```text
   <vault>/
     .obsidian/
       plugins/
         holotaxon/
           manifest.json
           main.js
           styles.css
           dist/
             main.js
             ...
   ```

   Do not leave an extra nested `HoloTaxon/HoloTaxon/` or `HoloTaxon/artifacts/HoloTaxon/` directory between the plugin folder and `manifest.json`.
4. Reload Obsidian (or reload community plugins), open **Settings → Community plugins**, and enable **HoloTaxon**. Ensure restricted mode is off for this manually installed plugin.
5. Open the command palette and search for `HoloTaxon`. Confirm that these commands are present:
   - Open HoloTaxon dashboard
   - Validate graph and save report
   - Create entity from JSON
   - Create relation from JSON
   - Export graph snapshot
   - Merge bundled registry additions (preserve conflicts)
6. Run **Open HoloTaxon dashboard**. Confirm the dashboard opens and displays graph/registry statistics. Confirm that the vault now contains `HoloTaxon/graph.json` and `HoloTaxon/registry.json`, and that no startup exception appears in Obsidian's developer console.
7. Record the exact source commit SHA, package version, Obsidian version, OS, install procedure, command-registration result, dashboard result, console/error observations, and whether the initial graph and registry files were created. Attach this record to GitHub issue #2.

## Rollback

1. Disable HoloTaxon in **Settings → Community plugins**.
2. Remove only `.obsidian/plugins/holotaxon/` from the disposable vault.
3. Keep or separately remove the generated `HoloTaxon/` data directory according to the test's cleanup plan. The plugin installation directory and its graph/registry data directory are separate; deleting the plugin folder alone does not delete graph data.

## Failure reporting

If the plugin fails to load, do not mark G0 PASS. Capture the developer-console error, the commit SHA, Obsidian version, and the installed directory tree. Keep the vault disposable and open a corrective issue linked to #2. Never repair the test by replacing existing graph or registry files with blank templates.
