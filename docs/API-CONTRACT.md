# HoloTaxon API contract 0.1.0

The plugin instance exposes `api: HoloTaxonAPI`. Commands are intentionally expressed as typed calls rather than direct mutation of `graph.json`.

## Entity operations

```ts
api.getSnapshot(): Promise<GraphDocument>
api.getRegistry(): Promise<CoreRegistry>
api.getEntity(id, includeTombstoned?): Promise<EntityRecord | null>
api.listEntities(query?: EntityQuery): Promise<EntityRecord[]>
api.createEntity(input, { allow_draft?, expected_generation? }): Promise<EntityRecord>
api.updateEntity(id, patch, { expected_revision?, expected_generation?, allow_draft? }): Promise<EntityRecord>
api.removeProperty(id, propertyPath, options): Promise<EntityRecord>
api.bindConcept(entityId, conceptId, options): Promise<EntityRecord>
api.unbindConcept(entityId, conceptId, options): Promise<EntityRecord>
api.tombstoneEntity(id, { expected_revision?, expected_generation?, cascade_relations? }): Promise<EntityRecord>
```

`updateEntity` merges `properties` into the existing property map. It cannot mutate identity, type, or axis. `removeProperty` is the explicit deletion operation. `bindConcept` and `unbindConcept` are explicit because they can change the effective schema. Any failed mutation leaves the previous snapshot intact.

## Relationship operations

```ts
api.createRelation(input, { allow_draft?, expected_generation? }): Promise<RelationRecord>
api.updateRelation(id, patch, options): Promise<RelationRecord>
api.tombstoneRelation(id, { expected_revision?, expected_generation? }): Promise<RelationRecord>
api.traverse(query: TraversalQuery): Promise<TraversalResult>
```

Relations are typed, directed by default, and validated against endpoint entity types and effective concept rules. A `symmetric` declaration makes traversal symmetric; it does not rewrite the stored edge direction. A relation is soft-deleted, not erased.

## Validation and schema operations

```ts
api.validateGraph(): Promise<ValidationReport>
api.effectiveEntitySchema(entityId): Promise<EffectiveEntitySchema>
api.mergeBundledRegistry(): Promise<RegistryMergeReport>
```

`effectiveEntitySchema` returns the resulting fields, required/forbidden values, relation permissions, mandatory relation rules, applied concept IDs, and schema resolution issues. The result is derived from the active graph and is not a stored duplicate schema.

## Query contract

`listEntities` supports type, axis, status, concept-binding, label substring, and exact property matches with a bounded result window. `traverse` defaults to bidirectional traversal, depth 4, a maximum of 1,000 returned nodes, and excludes tombstones. Limits are capped to protect Obsidian's UI/runtime. Large-scale query implementations belong in a database adapter.

## Error semantics

`GraphOperationError` contains `issues` when the call failed schema validation. Error-level issues abort a normal mutation. `allow_draft: true` explicitly permits an invalid record to persist with status `draft`; this is for staged concept design and migration, not a way to falsely mark it valid. Warnings never silently change values.

## Layer 2 concept example

```json
{
  "entity_type": "Layer2Concept",
  "label": "Evolutionary population profile",
  "properties": {
    "concept_kind": "population_definition",
    "lifecycle": "active",
    "definition_version": "1.0.0",
    "rationale": "Use this profile when delimiting populations by evolutionary connectivity.",
    "applies_to_entity_types": ["Population"],
    "applies_to_relation_types": ["GENE_FLOW_WITH"],
    "extends_concept_ids": [],
    "requires_concept_ids": [],
    "excludes_concept_ids": [],
    "effects": {
      "entities": {
        "add_fields": {
          "gene_flow_model": {
            "type": "string",
            "required": true,
            "enum": ["none_detected", "limited", "recurrent", "continuous", "unknown"]
          }
        },
        "constraints": [
          { "field": "population_basis", "operator": "equals", "value": "evolutionary" }
        ],
        "allow_outgoing_relations": ["GENE_FLOW_WITH"],
        "allow_incoming_relations": ["GENE_FLOW_WITH"]
      },
      "relations": {
        "add_property_fields": {
          "exchange_scope": { "type": "string", "required": true }
        },
        "required_property_fields": ["exchange_scope"]
      }
    }
  }
}
```

After the concept exists, binding its ID to a `Population` adds `gene_flow_model` to that record's active schema, requires the value, constrains `population_basis`, and allows the relevant relation. The definition is executable and the binding is a schema dependency. If unbound, `gene_flow_model` does not remain an accepted schema field; if a value already exists, it is retained and flagged for explicit migration.
