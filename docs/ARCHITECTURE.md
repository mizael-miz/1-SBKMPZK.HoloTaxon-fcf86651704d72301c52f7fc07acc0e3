# HoloTaxon runtime architecture

Status: implementation baseline `0.1.0`; schema and API are versioned independently.

## 1. The three axes and two meta-layers

HoloTaxon stores one graph with five semantic namespaces:

- **B — Biological:** organismal units, populations and population states, samples and sampling events, biological materials, lineages, and biological events.
- **M — Membership/classification:** taxon concepts, names and name usages, treatments, classification schemes, identifications, membership assertions as relations, species-delimitation hypotheses, clade hypotheses, taxonomic acts, and phylogenetic hypotheses.
- **W — World relations:** places, world entities, temporal intervals, chronostratigraphic units, occurrences, environmental states, niche models, interaction and behavioral events, environmental traces, and ecological anomalies.
- **Layer 2 — active concept/definition operators:** graph records of type `Layer2Concept`. A bound Layer 2 concept changes the effective schema, field requirements/forbidden fields, value constraints, allowed/denied edges, edge-property schema, and/or relation types for applicable B/M/W records.
- **Layer 3 — metrology/evidence:** metric specifications, measurement events and results, uncertainty models, and evidence evaluations. Layer 3 describes and evaluates measurements; it does not add, remove, or change Layer 1 fields or relation permissions.

Axis is derived from the core registry's `entity_type` declaration. Records persist the axis to make the file inspectable, but the runtime validates it against the registry and does not let callers choose it independently.

## 2. Layer 2 is executable schema, not a citation

A `Layer2Concept` record carries `properties.effects`. Binding its ID to a Layer 1 record activates those effects. `concept_bindings` are not decorative backlinks.

Supported entity effects:

- `add_fields`: add new property definitions; collision with an existing field is an error unless expressed as an inherited override.
- `override_fields`: explicitly replace a field definition already available in the composition chain.
- `remove_fields`: remove a property from the effective schema; immutable envelope fields can never be removed.
- `required_fields`: make existing effective fields mandatory.
- `forbidden_fields`: prohibit a property while preserving any already-stored value for explicit migration.
- `constraints`: constrain field values or conditional field relationships.
- `allow_*_relations` and `deny_*_relations`: extend or restrict edge permissions.
- `required_relations`: declare relationship cardinality requirements.

Supported relation effects:

- `add_property_fields`, `override_property_fields`, `remove_property_fields`, `required_property_fields`, `forbidden_property_fields`, and `constraints`.
- `add_relation_types`: add typed relations with domain, range, symmetry, self-loop policy, and properties.
- `remove_relation_types`: prohibit a relation within the concept's scope.

Applicability is explicit through `applies_to_entity_types` and/or `applies_to_relation_types`. An asterisk means all eligible types in that target category. A concept that is bound to a record but does not declare applicability to that record's type invalidates the binding.

### Composition and conflicts

1. Base registry schema applies first.
2. Bound concepts and their `extends_concept_ids` are resolved parent-first.
3. A child concept may override an ancestor's field definition.
4. Independent concepts that try to override the same field incompatibly conflict; the runtime does not invent priority by ID, timestamp, or array order.
5. A concept's `requires_concept_ids` must be present among the bound concept closure; `excludes_concept_ids` must not be present.
6. An inheritance cycle, unavailable concept, draft concept binding, incompatible scope, missing override target, or impossible required/forbidden combination is reported.
7. Layer 3 types cannot be schema targets of Layer 2. `Layer2Concept` cannot mutate Layer 3 type fields or use a dynamic relation as a workaround for doing so.

The runtime never silently resolves a conflict by deleting a value or coercing it to a different type.

## 3. Record envelope versus type-specific properties

Every entity has an immutable envelope:

- `id`, `entity_type`, `axis`, `label`;
- `revision`, `status`, `concept_bindings`;
- `created_at`, `updated_at`, optional `tombstoned_at`;
- `properties`, optional `extension_data`.

