# HoloTaxon

HoloTaxon is a schema-driven Obsidian graph runtime for fictional biodiversity. It separates three primary graph axes—biological reality (B), membership/classification (M), and world relations (W)—and two meta-layers.

- **Layer 2 is active:** bound concepts alter the effective schema of applicable records and relationships. They can add, override, remove, require, or forbid fields; impose constraints; restrict edges; and define relation types. Conflicts fail closed rather than being resolved by arbitrary ordering.
- **Layer 3 is metrological:** metrics, measurements, uncertainty, and evidence evaluation can inform claims, but cannot reshape Layer 1 schemas.

This repository contains the plugin source, executable graph API, core registry, schema engine, JSON schemas, and a Layer 2 execution example. The installable plugin uses a self-contained root `main.js` bundle, `manifest.json`, and `styles.css`, with installation guidance in `INSTALL.md`.

## Runtime data files

On first launch the plugin initializes `HoloTaxon/graph.json` and `HoloTaxon/registry.json` inside the vault. These are user data and are never replaced with blank templates on plugin upgrade. Pre-write snapshots are saved under `HoloTaxon/backups/`; validation and registry-merge reports are saved under `HoloTaxon/reports/`; explicit exports go under `HoloTaxon/exports/`.

`graph.json` is canonical for entity and relation instances. `registry.json` defines the installed static type catalog. Layer 2 concept instances are graph entities of type `Layer2Concept`; their active `properties.effects` drive dynamic schema composition.

## Build and checks

```sh
npm install
npm run typecheck
npm test
npm run build
```

The build uses esbuild to bundle `src/main.ts` into a self-contained CommonJS root `main.js` and copies the stylesheet to root `styles.css`. Obsidian, Electron, CodeMirror, Lezer, and Node built-ins remain external to the bundle. `npm run typecheck` remains a separate TypeScript check; TypeScript, esbuild, and `tsx` are development/test dependencies.

## Scale boundary

The first storage adapter uses a JSON snapshot and rewrites it on each mutation. This is deliberate for the initial ontology/API milestone, not a multi-million-record storage recommendation. The `GraphStore` interface is the replacement boundary for a later indexed or graph-backed store. Graph views and traversal are bounded; no global graph is rendered by default.

See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) and [`docs/API-CONTRACT.md`](docs/API-CONTRACT.md).
