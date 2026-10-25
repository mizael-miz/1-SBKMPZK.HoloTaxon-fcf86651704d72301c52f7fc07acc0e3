# Changelog

## Unreleased — AUD-0001 loader close-out

- Canonical bundling fix selected in [PR #15](https://github.com/mizael-miz/1-SBKMPZK.HoloTaxon-fcf86651704d72301c52f7fc07acc0e3/pull/15): self-contained root `main.js`, PR #14 external-module list, and dual-loader export normalization (`module.exports = module.exports.default ?? module.exports;`). This addresses the loader failure investigated in AUD-0001. **PR #15 is still pending human merge; this entry does not claim the fix is present on `main`.**
- Android S0 acceptance passed in disposable vault `holotaxon-g0`; desktop corroboration is deferred as a non-blocking open risk tracked by release gate issue #8.

## 0.1.0 — schema-driven runtime foundation

- Establishes B/M/W graph axes, with Layer 2 schema operators and Layer 3 metrology records.
- Defines the core entity/relation registry and graph snapshot envelope.
- Adds explicit Layer 2 effects for field addition, override, removal, requirements, prohibitions, constraints, relation permissions, relationship requirements, relationship properties, and concept-defined relation types.
- Adds a typed graph API, schema validation, bounded traversal, an Obsidian dashboard, JSON entity/relation creation modals, validation reports, exports, and registry merge command.
- Preserves data through versioned snapshots, a pre-write backup, pending write files, optimistic revision checks, additive registry merges, and tombstones.
- Declares JSON storage as an initial adapter, not a multi-million-record backend.