The Layer 2 schema changes only `properties` and relationship capabilities; it cannot remove envelope fields. `extension_data` is reserved for preserved material outside the current active domain schema and is not implicitly accepted as a substitute for a required schema field.

Relations have their own envelope (`id`, `relation_type`, `from`, `to`, `revision`, `status`, `concept_bindings`, `properties`, optional `assertion`, timestamps). Relation assertions can record epistemic status, definitions, evidence, sources, spatial/temporal scope, and a typed confidence assessment.

## 4. API and data-flow boundaries

`HoloTaxonAPI` is the public application interface. It calls a `GraphStore` implementation and uses `SchemaEngine` for effective schema resolution and validation. The current `JsonVaultGraphStore` is an intentionally simple small-graph adapter. It is not a claim that one JSON file is an efficient storage engine for millions of records.

The storage boundary is replaceable: a later indexed/graph-backed store can implement `GraphStore` without changing the conceptual API. Before a multi-million-record deployment, replace the JSON adapter and implement indexed queries/streaming; do not make the UI render or traverse all nodes.

Mutation path:

1. Acquire the in-plugin transaction lock.
2. Read the latest graph snapshot.
3. Check an optional expected graph generation and/or record revision.
4. Clone in-memory state; apply a single explicit operation.
5. Resolve Layer 2 effects from the current graph.
6. Validate the proposed record or relationship.
7. Reject the transaction on errors unless `allow_draft` is explicitly requested.
8. Write a uniquely named pre-write backup.
9. Write a pending candidate, then replace the snapshot. If the final write fails, the pending candidate is deliberately retained for recovery.
10. Increment graph generation, record revision, and timestamps.

The graph snapshot is never reset merely because a plugin version changes. Registry upgrades are additive: new types and fields are merged; conflicting existing definitions are preserved and reported. Migrations are explicit and versioned. Entity deletion is soft deletion (`tombstoned`); no public API hard-deletes a biological record or relationship.

## 5. Layer 3 does not mutate Layer 1 schemas

Layer 3 entities may reference B/M/W targets and can support, weaken, contradict, or fail to resolve a claim. They do not introduce Layer 1 field definitions, alter type declarations, change relation domains, or implicitly assign taxonomy. Changing a metric or its uncertainty model changes the metrological interpretation of evidence, not the schema of the organism/population/taxon being measured.

A Layer 2 decision protocol may *consume* Layer 3 results. That dependency is recorded in the Layer 2 definition or the adjudication assertion. It still does not turn the measurement definition itself into a Layer 1 field mutation.

## 6. Preservation and migration

- Entity IDs and relation IDs are immutable after creation.
- `updateEntity` and `updateRelation` merge property keys; they do not replace the complete property maps.
- Property deletion is explicit via `removeProperty`.
- Binding or unbinding concepts never deletes data. If a removed field still has a stored value, validation reports it and the transaction fails unless draft retention is explicitly allowed.
- Concept changes are schema migrations. All dependent entities and relations must be revalidated; incompatible dependents must be rejected or explicitly demoted to draft with their values intact.
- Registry merge conflicts are saved to `HoloTaxon/reports/` and current values remain unchanged.
- JSON parse or envelope failures cause a hard stop. The runtime never replaces unreadable user data with an empty graph.

## 7. Known implementation limits in 0.1.0

- JSON snapshot storage is for initial development and small/medium test graphs only. Every mutation rewrites the snapshot and makes a backup.
- The current core validator checks structural constraints and declared rules; it does not prove biological truth, infer species boundaries, calculate phylogenies, or perform statistical model fitting.
- Layer 2 constraints use a deliberately small deterministic DSL. No arbitrary JavaScript or `eval` is executed from registry data.
- Spatial geometry operations and time interval reasoning beyond field-level schema are future adapter/protocol capabilities.
- Registry changes are additive by default. A breaking schema migration must be an explicit migration, reviewed and tested, not an automatic overwrite.
