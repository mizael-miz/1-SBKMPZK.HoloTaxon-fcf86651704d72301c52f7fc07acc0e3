# Versioning, compatibility, and migration contract

Status: normative for implementation baseline 0.1.0.

## 1. Version dimensions are independent

HoloTaxon has distinct version domains:

- **Plugin version**: manifest.json and package.json; governs runtime distribution.
- **Graph format version**: graph_format_version in HoloTaxon/graph.json; governs the serialization envelope and record invariants.
- **Registry format version**: registry_format_version in HoloTaxon/registry.json; governs registry structure.
- **Bundled registry version**: version of the static type catalog shipped with the plugin.
- **Concept definition version**: properties.definition_version on a Layer2Concept; governs that operator's meaning and effects.
- **Record revision**: per-entity or per-relation revision; increments when that record changes.
- **Graph generation**: graph-wide optimistic concurrency counter; increments once per committed graph transaction.

Do not substitute one version domain for another. A plugin patch does not necessarily require a graph-format migration; a Layer 2 definition change can require semantic migration without changing graph serialization.

## 2. Persistence invariants

The following are required:

1. If HoloTaxon/graph.json exists, startup must never replace it with a fresh empty graph.
2. If HoloTaxon/registry.json exists, startup must never replace it with a fresh bundled registry.
3. Invalid JSON or an invalid top-level envelope must stop initialization with an explicit error; never silently reset user data.
4. Before a graph transaction, write a recoverable snapshot of the current graph. Before a registry mutation, snapshot the current registry.
5. Write new JSON to a pending candidate first, then update the canonical file. A failed final write must leave the pending candidate available for recovery.
6. A transaction can require an expected graph generation. A stale generation fails instead of overwriting work based on an old snapshot.
7. Entity and relation identity fields are immutable through ordinary update operations.
8. Deletion is a tombstone operation by default. Historical records and references remain inspectable.
9. The bundled registry merge is additive: new types and missing fields are installed; conflicting local definitions are preserved and reported.
10. A schema operator changing what is valid must not silently delete properties that no longer fit. The record is preserved, validation reports the mismatch, and explicit migration is required.

## 3. Layer 2 operator updates

A Layer 2 concept is executable schema, not passive metadata. Its active binding participates in effective-schema resolution.

When the operator's definition changes:

- retain the stable concept_id only when the concept's meaning and identity remain continuous;
- increment definition_version for a compatible revision;
- create a new concept ID when the conceptual identity materially changes;
- validate all records bound to the changed concept and all relationships whose effective schema depends on it;
- emit a migration/impact report before the change is considered accepted;
- do not auto-coerce, auto-delete, or silently reinterpret existing values;
- retain old assertions and definition versions for historical reconstruction.

A definition that is withdrawn must be deprecated or superseded, not erased while records still reference it. Removing a binding may make a formerly valid field invalid, but that field's stored value remains until an explicit migration resolves it.

## 4. Migration protocol

A future migration must be a separately versioned, reviewable operation with:

1. a unique migration ID and source/target format versions;
2. declared preconditions and affected entity/relation types;
3. a dry-run mode that writes only an impact report;
4. an explicit list of deterministic record transformations;
5. backup verification before execution;
6. validation against the target schema after transformation;
7. an atomic write or recoverable pending candidate;
8. a post-migration report, including skipped records and unresolved conflicts;
9. a rollback path based on the pre-migration snapshot;
10. idempotency: rerunning the same migration must not apply the transformation twice.

**Baseline limitation:** version 0.1.0 provides protective persistence, backups, revisions, tombstones, additive registry merge, and validation. It does not yet implement a general declarative migration runner. Future versions must not claim arbitrary format migration is automatic until that runner exists.

## 5. Repository and release discipline

- Every accepted code/schema change is committed to GitHub.
- Small, semantically coherent commits are preferred over one rolling replacement.
- A release candidate is developed on a named branch and reviewed through a pull request.
- Plugin build artifacts are generated from source; do not hand-edit main.js or dist/*.js.
- CI must run locked dependency installation, type-checking, tests, a production build, and a check that committed artifacts are reproducible.
- Tag releases only after the corresponding commit is accepted. Preserve old tags and commit history.
- User data in the Obsidian vault is separate from repository source and must never be overwritten by installing an update.

## 6. Scale and storage-adapter boundary

JsonVaultGraphStore is the 0.1.0 persistence adapter. It is appropriate as a transparent bootstrap format for small/medium datasets and manual inspection, but a single JSON document is not the target storage architecture for millions of entities and dense relationships.

The GraphStore interface is the replacement seam for an indexed SQLite, embedded graph, or remote graph adapter. A replacement must preserve the public graph API, entity IDs, relationship semantics, Layer 2 effective-schema semantics, revision/generation checks, provenance, and export/import capabilities. Adapter migration must be a separately tested operation; it must not be disguised as a plugin upgrade.

## 7. User recovery procedure

Before manual repair:

1. Close Obsidian or stop writes from the plugin.
2. Copy the entire HoloTaxon/ directory, including backups/, reports/, and pending files.
3. Validate the current graph and registry separately.
4. Restore a known-good backup to a new path first and inspect the difference.
5. Replace canonical data only after explicitly choosing which revisions to preserve.

Never treat a backup as disposable merely because it is older. It may contain the only complete state preceding a failed migration or accidental edit.
