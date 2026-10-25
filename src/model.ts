export type Axis = "B" | "M" | "W" | "L2" | "L3";
export type LifecycleStatus = "draft" | "active" | "deprecated" | "tombstoned";
export type EpistemicStatus = "proposed" | "supported" | "contested" | "rejected" | "superseded" | "undetermined" | "stipulated";
export type FieldType = "string" | "number" | "integer" | "boolean" | "object" | "array" | "reference" | "reference_list" | "string_list" | "any";

export interface FieldSpec {
  type: FieldType;
  description?: string;
  required?: boolean;
  nullable?: boolean;
  enum?: unknown[];
  ref_types?: string[];
  items?: FieldSpec;
  properties?: Record<string, FieldSpec>;
  additional_properties?: boolean;
  min?: number;
  max?: number;
  min_items?: number;
  max_items?: number;
  unique_items?: boolean;
  pattern?: string;
}

export type ConstraintOperator =
  | "equals" | "not_equals" | "in" | "not_in" | "exists" | "not_exists"
  | "min" | "max" | "requires_field" | "forbids_field";

export interface FieldConstraint {
  field: string;
  operator: ConstraintOperator;
  value?: unknown;
  when?: { field: string; operator: "equals" | "not_equals" | "in" | "exists"; value?: unknown };
  message?: string;
}

export interface RequiredRelationRule {
  relation_type: string;
  direction: "outgoing" | "incoming" | "either";
  min_count?: number;
  max_count?: number;
  target_types?: string[];
}

export interface RelationTypeSpec {
  id: string;
  description: string;
  from_types: string[];
  to_types: string[];
  symmetric?: boolean;
  transitive?: boolean;
  allow_self_loop?: boolean;
  properties: Record<string, FieldSpec>;
  required_properties?: string[];
  system?: boolean;
}

export interface EntityTypeSpec {
  id: string;
  axis: Axis;
  description: string;
  fields: Record<string, FieldSpec>;
  immutable_fields?: string[];
  allow_extra_fields?: boolean;
  allowed_outgoing_relations?: string[] | "*";
  allowed_incoming_relations?: string[] | "*";
  system?: boolean;
}

export interface CoreRegistry {
  registry_format_version: string;
  bundled_registry_version: string;
  entity_types: Record<string, EntityTypeSpec>;
  relation_types: Record<string, RelationTypeSpec>;
  metadata: {
    description: string;
    upgrade_policy: "additive-preserve-conflicts";
    last_merged_bundle_version?: string;
  };
}

export interface Layer2Effects {
  entities?: {
    add_fields?: Record<string, FieldSpec>;
    override_fields?: Record<string, FieldSpec>;
    remove_fields?: string[];
    required_fields?: string[];
    forbidden_fields?: string[];
    constraints?: FieldConstraint[];
    allow_outgoing_relations?: string[];
    restrict_outgoing_relations?: string[];
    deny_outgoing_relations?: string[];
    allow_incoming_relations?: string[];
    restrict_incoming_relations?: string[];
    deny_incoming_relations?: string[];
    conditional_required_fields?: Array<{ when: NonNullable<FieldConstraint["when"]>; fields: string[] }>;
    conditional_forbidden_fields?: Array<{ when: NonNullable<FieldConstraint["when"]>; fields: string[] }>;
    required_relations?: RequiredRelationRule[];
  };
  relations?: {
    add_property_fields?: Record<string, FieldSpec>;
    override_property_fields?: Record<string, FieldSpec>;
    remove_property_fields?: string[];
    required_property_fields?: string[];
    forbidden_property_fields?: string[];
    constraints?: FieldConstraint[];
    conditional_required_property_fields?: Array<{ when: NonNullable<FieldConstraint["when"]>; fields: string[] }>;
    conditional_forbidden_property_fields?: Array<{ when: NonNullable<FieldConstraint["when"]>; fields: string[] }>;
  };
  add_relation_types?: RelationTypeSpec[];
  remove_relation_types?: string[];
}

export interface Layer2ConceptProperties {
  concept_kind: string;
  lifecycle: "draft" | "active" | "deprecated";
  applies_to_entity_types?: string[];
  applies_to_relation_types?: string[];
  extends_concept_ids?: string[];
  requires_concept_ids?: string[];
  excludes_concept_ids?: string[];
  effects: Layer2Effects;
  applicability?: {
    description?: string;
    required_property_values?: Record<string, unknown>;
  };
  rationale?: string;
  definition_version?: string;
}

export interface EntityRecord {
  id: string;
  entity_type: string;
  axis: Axis;
  label: string;
  revision: number;
  status: LifecycleStatus;
  concept_bindings: string[];
  properties: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  tombstoned_at?: string;
  extension_data?: Record<string, unknown>;
}

export interface RelationRecord {
  id: string;
  relation_type: string;
  from: string;
  to: string;
  revision: number;
  status: LifecycleStatus;
  concept_bindings: string[];
  properties: Record<string, unknown>;
  assertion?: {
    epistemic_status?: EpistemicStatus;
    definition_refs?: string[];
    evidence_refs?: string[];
    source_refs?: string[];
    scope?: { temporal_interval_ref?: string; spatial_scope_ref?: string; resolution_level?: string; [key: string]: unknown };
    confidence?: { kind: "probability" | "qualitative" | "model_score" | "expert_assessment"; value: unknown; method_ref?: string };
  };
  created_at: string;
  updated_at: string;
  tombstoned_at?: string;
}

export interface GraphDocument {
  graph_format_version: string;
  graph_id: string;
  generation: number;
  metadata: {
    title: string;
    created_at: string;
    updated_at: string;
    plugin_version: string;
    notes?: string[];
  };
  entities: Record<string, EntityRecord>;
  relations: Record<string, RelationRecord>;
  extension_data?: Record<string, unknown>;
}

export interface ValidationIssue {
  code: string;
  severity: "error" | "warning" | "info";
  message: string;
  target_id?: string;
  path?: string;
  details?: Record<string, unknown>;
}

export interface ValidationReport {
  ok: boolean;
  generation: number;
  checked_entities: number;
  checked_relations: number;
  errors: number;
  warnings: number;
  issues: ValidationIssue[];
}

export interface EntityQuery {
  entity_type?: string;
  axis?: Axis;
  status?: LifecycleStatus;
  concept_binding?: string;
  label_contains?: string;
  property_equals?: Record<string, unknown>;
  limit?: number;
  offset?: number;
}

export interface TraversalQuery {
  start_id: string;
  direction?: "outgoing" | "incoming" | "both";
  relation_types?: string[];
  max_depth?: number;
  include_start?: boolean;
  include_tombstoned?: boolean;
  max_nodes?: number;
}

export interface ApiMutationOptions {
  expected_revision?: number;
  allow_draft?: boolean;
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function nowIso(): string {
  return new Date().toISOString();
}
