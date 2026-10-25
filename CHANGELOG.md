# Changelog

## Unreleased

- fix(build): produce a single self-contained `main.js`. Obsidian evaluates `main.js` as a string inside its own loader and cannot resolve the previous `require("./dist/main.js")` wrapper (reproduced in the simulated loader harness). The build now bundles the TypeScript sources with esbuild (`obsidian` external), the committed `dist/` modules and `tsconfig.build.json` are removed, and `npm run test:bundle` checks the entry point in that harness with the legacy wrapper as a failing control.
- test: add `npm run test:lifecycle`, a full plugin lifecycle simulation against the bundle: `onload()`/`onunload()` run against a simulated Obsidian app with an in-memory vault, asserting command/view/ribbon/event registration, data-file initialization, and fail-closed startup (no data reset) when existing graph/registry data is corrupt or invalid. The packaging script runs both checks against the packaged artifact.

## 0.1.0 — schema-driven runtime foundation

- Establishes B/M/W graph axes, with Layer 2 schema operators and Layer 3 metrology records.
- Defines the core entity/relation registry and graph snapshot envelope.
- Adds explicit Layer 2 effects for field addition, override, removal, requirements, prohibitions, constraints, relation permissions, relationship requirements, relationship properties, and concept-defined relation types.
- Adds a typed graph API, schema validation, bounded traversal, an Obsidian dashboard, JSON entity/relation creation modals, validation reports, exports, and registry merge command.
- Preserves data through versioned snapshots, a pre-write backup, pending write files, optimistic revision checks, additive registry merges, and tombstones.
- Declares JSON storage as an initial adapter, not a multi-million-record backend.
