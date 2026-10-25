import { test } from "node:test";
import * as assert from "node:assert/strict";
import { DEFAULT_REGISTRY } from "../src/default-registry";
import type { EntityRecord, GraphDocument } from "../src/model";
import { SchemaEngine } from "../src/schema-engine";

const now = "2026-10-24T00:00:00.000Z";
function entity(id: string, entity_type: string, axis: EntityRecord["axis"], properties: Record<string, unknown>, concept_bindings: string[] = []): EntityRecord {
  return { id, entity_type, axis, label: id, revision: 1, status: "active", concept_bindings, properties, created_at: now, updated_at: now };
}
function graph(entities: Record<string, EntityRecord>): GraphDocument {
  return { graph_format_version: "1.0.0", graph_id: "TEST", generation: 0, metadata: { title: "test", created_at: now, updated_at: now, plugin_version: "0.1.0" }, entities, relations: {} };
}
function concept(id: string, extra: Record<string, unknown> = {}): EntityRecord {
  return entity(id, "Layer2Concept", "L2", {
    concept_kind: "test_profile", lifecycle: "active", definition_version: "1.0.0", rationale: "Test definition.",
    applies_to_entity_types: ["Population"], applies_to_relation_types: [], extends_concept_ids: [], requires_concept_ids: [], excludes_concept_ids: [],
    effects: { entities: {} }, ...extra
  });
}

test("a bound Layer 2 concept dynamically adds and requires a Layer 1 field", () => {
  const c = concept("L2-EVOL", {
    effects: { entities: { add_fields: { gene_flow_model: { type: "string", required: true, enum: ["limited", "recurrent", "unknown"] } }, required_fields: ["gene_flow_model"], constraints: [{ field: "population_basis", operator: "equals", value: "evolutionary" }] } },
    applicability: { required_property_values: { population_basis: "evolutionary" } }
  });
  const p = entity("POP-1", "Population", "B", { population_basis: "evolutionary", identity_rule: "continuity", unit_definition: "organism", gene_flow_model: "recurrent" }, ["L2-EVOL"]);
  const g = graph({ [c.id]: c, [p.id]: p });
  const engine = new SchemaEngine(DEFAULT_REGISTRY);
  const schema = engine.effectiveEntitySchema("Population", p.concept_bindings, g, p.id, p.properties);
  assert.ok(schema.fields.gene_flow_model);
  assert.equal(schema.fields.gene_flow_model.required, true);
  assert.equal(schema.issues.filter(x => x.severity === "error").length, 0);
  assert.equal(engine.validateEntity(p, g).filter(x => x.severity === "error").length, 0);
});

test("concept-defined relation types are available only through active bindings", () => {
  const c = concept("L2-RETIC", {
    applies_to_relation_types: ["RETICULATED_WITH"],
    effects: {
      entities: { allow_outgoing_relations: ["RETICULATED_WITH"], allow_incoming_relations: ["RETICULATED_WITH"] },
      add_relation_types: [{ id: "RETICULATED_WITH", description: "test reticulation", from_types: ["Population"], to_types: ["Population"], symmetric: true, allow_self_loop: false, properties: { mode: { type: "string", required: true } } }]
    }
  });
  const p1 = entity("POP-1", "Population", "B", { population_basis: "genetic", identity_rule: "one", unit_definition: "organism" }, ["L2-RETIC"]);
  const p2 = entity("POP-2", "Population", "B", { population_basis: "genetic", identity_rule: "two", unit_definition: "organism" }, ["L2-RETIC"]);
  const g = graph({ [c.id]: c, [p1.id]: p1, [p2.id]: p2 });
  const engine = new SchemaEngine(DEFAULT_REGISTRY);
  const rel = engine.effectiveRelationSchema("RETICULATED_WITH", p1, p2, [], g);
  assert.ok(rel.spec);
  assert.equal(rel.properties.mode.type, "string");
  assert.equal(rel.issues.filter(x => x.severity === "error").length, 0);
});

test("independent conflicting Layer 2 overrides fail instead of using incidental precedence", () => {
  const a = concept("L2-A", { effects: { entities: { override_fields: { population_basis: { type: "string", enum: ["ecological"] } } } } });
  const b = concept("L2-B", { effects: { entities: { override_fields: { population_basis: { type: "string", enum: ["evolutionary"] } } } } });
  const p = entity("POP-1", "Population", "B", { population_basis: "ecological", identity_rule: "one", unit_definition: "organism" }, ["L2-A", "L2-B"]);
  const g = graph({ [a.id]: a, [b.id]: b, [p.id]: p });
  const schema = new SchemaEngine(DEFAULT_REGISTRY).effectiveEntitySchema("Population", p.concept_bindings, g, p.id, p.properties);
  assert.ok(schema.issues.some(x => x.code === "CONCEPT_OVERRIDE_CONFLICT"));
});

test("Layer 2 cannot reshape Layer 3 metrology records", () => {
  const c = entity("L2-BAD", "Layer2Concept", "L2", {
    concept_kind: "illegal", lifecycle: "active", definition_version: "1.0.0", rationale: "must be rejected",
    applies_to_entity_types: ["Layer3Metric"], applies_to_relation_types: [], effects: { entities: { add_fields: { mutated: { type: "boolean" } } } }
  });
  const metric = entity("METRIC-1", "Layer3Metric", "L3", { construct_ref: "x", measurand: "y", method_description: "z", output_domain: "numeric", selection_rationale: "why", mutated: true }, ["L2-BAD"]);
  const g = graph({ [c.id]: c, [metric.id]: metric });
  const issues = new SchemaEngine(DEFAULT_REGISTRY).validateEntity(metric, g);
  assert.ok(issues.some(x => x.code === "L3_CANNOT_BE_GOVERNED_BY_LAYER2"));
  assert.ok(new SchemaEngine(DEFAULT_REGISTRY).validateConceptDefinition(c, g).some(x => x.code === "L3_SCHEMA_MUTATION_FORBIDDEN"));
});

test("conditional required fields are enforced only when their declared condition matches", () => {
  const c = concept("L2-COND", {
    effects: { entities: { add_fields: { contact_mode: { type: "string", enum: ["isolated", "contact"] }, barrier_description: { type: "string" }, gene_flow_model: { type: "string" } }, conditional_required_fields: [{ when: { field: "contact_mode", operator: "equals", value: "contact" }, fields: ["gene_flow_model", "barrier_description"] }] } }
  });
  const p = entity("POP-1", "Population", "B", { population_basis: "evolutionary", identity_rule: "x", unit_definition: "y", contact_mode: "contact", gene_flow_model: "limited" }, ["L2-COND"]);
  const g = graph({ [c.id]: c, [p.id]: p });
  const issues = new SchemaEngine(DEFAULT_REGISTRY).validateEntity(p, g);
  assert.ok(issues.some(x => x.code === "CONDITIONAL_REQUIRED_FIELD_MISSING" && x.path === "properties.barrier_description"));
});
