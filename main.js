var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/main.ts
var main_exports = {};
__export(main_exports, {
  HOLOTAXON_VIEW_TYPE: () => HOLOTAXON_VIEW_TYPE,
  default: () => HoloTaxonPlugin
});
module.exports = __toCommonJS(main_exports);
var import_obsidian2 = require("obsidian");

// src/default-registry.ts
var f = (type, options = {}) => ({ type, ...options });
var fields = (items) => items;
var entityTypes = {
  OrganismalUnit: {
    id: "OrganismalUnit",
    axis: "B",
    description: "An organismal individual under an explicit individuality convention.",
    fields: fields({
      individuality_basis: f("string", { required: true }),
      organismal_unit_kind: f("string", { required: true }),
      reproduction_mode: f("string"),
      life_state: f("string", { enum: ["alive", "dead", "dormant", "unknown", "not_applicable"] }),
      origin_interval_ref: f("reference", { ref_types: ["TemporalInterval"] }),
      end_interval_ref: f("reference", { ref_types: ["TemporalInterval"] }),
      source_assertion_refs: f("string_list", { unique_items: true })
    }),
    allowed_outgoing_relations: ["MEMBER_OF_POPULATION", "INCLUDED_IN_SAMPLE", "HAS_OCCURRENCE", "PARTICIPATES_IN_EVENT", "HAS_MEASUREMENT"],
    allowed_incoming_relations: ["IDENTIFICATION_TARGET", "PARTICIPANT_IN_EVENT", "OCCURRENCE_SUBJECT"]
  },
  Population: {
    id: "Population",
    axis: "B",
    description: "A delimited biological collective under a declared population definition and identity rule.",
    fields: fields({
      population_basis: f("string", { required: true }),
      identity_rule: f("string", { required: true }),
      unit_definition: f("string", { required: true }),
      spatial_scope_ref: f("reference", { ref_types: ["Place"] }),
      temporal_scope_ref: f("reference", { ref_types: ["TemporalInterval"] }),
      ecological_membership_rule: f("string"),
      sampling_frame_notes: f("string"),
      population_definition_ref: f("reference", { ref_types: ["Layer2Concept"] })
    }),
    allowed_outgoing_relations: ["HAS_POPULATION_STATE", "SAMPLED_FROM_REGION", "MEMBER_OF_TAXON", "ANCESTRAL_TO_POPULATION", "CONNECTED_TO_POPULATION", "PARTICIPATES_IN_EVENT", "HAS_OCCURRENCE", "HAS_MEASUREMENT", "GENE_FLOW_WITH"],
    allowed_incoming_relations: ["MEMBER_OF_POPULATION", "SAMPLED_FROM", "POPULATION_STATE_OF", "ANCESTRAL_POPULATION_OF", "CONNECTED_TO_POPULATION", "GENE_FLOW_WITH", "IDENTIFICATION_TARGET"]
  },
  PopulationState: {
    id: "PopulationState",
    axis: "B",
    description: "A time-scoped state of a persistent population entity.",
    fields: fields({
      population_ref: f("reference", { required: true, ref_types: ["Population"] }),
      temporal_interval_ref: f("reference", { required: true, ref_types: ["TemporalInterval"] }),
      estimated_abundance: f("number", { min: 0 }),
      abundance_uncertainty_ref: f("reference", { ref_types: ["UncertaintyModel"] }),
      state_summary: f("string"),
      state_assertion_status: f("string", { enum: ["observed", "inferred", "stipulated", "contested", "unknown"] })
    }),
    allowed_outgoing_relations: ["POPULATION_STATE_OF", "OCCURS_IN_REGION", "HAS_MEASUREMENT", "OVERLAPS_IN_TIME"],
    allowed_incoming_relations: ["HAS_POPULATION_STATE", "MEASUREMENT_TARGET"]
  },
  BiologicalSample: {
    id: "BiologicalSample",
    axis: "B",
    description: "Biological material or selected organismal units collected under a stated sampling design.",
    fields: fields({
      sample_kind: f("string", { required: true }),
      target_universe_ref: f("reference"),
      sampling_design_ref: f("reference", { ref_types: ["Layer2Concept"] }),
      sampling_event_ref: f("reference", { ref_types: ["SamplingEvent"] }),
      collection_interval_ref: f("reference", { ref_types: ["TemporalInterval"] }),
      material_description: f("string"),
      intended_inference: f("string"),
      coverage_summary: f("string"),
      missingness_summary: f("string")
    }),
    allowed_outgoing_relations: ["SAMPLED_FROM", "INCLUDES_MATERIAL", "INCLUDES_ORGANISM", "COLLECTED_DURING", "HAS_MEASUREMENT"],
    allowed_incoming_relations: ["IDENTIFICATION_TARGET", "MEASUREMENT_TARGET"]
  },
  SamplingEvent: {
    id: "SamplingEvent",
    axis: "B",
    description: "An event or process through which biological units, material, or observations are sampled.",
    fields: fields({
      protocol_ref: f("reference", { ref_types: ["Layer2Concept"] }),
      sampling_interval_ref: f("reference", { ref_types: ["TemporalInterval"] }),
      location_ref: f("reference", { ref_types: ["Place"] }),
      selection_rule: f("string", { required: true }),
      collector_ref: f("string"),
      sampling_frame: f("string")
    }),
    allowed_outgoing_relations: ["COLLECTED_DURING", "OCCURS_AT", "GENERATES_SAMPLE"],
    allowed_incoming_relations: ["SAMPLING_EVENT_FOR"]
  },
  OrganismalMaterial: {
    id: "OrganismalMaterial",
    axis: "B",
    description: "Traceable material originating from biological or fossil sources.",
    fields: fields({
      material_kind: f("string", { required: true }),
      provenance_summary: f("string", { required: true }),
      source_organism_ref: f("reference", { ref_types: ["OrganismalUnit"] }),
      source_specimen_ref: f("reference"),
      parent_material_ref: f("reference", { ref_types: ["OrganismalMaterial"] }),
      preservation_state: f("string")
    }),
    allowed_outgoing_relations: ["DERIVED_FROM_MATERIAL", "MATERIAL_FROM_ORGANISM", "INCLUDED_IN_SAMPLE", "HAS_MEASUREMENT"],
    allowed_incoming_relations: ["INCLUDES_MATERIAL", "IDENTIFICATION_TARGET", "MEASUREMENT_TARGET"]
  },
  Lineage: {
    id: "Lineage",
    axis: "B",
    description: "A hypothesized or stipulated evolving historical trajectory.",
    fields: fields({
      lineage_kind: f("string", { required: true }),
      continuity_criterion: f("string", { required: true }),
      origin_event_ref: f("reference", { ref_types: ["BiologicalEvent"] }),
      termination_event_ref: f("reference", { ref_types: ["BiologicalEvent"] }),
      existence_interval_ref: f("reference", { ref_types: ["TemporalInterval"] }),
      hypothesis_status: f("string", { enum: ["proposed", "supported", "contested", "stipulated", "rejected", "undetermined"] }),
      lineage_notes: f("string")
    }),
    allowed_outgoing_relations: ["DESCENDED_FROM", "SISTER_TO", "PARENTAL_CONTRIBUTION_TO", "GENERATED_BY_EVENT", "HAS_OCCURRENCE", "HAS_MEASUREMENT", "GENE_FLOW_WITH", "MEMBER_OF_TAXON"],
    allowed_incoming_relations: ["DESCENDED_FROM", "SISTER_TO", "GENERATES_LINEAGE", "PARENTAL_CONTRIBUTION_TO", "MEMBER_OF_TAXON", "IDENTIFICATION_TARGET", "GENE_FLOW_WITH"]
  },
  BiologicalEvent: {
    id: "BiologicalEvent",
    axis: "B",
    description: "A biological occurrence affecting entities or their history.",
    fields: fields({
      event_kind: f("string", { required: true }),
      temporal_interval_ref: f("reference", { ref_types: ["TemporalInterval"] }),
      place_ref: f("reference", { ref_types: ["Place"] }),
      event_status: f("string", { enum: ["observed", "inferred", "proposed", "contested", "stipulated", "rejected"] }),
      event_model_ref: f("reference", { ref_types: ["Layer2Concept"] }),
      description: f("string")
    }),
    allowed_outgoing_relations: ["GENERATES_LINEAGE", "PARTICIPANT_IN_EVENT", "PARENTAL_CONTRIBUTION_TO", "OCCURS_AT", "OCCURS_DURING", "PRODUCES_TRACE"],
    allowed_incoming_relations: ["PARTICIPATES_IN_EVENT", "GENERATED_BY_EVENT", "CAUSES_EVENT"]
  },
  TaxonConcept: {
    id: "TaxonConcept",
    axis: "M",
    description: "A taxonomic circumscription under a defined treatment, rank, and classification context.",
    fields: fields({
      treatment_ref: f("reference", { required: true, ref_types: ["TaxonomicTreatment"] }),
      classification_scheme_ref: f("reference", { required: true, ref_types: ["ClassificationScheme"] }),
      rank_id: f("string", { required: true }),
      circumscription_mode: f("string", { required: true, enum: ["extensional", "intensional", "historical_reference", "phylogenetic_rule", "operational_attribution", "mixed"] }),
      circumscription_rule: f("string"),
      lineage_refs: f("reference_list", { ref_types: ["Lineage"], unique_items: true }),
      concept_status: f("string", { enum: ["accepted", "provisional", "contested", "excluded", "superseded", "unresolved"] })
    }),
    allowed_outgoing_relations: ["CLASSIFIED_UNDER", "CONGRUENT_WITH_CLADE", "USES_NAME", "CIRCUMSCRIBES", "HAS_RANK_ASSIGNMENT", "TAXON_SPLIT_FROM", "TAXON_MERGED_FROM"],
    allowed_incoming_relations: ["CLASSIFIED_UNDER", "IDENTIFIED_AS", "TAXON_SPLIT_FROM", "TAXON_MERGED_FROM", "CIRCUMSCRIBES"]
  },
  TaxonomicName: {
    id: "TaxonomicName",
    axis: "M",
    description: "A nomenclatural name object, distinct from particular name usages and taxon concepts.",
    fields: fields({
      name_string: f("string", { required: true }),
      name_kind: f("string", { required: true }),
      authorship: f("string"),
      nomenclatural_code_or_convention: f("string"),
      name_status: f("string", { enum: ["established", "unavailable", "invalid_or_illegitimate", "unassessed", "not_applicable"] })
    }),
    allowed_outgoing_relations: ["HAS_NAME_USAGE"],
    allowed_incoming_relations: ["NAME_USAGE_OF", "SYNONYM_OF"]
  },
  NameUsage: {
    id: "NameUsage",
    axis: "M",
    description: "A particular source- or treatment-scoped application of a taxonomic name.",
    fields: fields({
      taxonomic_name_ref: f("reference", { required: true, ref_types: ["TaxonomicName"] }),
      according_to_ref: f("reference", { required: true, ref_types: ["TaxonomicTreatment"] }),
      usage_context: f("string", { required: true }),
      application_status: f("string", { enum: ["accepted", "synonym", "misapplied", "uncertain", "historical"] })
    }),
    allowed_outgoing_relations: ["NAME_USAGE_OF", "REFERS_TO_CONCEPT"],
    allowed_incoming_relations: ["HAS_NAME_USAGE"]
  },
  ClassificationScheme: {
    id: "ClassificationScheme",
    axis: "M",
    description: "A defined taxonomic classification system and its versioned conventions.",
    fields: fields({
      version_label: f("string", { required: true }),
      rank_system_ref: f("reference", { ref_types: ["Layer2Concept"] }),
      placement_policy_ref: f("reference", { ref_types: ["Layer2Concept"] }),
      effective_interval_ref: f("reference", { ref_types: ["TemporalInterval"] }),
      scheme_status: f("string", { enum: ["draft", "active", "historical", "superseded"] })
    }),
    allowed_outgoing_relations: ["GOVERNS_TREATMENT"],
    allowed_incoming_relations: ["CLASSIFICATION_OF"]
  },
  TaxonomicTreatment: {
    id: "TaxonomicTreatment",
    axis: "M",
    description: "A versioned authority or work defining, adopting, revising, or disputing taxon concepts.",
    fields: fields({
      classification_scheme_ref: f("reference", { required: true, ref_types: ["ClassificationScheme"] }),
      treatment_version: f("string", { required: true }),
      authority_label: f("string"),
      source_refs: f("string_list", { unique_items: true }),
      effective_interval_ref: f("reference", { ref_types: ["TemporalInterval"] }),
      treatment_status: f("string", { enum: ["draft", "active", "historical", "superseded"] })
    }),
    allowed_outgoing_relations: ["GOVERNS_TREATMENT", "USES_NAME"],
    allowed_incoming_relations: ["ACCORDING_TO_TREATMENT"]
  },
  TaxonomicIdentification: {
    id: "TaxonomicIdentification",
    axis: "M",
    description: "A versioned identification assertion targeting an organism, sample, specimen, population, occurrence, or other referent.",
    fields: fields({
      identification_method_ref: f("reference", { ref_types: ["Layer2Concept"] }),
      identification_status: f("string", { required: true, enum: ["accepted", "provisional", "contested", "rejected", "unresolved"] }),
      evidence_refs: f("string_list", { unique_items: true }),
      target_semantics: f("string", { required: true, enum: ["individual_identity", "population_membership", "material_attribution", "sample_detection", "lineage_attribution", "occurrence_attribution"] }),
      confidence_ref: f("reference", { ref_types: ["UncertaintyModel"] }),
      notes: f("string")
    }),
    allowed_outgoing_relations: ["IDENTIFIED_AS", "IDENTIFICATION_TARGET"],
    allowed_incoming_relations: []
  },
  SpeciesDelimitationHypothesis: {
    id: "SpeciesDelimitationHypothesis",
    axis: "M",
    description: "A case-specific hypothesis about species boundaries under a named species concept and protocol.",
    fields: fields({
      species_concept_ref: f("reference", { required: true, ref_types: ["Layer2Concept"] }),
      delimitation_protocol_ref: f("reference", { required: true, ref_types: ["Layer2Concept"] }),
      target_refs: f("string_list", { required: true, min_items: 1, unique_items: true }),
      candidate_count: f("integer", { min: 1 }),
      result: f("string", { required: true, enum: ["one_species", "multiple_species", "unresolved", "not_applicable"] }),
      evidence_refs: f("string_list", { unique_items: true }),
      alternative_hypothesis_refs: f("string_list", { unique_items: true }),
      adjudication_notes: f("string")
    }),
    allowed_outgoing_relations: ["HYPOTHESIS_TARGET", "SUPPORTED_BY_EVIDENCE", "COMPETES_WITH_HYPOTHESIS"],
    allowed_incoming_relations: ["DECISION_FROM_PROTOCOL"]
  },
  TaxonomicAct: {
    id: "TaxonomicAct",
    axis: "M",
    description: "A documented classification operation, such as naming, splitting, merging, transferring, or synonymizing.",
    fields: fields({
      act_type: f("string", { required: true, enum: ["establish_name", "split", "merge", "transfer", "synonymize", "reclassify", "emend", "reject", "other"] }),
      treatment_ref: f("reference", { required: true, ref_types: ["TaxonomicTreatment"] }),
      justification: f("string", { required: true }),
      effective_interval_ref: f("reference", { ref_types: ["TemporalInterval"] }),
      act_status: f("string", { enum: ["proposed", "accepted", "rejected", "superseded"] })
    }),
    allowed_outgoing_relations: ["TAXON_SPLIT_FROM", "TAXON_MERGED_FROM", "RESULTS_IN_TAXON"],
    allowed_incoming_relations: []
  },
  CladeHypothesis: {
    id: "CladeHypothesis",
    axis: "M",
    description: "A hypothesis of clade membership under a specified phylogenetic hypothesis.",
    fields: fields({
      phylogenetic_hypothesis_ref: f("reference", { required: true, ref_types: ["PhylogeneticHypothesis"] }),
      root_lineage_ref: f("reference", { ref_types: ["Lineage"] }),
      member_refs: f("string_list", { required: true, min_items: 1, unique_items: true }),
      holophyly_result: f("string", { required: true, enum: ["supported", "contradicted", "undetermined", "not_evaluable"] }),
      assessment_protocol_ref: f("reference", { ref_types: ["Layer2Concept"] })
    }),
    allowed_outgoing_relations: ["CONGRUENT_WITH_CLADE", "HYPOTHESIS_TARGET", "SUPPORTED_BY_EVIDENCE"],
    allowed_incoming_relations: []
  },
  PhylogeneticHypothesis: {
    id: "PhylogeneticHypothesis",
    axis: "M",
    description: "A versioned proposition about evolutionary relationships among specified lineages or taxa.",
    fields: fields({
      method_ref: f("reference", { ref_types: ["Layer2Concept"] }),
      target_refs: f("string_list", { required: true, min_items: 1, unique_items: true }),
      rooting: f("string", { enum: ["rooted", "unrooted", "unknown", "not_applicable"] }),
      topology_status: f("string", { enum: ["proposed", "supported", "contested", "rejected", "undetermined"] }),
      evidence_refs: f("string_list", { unique_items: true }),
      reticulation_policy_ref: f("reference", { ref_types: ["Layer2Concept"] })
    }),
    allowed_outgoing_relations: ["HYPOTHESIS_TARGET", "SUPPORTED_BY_EVIDENCE", "COMPETES_WITH_HYPOTHESIS"],
    allowed_incoming_relations: ["CONGRUENT_WITH_CLADE"]
  },
  WorldEntity: {
    id: "WorldEntity",
    axis: "W",
    description: "A nonbiological referent in the fictional world, such as a material resource, structure, or environmental object.",
    fields: fields({
      world_entity_kind: f("string", { required: true }),
      material_or_system: f("string"),
      place_ref: f("reference", { ref_types: ["Place"] }),
      valid_interval_ref: f("reference", { ref_types: ["TemporalInterval"] }),
      provenance_refs: f("string_list", { unique_items: true }),
      description: f("string")
    })
  },
  Place: {
    id: "Place",
    axis: "W",
    description: "A spatial entity or region with a declared geometry and boundary basis.",
    fields: fields({
      place_kind: f("string", { required: true }),
      boundary_basis: f("string", { required: true }),
      geometry_ref: f("string"),
      coordinate_system: f("string"),
      parent_place_ref: f("reference", { ref_types: ["Place"] }),
      valid_interval_ref: f("reference", { ref_types: ["TemporalInterval"] })
    }),
    allowed_outgoing_relations: ["PART_OF_PLACE", "OVERLAPS_SPATIALLY", "HAS_OCCURRENCE", "HAS_HABITAT"],
    allowed_incoming_relations: ["OCCURS_AT", "OCCUPIES_REGION", "EXPOSED_TO", "PART_OF_PLACE"]
  },
  TemporalInterval: {
    id: "TemporalInterval",
    axis: "W",
    description: "An interval in a named temporal coordinate system.",
    fields: fields({
      time_scale_id: f("string", { required: true }),
      coordinate_unit: f("string", { required: true }),
      start_value: f("number"),
      end_value: f("number"),
      start_inclusive: f("boolean"),
      end_inclusive: f("boolean"),
      ordering_convention: f("string", { required: true, enum: ["increasing_forward", "increasing_backward"] }),
      uncertainty_ref: f("reference", { ref_types: ["UncertaintyModel"] }),
      interval_status: f("string", { enum: ["exact", "estimated", "bounded", "open_start", "open_end", "unknown"] })
    }),
    allowed_outgoing_relations: ["OVERLAPS_IN_TIME", "CONTAINS_INTERVAL", "CHRONOSTRATIGRAPHIC_UNIT_OF"],
    allowed_incoming_relations: ["OCCURS_DURING", "OCCUPIES_REGION", "VALID_DURING", "OVERLAPS_IN_TIME", "CONTAINS_INTERVAL"]
  },
  ChronostratigraphicUnit: {
    id: "ChronostratigraphicUnit",
    axis: "W",
    description: "A defined time-stratigraphic unit in a specified stratigraphic scheme.",
    fields: fields({
      unit_name: f("string", { required: true }),
      unit_rank: f("string", { required: true }),
      stratigraphic_scheme_ref: f("reference", { ref_types: ["Layer2Concept"] }),
      boundary_definition: f("string", { required: true }),
      temporal_interval_ref: f("reference", { required: true, ref_types: ["TemporalInterval"] })
    }),
    allowed_outgoing_relations: ["CHRONOSTRATIGRAPHIC_UNIT_OF", "CONTAINS_INTERVAL"],
    allowed_incoming_relations: ["CHRONOSTRATIGRAPHIC_UNIT_OF"]
  },
  Occurrence: {
    id: "Occurrence",
    axis: "W",
    description: "A scoped claim that a referent is present or existed at a place and time.",
    fields: fields({
      subject_ref: f("reference", { required: true }),
      place_ref: f("reference", { required: true, ref_types: ["Place"] }),
      temporal_interval_ref: f("reference", { required: true, ref_types: ["TemporalInterval"] }),
      basis_of_record: f("string", { required: true }),
      identification_ref: f("reference", { ref_types: ["TaxonomicIdentification"] }),
      occurrence_status: f("string", { enum: ["observed", "inferred", "fossil_evidence", "stipulated", "contested"] })
    }),
    allowed_outgoing_relations: ["OCCURRENCE_SUBJECT", "OCCURS_AT", "OCCURS_DURING", "SUPPORTED_BY_EVIDENCE"],
    allowed_incoming_relations: ["HAS_OCCURRENCE", "OCCURRENCE_SUBJECT"]
  },
  EnvironmentalState: {
    id: "EnvironmentalState",
    axis: "W",
    description: "A time- and place-scoped state of relevant environmental variables.",
    fields: fields({
      variables: f("object", { required: true, additional_properties: true }),
      place_ref: f("reference", { ref_types: ["Place"] }),
      temporal_interval_ref: f("reference", { ref_types: ["TemporalInterval"] }),
      measurement_refs: f("string_list", { unique_items: true }),
      model_ref: f("reference", { ref_types: ["Layer2Concept"] })
    }),
    allowed_outgoing_relations: ["EXPOSED_TO", "STATE_AT", "HAS_MEASUREMENT", "MODIFIES_ENVIRONMENT"],
    allowed_incoming_relations: ["EXPOSED_TO", "STATE_AT"]
  },
  NicheModel: {
    id: "NicheModel",
    axis: "W",
    description: "A representation of environmental conditions, resources, constraints, and interactions relevant to a biological entity.",
    fields: fields({
      niche_definition_ref: f("reference", { required: true, ref_types: ["Layer2Concept"] }),
      dimensions: f("object", { required: true, additional_properties: true }),
      scale: f("string", { required: true }),
      target_refs: f("string_list", { unique_items: true }),
      uncertainty_ref: f("reference", { ref_types: ["UncertaintyModel"] })
    }),
    allowed_outgoing_relations: ["NICHE_OF", "OVERLAPS_NICHE", "HAS_MEASUREMENT"],
    allowed_incoming_relations: ["NICHE_OF", "OVERLAPS_NICHE"]
  },
  InteractionEvent: {
    id: "InteractionEvent",
    axis: "W",
    description: "A spatially and temporally scoped interaction involving biological entities and/or their environment.",
    fields: fields({
      interaction_kind: f("string", { required: true }),
      actor_refs: f("string_list", { required: true, min_items: 1, unique_items: true }),
      temporal_interval_ref: f("reference", { ref_types: ["TemporalInterval"] }),
      place_ref: f("reference", { ref_types: ["Place"] }),
      causal_status: f("string", { enum: ["observed", "inferred", "proposed", "contested", "unknown"] }),
      effect_summary: f("string")
    }),
    allowed_outgoing_relations: ["INTERACTS_WITH", "OCCURS_AT", "OCCURS_DURING", "MODIFIES_ENVIRONMENT", "PRODUCES_TRACE", "HAS_MEASUREMENT"],
    allowed_incoming_relations: ["PARTICIPATES_IN_EVENT"]
  },
  BehavioralEvent: {
    id: "BehavioralEvent",
    axis: "W",
    description: "A particular instance of behavior attributable to one or more organismal units or populations.",
    fields: fields({
      actor_refs: f("string_list", { required: true, min_items: 1, unique_items: true }),
      behavioral_pattern_ref: f("reference", { ref_types: ["BehavioralPattern"] }),
      temporal_interval_ref: f("reference", { ref_types: ["TemporalInterval"] }),
      place_ref: f("reference", { ref_types: ["Place"] }),
      observed_action: f("string", { required: true }),
      causal_attribution_status: f("string", { enum: ["unresolved", "individual_innovation", "social_transmission", "genetic_influence", "epigenetic_influence", "environmentally_induced", "mixed", "other"] }),
      observation_refs: f("string_list", { unique_items: true })
    }),
    allowed_outgoing_relations: ["PERFORMED_BY", "PRODUCES_TRACE", "OCCURS_AT", "OCCURS_DURING", "HAS_MEASUREMENT", "SUPPORTED_BY_EVIDENCE"],
    allowed_incoming_relations: ["PRODUCES_TRACE", "PARTICIPATES_IN_EVENT"]
  },
  BehavioralPattern: {
    id: "BehavioralPattern",
    axis: "W",
    description: "A recurring or defined behavioral pattern with a specified population, temporal, and evidentiary scope.",
    fields: fields({
      pattern_definition_ref: f("reference", { required: true, ref_types: ["Layer2Concept"] }),
      operational_signature: f("string", { required: true }),
      transmission_hypothesis_ref: f("reference", { ref_types: ["Layer2Concept"] }),
      persistence_scope: f("string"),
      anomaly_baseline_ref: f("reference", { ref_types: ["Layer2Concept"] })
    }),
    allowed_outgoing_relations: ["INSTANCE_OF_BEHAVIOR", "HAS_MEASUREMENT", "SUPPORTED_BY_EVIDENCE"],
    allowed_incoming_relations: ["BEHAVIORAL_PATTERN_OF"]
  },
  EnvironmentalTrace: {
    id: "EnvironmentalTrace",
    axis: "W",
    description: "A material or informational trace attributed, with a stated confidence, to a biological activity or process.",
    fields: fields({
      trace_kind: f("string", { required: true }),
      origin_event_refs: f("string_list", { unique_items: true }),
      location_ref: f("reference", { ref_types: ["Place"] }),
      formation_interval_ref: f("reference", { ref_types: ["TemporalInterval"] }),
      persistence_interval_ref: f("reference", { ref_types: ["TemporalInterval"] }),
      causal_attribution_status: f("string", { enum: ["observed_association", "inferred", "stipulated", "contested", "unresolved"] }),
      alternative_source_hypotheses: f("string_list", { unique_items: true }),
      material_properties: f("object", { additional_properties: true })
    }),
    allowed_outgoing_relations: ["TRACE_PRODUCED_BY", "PERSISTS_DURING", "OCCURS_AT", "HAS_MEASUREMENT", "SUPPORTED_BY_EVIDENCE"],
    allowed_incoming_relations: ["PRODUCES_TRACE", "TRACE_PRODUCED_BY"]
  },
  EcologicalAnomaly: {
    id: "EcologicalAnomaly",
    axis: "W",
    description: "A measured or inferred departure from an explicit behavioral or ecological baseline model.",
    fields: fields({
      baseline_definition_ref: f("reference", { required: true, ref_types: ["Layer2Concept"] }),
      target_refs: f("string_list", { required: true, min_items: 1, unique_items: true }),
      departure_measurand: f("string", { required: true }),
      result_refs: f("string_list", { required: true, min_items: 1, unique_items: true }),
      alternative_explanations: f("string_list", { unique_items: true }),
      anomaly_status: f("string", { enum: ["detected", "supported", "contested", "not_reproduced", "unresolved"] })
    }),
    allowed_outgoing_relations: ["DEVIATES_FROM_BASELINE", "HAS_MEASUREMENT", "SUPPORTED_BY_EVIDENCE", "COMPETING_EXPLANATION"],
    allowed_incoming_relations: ["IDENTIFICATION_TARGET"]
  },
  Layer2Concept: {
    id: "Layer2Concept",
    axis: "L2",
    description: "An executable concept/definition whose declared effects actively shape applicable Layer 1 entity or relationship schemas.",
    fields: fields({
      concept_kind: f("string", { required: true }),
      lifecycle: f("string", { required: true, enum: ["draft", "active", "deprecated"] }),
      applies_to_entity_types: f("string_list", { unique_items: true }),
      applies_to_relation_types: f("string_list", { unique_items: true }),
      extends_concept_ids: f("string_list", { unique_items: true }),
      requires_concept_ids: f("string_list", { unique_items: true }),
      excludes_concept_ids: f("string_list", { unique_items: true }),
      effects: f("object", { required: true, additional_properties: true }),
      applicability: f("object", { additional_properties: true }),
      rationale: f("string", { required: true }),
      definition_version: f("string", { required: true })
    }),
    allowed_outgoing_relations: ["EXTENDS_CONCEPT", "REQUIRES_CONCEPT", "EXCLUDES_CONCEPT", "GOVERNS_ENTITY_TYPE", "GOVERNS_RELATION_TYPE"],
    allowed_incoming_relations: ["DEFINED_BY", "EXTENDS_CONCEPT", "REQUIRES_CONCEPT", "EXCLUDES_CONCEPT"]
  },
  Layer3Metric: {
    id: "Layer3Metric",
    axis: "L3",
    description: "A metric specification that measures or operationalizes a construct without changing the schema of the measured entity.",
    fields: fields({
      construct_ref: f("string", { required: true }),
      measurand: f("string", { required: true }),
      method_description: f("string", { required: true }),
      output_domain: f("string", { required: true }),
      unit_id: f("string"),
      assumptions: f("string_list", { unique_items: true }),
      selection_rationale: f("string", { required: true }),
      applicable_entity_types: f("string_list", { unique_items: true })
    }),
    allowed_outgoing_relations: ["METRIC_MEASURES", "METRIC_DEFINED_BY", "METRIC_USES_UNCERTAINTY_MODEL"],
    allowed_incoming_relations: ["METRIC_SELECTED_FOR"]
  },
  MeasurementEvent: {
    id: "MeasurementEvent",
    axis: "L3",
    description: "A particular application of a measurement protocol to a target.",
    fields: fields({
      metric_ref: f("reference", { required: true, ref_types: ["Layer3Metric"] }),
      protocol_description: f("string", { required: true }),
      target_refs: f("string_list", { required: true, min_items: 1, unique_items: true }),
      sampling_design_ref: f("reference", { ref_types: ["Layer2Concept"] }),
      temporal_interval_ref: f("reference", { ref_types: ["TemporalInterval"] }),
      performed_at: f("string"),
      quality_status: f("string", { enum: ["valid", "usable_with_limitations", "invalid", "not_assessed"] })
    }),
    allowed_outgoing_relations: ["MEASUREMENT_TARGET", "MEASUREMENT_USES_METRIC", "RESULT_OF_MEASUREMENT", "HAS_UNCERTAINTY", "SUPPORTED_BY_EVIDENCE"],
    allowed_incoming_relations: ["HAS_MEASUREMENT"]
  },
  MeasurementResult: {
    id: "MeasurementResult",
    axis: "L3",
    description: "A value, estimate, distribution, category, or other output produced by a measurement event.",
    fields: fields({
      measurement_event_ref: f("reference", { required: true, ref_types: ["MeasurementEvent"] }),
      value: f("any", { required: true }),
      unit_id: f("string"),
      uncertainty_ref: f("reference", { ref_types: ["UncertaintyModel"] }),
      data_quality_notes: f("string"),
      result_status: f("string", { enum: ["provisional", "accepted", "contested", "invalid", "superseded"] })
    }),
    allowed_outgoing_relations: ["RESULT_OF_MEASUREMENT", "HAS_UNCERTAINTY", "SUPPORTS_CLAIM", "CONTRADICTS_CLAIM"],
    allowed_incoming_relations: ["RESULT_OF_MEASUREMENT"]
  },
  UncertaintyModel: {
    id: "UncertaintyModel",
    axis: "L3",
    description: "A declared model for measurement, parameter, temporal, epistemic, or model uncertainty.",
    fields: fields({
      uncertainty_kind: f("string", { required: true }),
      representation: f("string", { required: true }),
      method_description: f("string", { required: true }),
      assumptions: f("string_list", { unique_items: true }),
      scope: f("string")
    }),
    allowed_outgoing_relations: ["UNCERTAINTY_OF"],
    allowed_incoming_relations: ["HAS_UNCERTAINTY", "METRIC_USES_UNCERTAINTY_MODEL"]
  },
  EvidenceEvaluation: {
    id: "EvidenceEvaluation",
    axis: "L3",
    description: "An evaluation of evidence in relation to a specified claim and decision context.",
    fields: fields({
      target_assertion_ref: f("string", { required: true }),
      evidence_refs: f("string_list", { required: true, min_items: 1, unique_items: true }),
      evaluation_protocol_ref: f("reference", { ref_types: ["Layer2Concept"] }),
      relevance: f("string", { required: true }),
      limitations: f("string_list", { unique_items: true }),
      outcome: f("string", { required: true, enum: ["supports", "weakens", "contradicts", "inconclusive", "not_relevant"] })
    }),
    allowed_outgoing_relations: ["SUPPORTS_CLAIM", "CONTRADICTS_CLAIM"],
    allowed_incoming_relations: ["SUPPORTED_BY_EVIDENCE"]
  }
};
var relationTypes = {};
var addRelation = (id, from_types, to_types, description, options = {}) => {
  relationTypes[id] = { id, from_types, to_types, description, properties: {}, allow_self_loop: false, ...options };
};
addRelation("MEMBER_OF_POPULATION", ["OrganismalUnit"], ["Population"], "Organism belongs to population for scoped time and membership rule.", { properties: { temporal_interval_ref: f("reference", { ref_types: ["TemporalInterval"] }), membership_rule_ref: f("reference", { ref_types: ["Layer2Concept"] }) } });
addRelation("INCLUDED_IN_SAMPLE", ["OrganismalUnit", "OrganismalMaterial"], ["BiologicalSample"], "Unit or material was included in a sample.");
addRelation("SAMPLED_FROM", ["BiologicalSample"], ["Population", "PopulationState", "Place"], "Sample was drawn from or attributed to a specified target.", { properties: { sampling_event_ref: f("reference", { ref_types: ["SamplingEvent"] }), inclusion_rule: f("string") } });
addRelation("HAS_POPULATION_STATE", ["Population"], ["PopulationState"], "Population has a time-indexed state.");
addRelation("POPULATION_STATE_OF", ["PopulationState"], ["Population"], "State refers to a population.");
addRelation("DESCENDED_FROM", ["Lineage"], ["Lineage"], "Directed evolutionary descent assertion.", { properties: { temporal_scope_ref: f("reference", { ref_types: ["TemporalInterval"] }), hypothesis_ref: f("reference", { ref_types: ["PhylogeneticHypothesis"] }), epistemic_status: f("string") } });
addRelation("SISTER_TO", ["Lineage", "CladeHypothesis"], ["Lineage", "CladeHypothesis"], "Symmetric sister relationship under a specified phylogenetic hypothesis.", { symmetric: true, properties: { phylogenetic_hypothesis_ref: f("reference", { required: true, ref_types: ["PhylogeneticHypothesis"] }) } });
addRelation("PARENTAL_CONTRIBUTION_TO", ["Lineage", "Population", "OrganismalUnit"], ["BiologicalEvent", "Lineage", "Population", "OrganismalUnit"], "Parental or ancestral contribution to an event or hybrid-derived entity.", { properties: { contribution_mode: f("string"), contribution_estimate: f("number", { min: 0, max: 1 }), scope: f("string") } });
addRelation("GENERATES_LINEAGE", ["BiologicalEvent"], ["Lineage"], "Event generates or establishes a lineage.");
addRelation("GENERATED_BY_EVENT", ["Lineage"], ["BiologicalEvent"], "Lineage is attributed to a generating event.");
addRelation("GENE_FLOW_WITH", ["Population", "Lineage"], ["Population", "Lineage"], "Gene-flow assertion between populations or lineages.", { properties: { temporal_interval_ref: f("reference", { ref_types: ["TemporalInterval"] }), directionality: f("string", { enum: ["a_to_b", "b_to_a", "bidirectional", "unknown"] }), estimate_ref: f("string"), genomic_scope: f("string") } });
addRelation("CLASSIFIED_UNDER", ["TaxonConcept"], ["TaxonConcept"], "Taxonomic placement in a specific scheme or treatment.", { properties: { scheme_ref: f("reference", { required: true, ref_types: ["ClassificationScheme"] }), treatment_ref: f("reference", { ref_types: ["TaxonomicTreatment"] }), placement_status: f("string") } });
addRelation("IDENTIFIED_AS", ["TaxonomicIdentification"], ["TaxonConcept"], "Identification result attributes target to a taxon concept.", { properties: { treatment_ref: f("reference", { ref_types: ["TaxonomicTreatment"] }), epistemic_status: f("string") } });
addRelation("IDENTIFICATION_TARGET", ["TaxonomicIdentification"], ["OrganismalUnit", "Population", "BiologicalSample", "OrganismalMaterial", "Occurrence", "Lineage"], "Target of a taxonomic identification.");
addRelation("CIRCUMSCRIBES", ["TaxonConcept"], ["OrganismalUnit", "Population", "Lineage", "TaxonConcept"], "Taxon concept circumscribes biological referents or subordinate concepts.", { properties: { membership_mode: f("string", { required: true, enum: ["explicit_member", "rule_based", "inferred_member", "historical_reference"] }), scope_ref: f("string") } });
addRelation("USES_NAME", ["TaxonConcept", "TaxonomicTreatment"], ["TaxonomicName", "NameUsage"], "Taxonomic concept or treatment uses a formal name.");
addRelation("HAS_NAME_USAGE", ["TaxonomicName"], ["NameUsage"], "Name has a recorded usage.");
addRelation("NAME_USAGE_OF", ["NameUsage"], ["TaxonomicName"], "Name usage references a name object.");
addRelation("REFERS_TO_CONCEPT", ["NameUsage"], ["TaxonConcept"], "Name usage refers to a taxon concept in its context.");
addRelation("TAXON_SPLIT_FROM", ["TaxonConcept", "TaxonomicAct"], ["TaxonConcept"], "Taxonomic split relationship.");
addRelation("TAXON_MERGED_FROM", ["TaxonConcept", "TaxonomicAct"], ["TaxonConcept"], "Taxonomic merge relationship.");
addRelation("CONGRUENT_WITH_CLADE", ["TaxonConcept", "CladeHypothesis"], ["CladeHypothesis", "TaxonConcept"], "Taxon concept corresponds to a clade hypothesis to a declared degree.", { symmetric: true, properties: { congruence: f("string", { required: true, enum: ["exact", "approximate", "partial", "contradicted", "unresolved"] }) } });
addRelation("OCCURS_AT", ["Occurrence", "Place", "Population", "PopulationState", "BiologicalEvent", "BehavioralEvent", "EnvironmentalTrace"], ["Place"], "Spatial occurrence relation.");
addRelation("OCCURS_DURING", ["Occurrence", "BiologicalEvent", "BehavioralEvent", "InteractionEvent", "EnvironmentalTrace"], ["TemporalInterval"], "Temporal occurrence relation.");
addRelation("OVERLAPS_IN_TIME", ["TemporalInterval", "Population", "PopulationState", "Lineage", "Occurrence"], ["TemporalInterval", "Population", "PopulationState", "Lineage", "Occurrence"], "Temporal overlap assertion.", { symmetric: true, properties: { overlap_basis: f("string") } });
addRelation("PART_OF_PLACE", ["Place"], ["Place"], "Spatial containment or part relation.");
addRelation("OCCURRENCE_SUBJECT", ["Occurrence"], ["OrganismalUnit", "Population", "Lineage", "TaxonConcept", "OrganismalMaterial"], "Referent of an occurrence record.");
addRelation("HAS_OCCURRENCE", ["OrganismalUnit", "Population", "Lineage", "TaxonConcept", "EnvironmentalTrace"], ["Occurrence"], "Referent has an occurrence record.");
addRelation("EXPOSED_TO", ["OrganismalUnit", "Population", "PopulationState", "Lineage", "Place"], ["EnvironmentalState"], "Entity is exposed to a temporal/spatial environmental state.");
addRelation("INTERACTS_WITH", ["InteractionEvent"], ["OrganismalUnit", "Population", "Lineage", "WorldEntity", "EnvironmentalState"], "Interaction event involves a referent.");
addRelation("PRODUCES_TRACE", ["BehavioralEvent", "InteractionEvent", "BiologicalEvent", "OrganismalUnit", "Population"], ["EnvironmentalTrace"], "Biological or behavioral activity produces a trace.");
addRelation("TRACE_PRODUCED_BY", ["EnvironmentalTrace"], ["BehavioralEvent", "InteractionEvent", "BiologicalEvent", "OrganismalUnit", "Population"], "Trace is attributed to a producer or event.");
addRelation("PERSISTS_DURING", ["EnvironmentalTrace"], ["TemporalInterval"], "Trace persists during a temporal interval.");
addRelation("NICHE_OF", ["NicheModel"], ["OrganismalUnit", "Population", "Lineage", "TaxonConcept"], "Niche model describes a biological referent.");
addRelation("OVERLAPS_NICHE", ["NicheModel"], ["NicheModel"], "Niche models overlap under a specified metric.", { symmetric: true, properties: { metric_ref: f("reference", { ref_types: ["Layer3Metric"] }), overlap_result_ref: f("reference", { ref_types: ["MeasurementResult"] }) } });
addRelation("HAS_MEASUREMENT", ["OrganismalUnit", "Population", "PopulationState", "BiologicalSample", "Lineage", "Place", "EnvironmentalState", "NicheModel", "BehavioralEvent", "EnvironmentalTrace"], ["MeasurementEvent"], "Referent has an associated measurement event.");
addRelation("MEASUREMENT_TARGET", ["MeasurementEvent"], ["OrganismalUnit", "Population", "PopulationState", "BiologicalSample", "Lineage", "Place", "EnvironmentalState", "NicheModel", "BehavioralEvent", "EnvironmentalTrace", "TaxonConcept"], "Target of a measurement event.");
addRelation("MEASUREMENT_USES_METRIC", ["MeasurementEvent"], ["Layer3Metric"], "Measurement event uses a metric.");
addRelation("RESULT_OF_MEASUREMENT", ["MeasurementResult"], ["MeasurementEvent"], "Measurement result was produced by an event.");
addRelation("HAS_UNCERTAINTY", ["MeasurementEvent", "MeasurementResult", "TemporalInterval", "Occurrence", "NicheModel"], ["UncertaintyModel"], "Entity's relevant uncertainty is represented by a model.");
addRelation("SUPPORTS_CLAIM", ["MeasurementResult", "EvidenceEvaluation", "Occurrence", "EnvironmentalTrace"], ["TaxonomicIdentification", "SpeciesDelimitationHypothesis", "CladeHypothesis", "PhylogeneticHypothesis", "TaxonomicAct", "EcologicalAnomaly"], "Evidence or measurement supports a claim.");
addRelation("CONTRADICTS_CLAIM", ["MeasurementResult", "EvidenceEvaluation"], ["TaxonomicIdentification", "SpeciesDelimitationHypothesis", "CladeHypothesis", "PhylogeneticHypothesis", "TaxonomicAct", "EcologicalAnomaly"], "Evidence or measurement contradicts a claim.");
addRelation("EXTENDS_CONCEPT", ["Layer2Concept"], ["Layer2Concept"], "Layer 2 concept inherits schema effects and requirements from another concept.");
addRelation("REQUIRES_CONCEPT", ["Layer2Concept"], ["Layer2Concept"], "Layer 2 concept requires another concept to be bound/active.");
addRelation("EXCLUDES_CONCEPT", ["Layer2Concept"], ["Layer2Concept"], "Layer 2 concepts cannot be active together under this definition.");
addRelation("GOVERNS_ENTITY_TYPE", ["Layer2Concept"], ["Layer2Concept"], "Concept effect applies to an entity type declared by the registry.");
addRelation("GOVERNS_RELATION_TYPE", ["Layer2Concept"], ["Layer2Concept"], "Concept effect applies to a relationship type declared by the registry or active extension.");
addRelation("METRIC_MEASURES", ["Layer3Metric"], ["OrganismalUnit", "Population", "PopulationState", "Lineage", "TaxonConcept", "EnvironmentalState", "BehavioralPattern", "EnvironmentalTrace"], "Metric declares its intended measurement targets.");
addRelation("METRIC_DEFINED_BY", ["Layer3Metric"], ["Layer2Concept"], "Metric is operationalized by a definition or protocol.");
addRelation("METRIC_USES_UNCERTAINTY_MODEL", ["Layer3Metric"], ["UncertaintyModel"], "Metric references an uncertainty model.");
for (const entityType of Object.values(entityTypes)) {
  entityType.allowed_outgoing_relations = Object.values(relationTypes).filter((rel) => rel.from_types.includes(entityType.id) || rel.from_types.includes("*")).map((rel) => rel.id);
  entityType.allowed_incoming_relations = Object.values(relationTypes).filter((rel) => rel.to_types.includes(entityType.id) || rel.to_types.includes("*")).map((rel) => rel.id);
}
var DEFAULT_REGISTRY = {
  registry_format_version: "1.0.0",
  bundled_registry_version: "0.1.0",
  entity_types: entityTypes,
  relation_types: relationTypes,
  metadata: {
    description: "HoloTaxon core registry. Layer 2 concept instances in the graph can actively modify applicable entity and relation schemas. Layer 3 entities are observational/metrological only.",
    upgrade_policy: "additive-preserve-conflicts"
  }
};

// src/model.ts
function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function nowIso() {
  return (/* @__PURE__ */ new Date()).toISOString();
}

// src/schema-engine.ts
var issue = (code, message, target_id, path, severity = "error", details) => ({ code, message, target_id, path, severity, details });
var sameJson = (a, b) => JSON.stringify(a) === JSON.stringify(b);
var pathValue = (data, path) => path.split(".").reduce((cur, part) => isRecord(cur) ? cur[part] : void 0, data);
var hasPath = (data, path) => path.split(".").every((part, index, parts) => {
  let cur = data;
  for (let i = 0; i <= index; i++) cur = isRecord(cur) ? cur[parts[i]] : void 0;
  return cur !== void 0;
});
function validCondition(properties, condition) {
  const value = pathValue(properties, condition.field);
  switch (condition.operator) {
    case "equals":
      return value === condition.value;
    case "not_equals":
      return value !== condition.value;
    case "in":
      return Array.isArray(condition.value) && condition.value.includes(value);
    case "exists":
      return value !== void 0;
    default:
      return false;
  }
}
function applyConstraint(properties, c) {
  if (c.when && !validCondition(properties, c.when)) return true;
  const present = hasPath(properties, c.field);
  const value = pathValue(properties, c.field);
  switch (c.operator) {
    case "equals":
      return value === c.value;
    case "not_equals":
      return value !== c.value;
    case "in":
      return Array.isArray(c.value) && c.value.includes(value);
    case "not_in":
      return Array.isArray(c.value) && !c.value.includes(value);
    case "exists":
      return present;
    case "not_exists":
      return !present;
    case "min":
      return typeof value === "number" && typeof c.value === "number" && value >= c.value;
    case "max":
      return typeof value === "number" && typeof c.value === "number" && value <= c.value;
    case "requires_field":
      return !present || typeof c.value === "string" && hasPath(properties, c.value);
    case "forbids_field":
      return !present || typeof c.value === "string" && !hasPath(properties, c.value);
    default:
      return false;
  }
}
function validateFieldValue(value, spec, path, targetId, graph) {
  const out = [];
  if (value === null) {
    if (spec.nullable) return out;
    return [issue("NULL_NOT_ALLOWED", `${path} is null but the field is not nullable.`, targetId, path)];
  }
  const typeOkay = (() => {
    switch (spec.type) {
      case "string":
        return typeof value === "string";
      case "number":
        return typeof value === "number" && Number.isFinite(value);
      case "integer":
        return typeof value === "number" && Number.isInteger(value);
      case "boolean":
        return typeof value === "boolean";
      case "object":
        return isRecord(value);
      case "array":
      case "reference_list":
      case "string_list":
        return Array.isArray(value);
      case "reference":
        return typeof value === "string";
      case "any":
        return true;
      default:
        return false;
    }
  })();
  if (!typeOkay) return [issue("FIELD_TYPE_MISMATCH", `${path} must have type ${spec.type}.`, targetId, path, "error", { actual: Array.isArray(value) ? "array" : typeof value })];
  if (spec.enum && !spec.enum.some((v) => sameJson(v, value))) out.push(issue("FIELD_VALUE_NOT_IN_ENUM", `${path} must be one of the declared enum values.`, targetId, path, "error", { allowed: spec.enum }));
  if (typeof value === "number") {
    if (spec.min !== void 0 && value < spec.min) out.push(issue("FIELD_BELOW_MIN", `${path} must be >= ${spec.min}.`, targetId, path));
    if (spec.max !== void 0 && value > spec.max) out.push(issue("FIELD_ABOVE_MAX", `${path} must be <= ${spec.max}.`, targetId, path));
  }
  if (typeof value === "string" && spec.pattern) {
    try {
      if (!new RegExp(spec.pattern).test(value)) out.push(issue("FIELD_PATTERN_MISMATCH", `${path} does not match its declared pattern.`, targetId, path));
    } catch {
      out.push(issue("INVALID_SCHEMA_PATTERN", `Schema pattern for ${path} is invalid.`, targetId, path));
    }
  }
  if (Array.isArray(value)) {
    if (spec.min_items !== void 0 && value.length < spec.min_items) out.push(issue("ARRAY_TOO_SHORT", `${path} requires at least ${spec.min_items} items.`, targetId, path));
    if (spec.max_items !== void 0 && value.length > spec.max_items) out.push(issue("ARRAY_TOO_LONG", `${path} allows at most ${spec.max_items} items.`, targetId, path));
    if (spec.unique_items && new Set(value.map((v) => JSON.stringify(v))).size !== value.length) out.push(issue("ARRAY_ITEMS_NOT_UNIQUE", `${path} requires unique items.`, targetId, path));
    if (spec.items) value.forEach((item, i) => out.push(...validateFieldValue(item, spec.items, `${path}[${i}]`, targetId, graph)));
    if (spec.type === "string_list") value.forEach((item, i) => {
      if (typeof item !== "string") out.push(issue("ARRAY_ITEM_TYPE_MISMATCH", `${path}[${i}] must be a string.`, targetId, `${path}[${i}]`));
    });
    if (spec.type === "reference_list") value.forEach((item, i) => {
      if (typeof item !== "string") {
        out.push(issue("REFERENCE_TYPE_MISMATCH", `${path}[${i}] must be an entity ID.`, targetId, `${path}[${i}]`));
        return;
      }
      const target = graph.entities[item];
      if (!target) out.push(issue("REFERENCE_NOT_FOUND", `${path}[${i}] references missing entity ${item}.`, targetId, `${path}[${i}]`));
      else if (spec.ref_types?.length && !spec.ref_types.includes(target.entity_type)) out.push(issue("REFERENCE_TARGET_TYPE_MISMATCH", `${path}[${i}] must refer to one of: ${spec.ref_types.join(", ")}.`, targetId, `${path}[${i}]`));
    });
  }
  if (spec.type === "reference") {
    const target = graph.entities[value];
    if (!target) out.push(issue("REFERENCE_NOT_FOUND", `${path} references missing entity ${String(value)}.`, targetId, path));
    else if (spec.ref_types?.length && !spec.ref_types.includes(target.entity_type)) out.push(issue("REFERENCE_TARGET_TYPE_MISMATCH", `${path} must refer to one of: ${spec.ref_types.join(", ")}.`, targetId, path));
  }
  if (isRecord(value)) {
    if (spec.properties) {
      for (const [key, childSpec] of Object.entries(spec.properties)) {
        if (value[key] === void 0 && childSpec.required) out.push(issue("REQUIRED_NESTED_FIELD_MISSING", `${path}.${key} is required.`, targetId, `${path}.${key}`));
        else if (value[key] !== void 0) out.push(...validateFieldValue(value[key], childSpec, `${path}.${key}`, targetId, graph));
      }
    }
    if (spec.additional_properties === false && spec.properties) {
      for (const key of Object.keys(value)) if (!(key in spec.properties)) out.push(issue("UNKNOWN_NESTED_FIELD", `${path}.${key} is not allowed.`, targetId, `${path}.${key}`));
    }
  }
  return out;
}
var SchemaEngine = class {
  constructor(registry) {
    this.registry = registry;
  }
  registry;
  conceptProps(record) {
    if (record.entity_type !== "Layer2Concept" || !isRecord(record.properties)) return null;
    const p = record.properties;
    if (typeof p.concept_kind !== "string" || typeof p.lifecycle !== "string" || !isRecord(p.effects)) return null;
    return p;
  }
  activeConceptClosure(bindings, graph, targetId) {
    const issues = [];
    const ordered = [];
    const visiting = /* @__PURE__ */ new Set();
    const visited = /* @__PURE__ */ new Set();
    const visit = (id, depth) => {
      if (visited.has(id)) return;
      if (visiting.has(id)) {
        issues.push(issue("CONCEPT_INHERITANCE_CYCLE", `Layer 2 concept inheritance cycle includes ${id}.`, targetId, "concept_bindings", "error", { concept_id: id }));
        return;
      }
      const record = graph.entities[id];
      if (!record) {
        issues.push(issue("CONCEPT_NOT_FOUND", `Bound Layer 2 concept ${id} does not exist.`, targetId, "concept_bindings"));
        return;
      }
      if (record.entity_type !== "Layer2Concept" || record.axis !== "L2") {
        issues.push(issue("BINDING_NOT_LAYER2_CONCEPT", `${id} is not a Layer2Concept and cannot govern a schema.`, targetId, "concept_bindings"));
        return;
      }
      const props = this.conceptProps(record);
      if (!props) {
        issues.push(issue("MALFORMED_LAYER2_CONCEPT", `Layer 2 concept ${id} lacks the required concept fields or effects object.`, targetId, `entities.${id}.properties`));
        return;
      }
      visiting.add(id);
      for (const parentId of props.extends_concept_ids ?? []) visit(parentId, depth + 1);
      visiting.delete(id);
      visited.add(id);
      if (props.lifecycle === "draft" || record.status === "draft") issues.push(issue("DRAFT_CONCEPT_BOUND", `Draft concept ${id} is bound to a record.`, targetId, "concept_bindings"));
      if (props.lifecycle === "deprecated") issues.push(issue("DEPRECATED_CONCEPT_BOUND", `Deprecated concept ${id} remains bound; its prior effects are still applied.`, targetId, "concept_bindings", "warning"));
      ordered.push({ id, record, props, depth });
    };
    for (const id of bindings) visit(id, 0);
    const ids = new Set(ordered.map((c) => c.id));
    for (const concept of ordered) {
      const p = concept.props;
      for (const req of p.requires_concept_ids ?? []) if (!ids.has(req)) issues.push(issue("REQUIRED_CONCEPT_NOT_BOUND", `Concept ${concept.id} requires concept ${req} to be bound or inherited.`, targetId, "concept_bindings", "error", { concept_id: concept.id, required_concept_id: req }));
      for (const excluded of p.excludes_concept_ids ?? []) if (ids.has(excluded)) issues.push(issue("EXCLUDED_CONCEPT_BOUND", `Concepts ${concept.id} and ${excluded} cannot be active together.`, targetId, "concept_bindings", "error", { concept_id: concept.id, excluded_concept_id: excluded }));
    }
    return { concepts: ordered, issues };
  }
  effectiveEntitySchema(entityType, bindings, graph, targetId, properties = {}) {
    const type = this.registry.entity_types[entityType];
    const issues = [];
    if (!type) {
      issues.push(issue("UNKNOWN_ENTITY_TYPE", `Entity type ${entityType} is not in the active registry.`, targetId));
      return { entity_type: entityType, axis: "?", fields: {}, forbidden_fields: /* @__PURE__ */ new Set(), constraints: [], allowed_outgoing_relations: /* @__PURE__ */ new Set(), allowed_incoming_relations: /* @__PURE__ */ new Set(), denied_outgoing_relations: /* @__PURE__ */ new Set(), denied_incoming_relations: /* @__PURE__ */ new Set(), required_relations: [], conditional_required_fields: [], conditional_forbidden_fields: [], active_concept_ids: [], issues };
    }
    const fields2 = structuredClone(type.fields);
    const origins = new Map(Object.keys(fields2).map((key) => [key, "$base"]));
    const forbidden = /* @__PURE__ */ new Set();
    const constraints = [];
    let outgoing = type.allowed_outgoing_relations === "*" ? "*" : new Set(type.allowed_outgoing_relations ?? []);
    let incoming = type.allowed_incoming_relations === "*" ? "*" : new Set(type.allowed_incoming_relations ?? []);
    const deniedOut = /* @__PURE__ */ new Set();
    const deniedIn = /* @__PURE__ */ new Set();
    const requiredRelations = [];
    const conditionalRequired = [];
    const conditionalForbidden = [];
    const closure = this.activeConceptClosure(bindings, graph, targetId);
    issues.push(...closure.issues);
    const concepts = closure.concepts;
    const conceptIds = new Set(concepts.map((c) => c.id));
    for (const c of concepts) {
      const p = c.props;
      if (!(p.applies_to_entity_types ?? []).includes("*") && !(p.applies_to_entity_types ?? []).includes(entityType)) {
        issues.push(issue("CONCEPT_NOT_APPLICABLE_TO_ENTITY_TYPE", `Concept ${c.id} does not declare applicability to entity type ${entityType}.`, targetId, "concept_bindings", "error", { applies_to: p.applies_to_entity_types ?? [] }));
      }
      const l3Types = (p.applies_to_entity_types ?? []).filter((t) => this.registry.entity_types[t]?.axis === "L3");
      if (l3Types.length) issues.push(issue("L3_SCHEMA_MUTATION_FORBIDDEN", `Layer 2 concept ${c.id} may not reshape Layer 3 entity types.`, c.id, "properties.applies_to_entity_types", "error", { forbidden_targets: l3Types }));
      const fx = p.effects.entities;
      if (!fx) continue;
      for (const [key, spec] of Object.entries(fx.add_fields ?? {})) {
        if (key in fields2) {
          if (sameJson(fields2[key], spec) && origins.get(key) === c.id) continue;
          issues.push(issue("CONCEPT_FIELD_ADD_COLLISION", `Concept ${c.id} adds field ${key}, but it already exists. Use override_fields or an explicit concept inheritance relationship.`, targetId, `properties.${key}`, "error", { concept_id: c.id, existing_origin: origins.get(key) }));
        } else {
          fields2[key] = structuredClone(spec);
          origins.set(key, c.id);
          forbidden.delete(key);
        }
      }
      for (const [key, spec] of Object.entries(fx.override_fields ?? {})) {
        if (!(key in fields2)) {
          issues.push(issue("CONCEPT_OVERRIDE_TARGET_MISSING", `Concept ${c.id} overrides field ${key}, but that field does not exist in its inherited schema.`, targetId, `properties.${key}`, "error", { concept_id: c.id }));
          continue;
        }
        const origin = origins.get(key) ?? "$base";
        const originIsAncestor = origin === "$base" || this.isAncestorConcept(origin, c.id, graph, /* @__PURE__ */ new Set());
        if (!originIsAncestor) {
          issues.push(issue("CONCEPT_OVERRIDE_CONFLICT", `Concept ${c.id} conflicts with an override of ${key} from unrelated concept ${origin}.`, targetId, `properties.${key}`, "error", { concept_id: c.id, existing_origin: origin }));
          continue;
        }
        fields2[key] = structuredClone(spec);
        origins.set(key, c.id);
        forbidden.delete(key);
      }
      for (const key of fx.remove_fields ?? []) {
        if ((type.immutable_fields ?? []).includes(key)) {
          issues.push(issue("IMMUTABLE_FIELD_REMOVAL", `Concept ${c.id} may not remove immutable field ${key}.`, targetId, `properties.${key}`));
          continue;
        }
        if (!(key in fields2)) {
          issues.push(issue("CONCEPT_REMOVE_TARGET_MISSING", `Concept ${c.id} removes field ${key}, but the field is not present in the composed schema.`, targetId, `properties.${key}`, "warning"));
          continue;
        }
        delete fields2[key];
        origins.delete(key);
        forbidden.add(key);
      }
      for (const key of fx.required_fields ?? []) {
        if (!(key in fields2)) issues.push(issue("CONCEPT_REQUIRED_FIELD_MISSING_FROM_SCHEMA", `Concept ${c.id} requires ${key}, but it is not present in the composed schema.`, targetId, `properties.${key}`));
        else fields2[key] = { ...fields2[key], required: true };
      }
      for (const key of fx.forbidden_fields ?? []) {
        forbidden.add(key);
        if (key in fields2 && fields2[key].required) issues.push(issue("FIELD_BOTH_REQUIRED_AND_FORBIDDEN", `Concept ${c.id} both requires and forbids field ${key}.`, targetId, `properties.${key}`));
      }
      constraints.push(...fx.constraints ?? []);
      (fx.required_relations ?? []).forEach((r) => requiredRelations.push(r));
      (fx.conditional_required_fields ?? []).forEach((r) => conditionalRequired.push(r));
      (fx.conditional_forbidden_fields ?? []).forEach((r) => conditionalForbidden.push(r));
      if (fx.allow_outgoing_relations?.length) {
        const current = outgoing;
        if (current !== "*") fx.allow_outgoing_relations.forEach((x) => current.add(x));
      }
      if (fx.allow_incoming_relations?.length) {
        const current = incoming;
        if (current !== "*") fx.allow_incoming_relations.forEach((x) => current.add(x));
      }
      if (fx.restrict_outgoing_relations?.length) outgoing = outgoing === "*" ? new Set(fx.restrict_outgoing_relations) : new Set([...outgoing].filter((x) => fx.restrict_outgoing_relations.includes(x)));
      if (fx.restrict_incoming_relations?.length) incoming = incoming === "*" ? new Set(fx.restrict_incoming_relations) : new Set([...incoming].filter((x) => fx.restrict_incoming_relations.includes(x)));
      fx.deny_outgoing_relations?.forEach((x) => deniedOut.add(x));
      fx.deny_incoming_relations?.forEach((x) => deniedIn.add(x));
      for (const key of forbidden) {
        if (properties[key] !== void 0) issues.push(issue("REMOVED_OR_FORBIDDEN_FIELD_DATA_PRESERVED", `Field ${key} is no longer permitted by the active concepts. Its value has been preserved and must be explicitly migrated or retained in extension_data.`, targetId, `properties.${key}`, "error", { value_preserved: true }));
      }
    }
    for (const key of forbidden) {
      if (fields2[key]?.required) issues.push(issue("FIELD_BOTH_REQUIRED_AND_FORBIDDEN", `Field ${key} is both required and forbidden in the composed schema.`, targetId, `properties.${key}`));
    }
    return { entity_type: entityType, axis: type.axis, fields: fields2, forbidden_fields: forbidden, constraints, allowed_outgoing_relations: outgoing, allowed_incoming_relations: incoming, denied_outgoing_relations: deniedOut, denied_incoming_relations: deniedIn, required_relations: requiredRelations, conditional_required_fields: conditionalRequired, conditional_forbidden_fields: conditionalForbidden, active_concept_ids: [...conceptIds], issues };
  }
  isAncestorConcept(ancestorId, childId, graph, seen) {
    if (seen.has(childId)) return false;
    seen.add(childId);
    const child = graph.entities[childId];
    const props = child ? this.conceptProps(child) : null;
    if (!props) return false;
    for (const parentId of props.extends_concept_ids ?? []) {
      if (parentId === ancestorId || this.isAncestorConcept(ancestorId, parentId, graph, seen)) return true;
    }
    return false;
  }
  effectiveRelationSchema(relationType, fromEntity, toEntity, bindings, graph, targetId) {
    const issues = [];
    const candidates = [...fromEntity.concept_bindings, ...toEntity.concept_bindings, ...bindings];
    const closure = this.activeConceptClosure([...new Set(candidates)], graph, targetId);
    issues.push(...closure.issues);
    const concepts = closure.concepts;
    const dynamicSpecs = /* @__PURE__ */ new Map();
    for (const c of concepts) {
      for (const relSpec of c.props.effects.add_relation_types ?? []) {
        if (relSpec.id !== relationType) continue;
        if (!(c.props.applies_to_relation_types ?? []).includes("*") && !(c.props.applies_to_relation_types ?? []).includes(relationType)) {
          issues.push(issue("CONCEPT_ADDED_RELATION_NOT_DECLARED_APPLICABLE", `Concept ${c.id} adds ${relationType} without declaring it in applies_to_relation_types.`, c.id, "properties.effects.add_relation_types"));
        }
        const previous = dynamicSpecs.get(relSpec.id);
        if (previous && !sameJson(previous, relSpec)) issues.push(issue("DYNAMIC_RELATION_TYPE_CONFLICT", `Active concepts define incompatible relation type ${relSpec.id}.`, targetId, "relation_type", "error", { concept_ids: [c.id] }));
        else dynamicSpecs.set(relSpec.id, relSpec);
      }
    }
    for (const c of concepts) {
      if ((c.props.effects.remove_relation_types ?? []).includes(relationType)) issues.push(issue("RELATION_TYPE_REMOVED_BY_CONCEPT", `Active concept ${c.id} prohibits relation type ${relationType} in this scope.`, targetId, "relation_type"));
    }
    const staticSpec = this.registry.relation_types[relationType];
    const spec = staticSpec ?? dynamicSpecs.get(relationType);
    if (!spec) issues.push(issue("UNKNOWN_RELATION_TYPE", `Relation type ${relationType} is not defined in the core registry or active Layer 2 concepts.`, targetId, "relation_type"));
    if (staticSpec && dynamicSpecs.has(relationType) && !sameJson(staticSpec, dynamicSpecs.get(relationType))) issues.push(issue("CORE_RELATION_TYPE_REDEFINITION", `A Layer 2 concept cannot redefine core relation type ${relationType}; it may add constraints or fields only.`, targetId, "relation_type"));
    const props = { ...spec?.properties ?? {} };
    const origins = new Map(Object.keys(props).map((k) => [k, "$base"]));
    const forbidden = /* @__PURE__ */ new Set();
    const constraints = [];
    for (const c of concepts) {
      const applies = (c.props.applies_to_relation_types ?? []).includes("*") || (c.props.applies_to_relation_types ?? []).includes(relationType);
      if (!applies) continue;
      const fx = c.props.effects.relations;
      if (!fx) continue;
      for (const [key, field] of Object.entries(fx.add_property_fields ?? {})) {
        if (key in props) issues.push(issue("CONCEPT_RELATION_FIELD_ADD_COLLISION", `Concept ${c.id} adds relation property ${key}, but it already exists.`, targetId, `properties.${key}`));
        else {
          props[key] = structuredClone(field);
          origins.set(key, c.id);
          forbidden.delete(key);
        }
      }
      for (const [key, field] of Object.entries(fx.override_property_fields ?? {})) {
        if (!(key in props)) {
          issues.push(issue("CONCEPT_RELATION_OVERRIDE_TARGET_MISSING", `Concept ${c.id} overrides missing relation property ${key}.`, targetId, `properties.${key}`));
          continue;
        }
        const origin = origins.get(key) ?? "$base";
        if (origin !== "$base" && !this.isAncestorConcept(origin, c.id, graph, /* @__PURE__ */ new Set())) {
          issues.push(issue("CONCEPT_RELATION_OVERRIDE_CONFLICT", `Concept ${c.id} conflicts with relation property override from ${origin}.`, targetId, `properties.${key}`));
          continue;
        }
        props[key] = structuredClone(field);
        origins.set(key, c.id);
        forbidden.delete(key);
      }
      for (const key of fx.remove_property_fields ?? []) {
        if (!(key in props)) {
          issues.push(issue("CONCEPT_RELATION_REMOVE_TARGET_MISSING", `Concept ${c.id} removes missing relation property ${key}.`, targetId, `properties.${key}`, "warning"));
          continue;
        }
        delete props[key];
        origins.delete(key);
        forbidden.add(key);
      }
      for (const key of fx.required_property_fields ?? []) {
        if (!(key in props)) issues.push(issue("CONCEPT_RELATION_REQUIRED_FIELD_MISSING", `Concept ${c.id} requires absent relation property ${key}.`, targetId, `properties.${key}`));
        else props[key] = { ...props[key], required: true };
      }
      for (const key of fx.forbidden_property_fields ?? []) forbidden.add(key);
      constraints.push(...fx.constraints ?? []);
    }
    return { relation_type: relationType, spec, properties: props, forbidden_properties: forbidden, constraints, active_concept_ids: concepts.map((c) => c.id), issues };
  }
  validateConceptDefinition(record, graph) {
    const out = [];
    const p = this.conceptProps(record);
    if (!p) return [issue("MALFORMED_LAYER2_CONCEPT", "Layer2Concept requires concept_kind, lifecycle, and effects object.", record.id, "properties")];
    if (!p.rationale || !p.definition_version) out.push(issue("CONCEPT_METADATA_REQUIRED", "Layer 2 concept requires rationale and definition_version.", record.id, "properties"));
    const allowedEffectKeys = ["entities", "relations", "add_relation_types", "remove_relation_types"];
    for (const key of Object.keys(p.effects)) if (!allowedEffectKeys.includes(key)) out.push(issue("UNKNOWN_LAYER2_EFFECT_KIND", `Unknown effect block ${key}; the runtime will not execute it.`, record.id, `properties.effects.${key}`));
    if (p.effects.entities && !isRecord(p.effects.entities)) out.push(issue("INVALID_ENTITY_EFFECTS", "effects.entities must be an object.", record.id, "properties.effects.entities"));
    if (p.effects.relations && !isRecord(p.effects.relations)) out.push(issue("INVALID_RELATION_EFFECTS", "effects.relations must be an object.", record.id, "properties.effects.relations"));
    for (const [name, list] of Object.entries({
      remove_fields: p.effects.entities?.remove_fields,
      required_fields: p.effects.entities?.required_fields,
      forbidden_fields: p.effects.entities?.forbidden_fields,
      allow_outgoing_relations: p.effects.entities?.allow_outgoing_relations,
      restrict_outgoing_relations: p.effects.entities?.restrict_outgoing_relations,
      deny_outgoing_relations: p.effects.entities?.deny_outgoing_relations,
      allow_incoming_relations: p.effects.entities?.allow_incoming_relations,
      restrict_incoming_relations: p.effects.entities?.restrict_incoming_relations,
      deny_incoming_relations: p.effects.entities?.deny_incoming_relations,
      remove_property_fields: p.effects.relations?.remove_property_fields,
      required_property_fields: p.effects.relations?.required_property_fields,
      forbidden_property_fields: p.effects.relations?.forbidden_property_fields,
      remove_relation_types: p.effects.remove_relation_types
    })) if (list !== void 0 && (!Array.isArray(list) || !list.every((x) => typeof x === "string"))) out.push(issue("INVALID_EFFECT_STRING_LIST", `effects.${name} must be an array of strings.`, record.id, `properties.effects.${name}`));
    const types = [...p.applies_to_entity_types ?? [], ...p.applies_to_relation_types ?? []];
    if (types.length === 0) out.push(issue("CONCEPT_APPLICABILITY_EMPTY", "Layer 2 concept must declare at least one applicable entity or relation type.", record.id, "properties.applies_to_entity_types"));
    for (const t of p.applies_to_entity_types ?? []) {
      if (t !== "*" && !this.registry.entity_types[t]) out.push(issue("CONCEPT_UNKNOWN_ENTITY_TARGET", `Concept targets unknown entity type ${t}.`, record.id, "properties.applies_to_entity_types"));
      if (this.registry.entity_types[t]?.axis === "L3") out.push(issue("L3_SCHEMA_MUTATION_FORBIDDEN", `Layer 2 concepts cannot alter Layer 3 type ${t}.`, record.id, "properties.applies_to_entity_types"));
    }
    for (const t of p.applies_to_relation_types ?? []) {
      if (t !== "*" && !this.registry.relation_types[t] && !(p.effects.add_relation_types ?? []).some((r) => r.id === t)) {
        out.push(issue("CONCEPT_RELATION_TARGET_NOT_IN_CORE_REGISTRY", `Relation type ${t} is not core-defined and is not added by this concept; ensure a bound ancestor or sibling extension provides it.`, record.id, "properties.applies_to_relation_types", "warning"));
      }
    }
    const allIds = [...p.extends_concept_ids ?? [], ...p.requires_concept_ids ?? [], ...p.excludes_concept_ids ?? []];
    for (const id of allIds) {
      const target = graph.entities[id];
      if (!target || target.entity_type !== "Layer2Concept") out.push(issue("CONCEPT_DEPENDENCY_NOT_FOUND", `Concept dependency ${id} does not reference an existing Layer2Concept.`, record.id, "properties"));
    }
    for (const [key, field] of Object.entries(p.effects.entities?.add_fields ?? {})) out.push(...this.validateFieldSpec(field, `${record.id}.effects.entities.add_fields.${key}`, record.id));
    for (const [key, field] of Object.entries(p.effects.entities?.override_fields ?? {})) out.push(...this.validateFieldSpec(field, `${record.id}.effects.entities.override_fields.${key}`, record.id));
    for (const [key, field] of Object.entries(p.effects.relations?.add_property_fields ?? {})) out.push(...this.validateFieldSpec(field, `${record.id}.effects.relations.add_property_fields.${key}`, record.id));
    for (const rel of p.effects.add_relation_types ?? []) {
      if (!rel.id || !Array.isArray(rel.from_types) || !Array.isArray(rel.to_types) || !isRecord(rel.properties)) out.push(issue("MALFORMED_DYNAMIC_RELATION_TYPE", `Dynamic relation type in ${record.id} requires id, from_types, to_types, and properties.`, record.id, "properties.effects.add_relation_types"));
      for (const t of [...rel.from_types, ...rel.to_types]) if (!this.registry.entity_types[t]) out.push(issue("DYNAMIC_RELATION_UNKNOWN_ENDPOINT_TYPE", `Dynamic relation ${rel.id} references unknown endpoint entity type ${t}.`, record.id, "properties.effects.add_relation_types"));
      for (const [key, field] of Object.entries(rel.properties ?? {})) out.push(...this.validateFieldSpec(field, `${record.id}.effects.add_relation_types.${rel.id}.properties.${key}`, record.id));
      for (const t of [...rel.from_types, ...rel.to_types]) if (this.registry.entity_types[t]?.axis === "L3") out.push(issue("L3_SCHEMA_MUTATION_FORBIDDEN", `Layer 2 concept must not define dynamic relations targeting Layer 3 type ${t}.`, record.id, "properties.effects.add_relation_types"));
    }
    return out;
  }
  validateFieldSpec(spec, path, targetId) {
    const out = [];
    const types = ["string", "number", "integer", "boolean", "object", "array", "reference", "reference_list", "string_list", "any"];
    if (!spec || !types.includes(spec.type)) return [issue("INVALID_FIELD_SPEC", `${path} has an unsupported or missing field type.`, targetId, path)];
    if (spec.enum && !Array.isArray(spec.enum)) out.push(issue("INVALID_FIELD_ENUM", `${path}.enum must be an array.`, targetId, `${path}.enum`));
    if (spec.type === "reference" || spec.type === "reference_list") {
      for (const type of spec.ref_types ?? []) if (!this.registry.entity_types[type]) out.push(issue("INVALID_REFERENCE_TYPE", `${path} references unknown entity type ${type}.`, targetId, `${path}.ref_types`));
    }
    return out;
  }
  validateEntity(entity, graph) {
    const issues = [];
    const type = this.registry.entity_types[entity.entity_type];
    if (!type) return [issue("UNKNOWN_ENTITY_TYPE", `Entity type ${entity.entity_type} is unknown.`, entity.id, "entity_type")];
    if (entity.axis !== type.axis) issues.push(issue("ENTITY_AXIS_MISMATCH", `Entity ${entity.id} axis ${entity.axis} does not match registry axis ${type.axis}.`, entity.id, "axis"));
    if (!Array.isArray(entity.concept_bindings)) issues.push(issue("INVALID_CONCEPT_BINDINGS", "concept_bindings must be an array of Layer2Concept IDs.", entity.id, "concept_bindings"));
    const effective = this.effectiveEntitySchema(entity.entity_type, entity.concept_bindings ?? [], graph, entity.id, entity.properties ?? {});
    issues.push(...effective.issues);
    if (!isRecord(entity.properties)) return [...issues, issue("ENTITY_PROPERTIES_NOT_OBJECT", "Entity properties must be a JSON object.", entity.id, "properties")];
    for (const [key, spec] of Object.entries(effective.fields)) {
      if (entity.properties[key] === void 0) {
        if (spec.required) issues.push(issue("REQUIRED_FIELD_MISSING", `Required property ${key} is missing.`, entity.id, `properties.${key}`));
      } else issues.push(...validateFieldValue(entity.properties[key], spec, `properties.${key}`, entity.id, graph));
    }
    for (const key of Object.keys(entity.properties)) {
      if (effective.forbidden_fields.has(key)) issues.push(issue("FORBIDDEN_FIELD_PRESENT", `Property ${key} is forbidden by an active concept; its stored value is preserved.`, entity.id, `properties.${key}`));
      else if (!(key in effective.fields)) {
        const severity = entity.status === "active" ? "error" : "warning";
        issues.push(issue("UNKNOWN_OR_INACTIVE_FIELD", `Property ${key} is not in the effective schema. The value is preserved; bind its defining concept, migrate explicitly, or move it to extension_data.`, entity.id, `properties.${key}`, severity));
      }
    }
    for (const c of effective.constraints) if (!applyConstraint(entity.properties, c)) issues.push(issue("CONCEPT_CONSTRAINT_FAILED", c.message ?? `Constraint ${c.operator} failed for field ${c.field}.`, entity.id, `properties.${c.field}`, "error", { operator: c.operator, value: c.value }));
    for (const rule of effective.conditional_required_fields) if (validCondition(entity.properties, rule.when)) for (const field of rule.fields) {
      if (!(field in effective.fields)) issues.push(issue("CONDITIONAL_REQUIRED_FIELD_NOT_IN_SCHEMA", `A conditional rule requires ${field}, but it is absent from the effective schema.`, entity.id, `properties.${field}`));
      else if (entity.properties[field] === void 0) issues.push(issue("CONDITIONAL_REQUIRED_FIELD_MISSING", `Property ${field} is required when ${rule.when.field} satisfies ${rule.when.operator}.`, entity.id, `properties.${field}`));
    }
    for (const rule of effective.conditional_forbidden_fields) if (validCondition(entity.properties, rule.when)) for (const field of rule.fields) {
      if (entity.properties[field] !== void 0) issues.push(issue("CONDITIONAL_FORBIDDEN_FIELD_PRESENT", `Property ${field} is forbidden when ${rule.when.field} satisfies ${rule.when.operator}; stored data is preserved.`, entity.id, `properties.${field}`));
    }
    for (const [field, expected] of Object.entries(this.conceptApplicabilityValues(entity.concept_bindings ?? [], graph))) {
      if (entity.properties[field] !== expected) issues.push(issue("CONCEPT_APPLICABILITY_CONDITION_FAILED", `Active concept requires ${field}=${JSON.stringify(expected)}.`, entity.id, `properties.${field}`));
    }
    if (entity.entity_type === "Layer2Concept") issues.push(...this.validateConceptDefinition(entity, graph));
    if (type.axis === "L3" && entity.concept_bindings?.length) issues.push(issue("L3_CANNOT_BE_GOVERNED_BY_LAYER2", "Layer 3 metrology records cannot be reshaped by Layer 2 concept bindings.", entity.id, "concept_bindings"));
    if (entity.status === "tombstoned") issues.push(issue("TOMBSTONED_ENTITY", "Entity is retained as a tombstone and excluded from normal queries.", entity.id, "status", "info"));
    return issues;
  }
  conceptApplicabilityValues(bindings, graph) {
    const values = {};
    const closure = this.activeConceptClosure(bindings, graph);
    for (const concept of closure.concepts) {
      for (const [key, value] of Object.entries(concept.props.applicability?.required_property_values ?? {})) {
        if (key in values && !sameJson(values[key], value)) values[`__conflict__${key}`] = true;
        else values[key] = value;
      }
    }
    return values;
  }
  validateRelation(relation, graph) {
    const issues = [];
    const from = graph.entities[relation.from];
    const to = graph.entities[relation.to];
    if (!from) issues.push(issue("RELATION_SOURCE_NOT_FOUND", `Relation source ${relation.from} does not exist.`, relation.id, "from"));
    if (!to) issues.push(issue("RELATION_TARGET_NOT_FOUND", `Relation target ${relation.to} does not exist.`, relation.id, "to"));
    if (!from || !to) return issues;
    const effective = this.effectiveRelationSchema(relation.relation_type, from, to, relation.concept_bindings ?? [], graph, relation.id);
    issues.push(...effective.issues);
    if (!effective.spec) return issues;
    const spec = effective.spec;
    if (!spec.from_types.includes("*") && !spec.from_types.includes(from.entity_type)) issues.push(issue("RELATION_SOURCE_TYPE_NOT_ALLOWED", `${relation.relation_type} does not allow source type ${from.entity_type}.`, relation.id, "from"));
    if (!spec.to_types.includes("*") && !spec.to_types.includes(to.entity_type)) issues.push(issue("RELATION_TARGET_TYPE_NOT_ALLOWED", `${relation.relation_type} does not allow target type ${to.entity_type}.`, relation.id, "to"));
    if (relation.from === relation.to && !spec.allow_self_loop) issues.push(issue("RELATION_SELF_LOOP_NOT_ALLOWED", `${relation.relation_type} does not allow self loops.`, relation.id));
    const fromSchema = this.effectiveEntitySchema(from.entity_type, from.concept_bindings, graph, from.id, from.properties);
    const toSchema = this.effectiveEntitySchema(to.entity_type, to.concept_bindings, graph, to.id, to.properties);
    if (fromSchema.allowed_outgoing_relations !== "*" && !fromSchema.allowed_outgoing_relations.has(relation.relation_type)) issues.push(issue("OUTGOING_RELATION_NOT_ALLOWED", `${from.entity_type} ${from.id} does not permit outgoing relation ${relation.relation_type}.`, relation.id, "relation_type"));
    if (fromSchema.denied_outgoing_relations.has(relation.relation_type)) issues.push(issue("OUTGOING_RELATION_DENIED_BY_CONCEPT", `An active concept forbids ${relation.relation_type} from ${from.id}.`, relation.id, "relation_type"));
    if (toSchema.allowed_incoming_relations !== "*" && !toSchema.allowed_incoming_relations.has(relation.relation_type)) issues.push(issue("INCOMING_RELATION_NOT_ALLOWED", `${to.entity_type} ${to.id} does not permit incoming relation ${relation.relation_type}.`, relation.id, "relation_type"));
    if (toSchema.denied_incoming_relations.has(relation.relation_type)) issues.push(issue("INCOMING_RELATION_DENIED_BY_CONCEPT", `An active concept forbids incoming ${relation.relation_type} at ${to.id}.`, relation.id, "relation_type"));
    if (!isRecord(relation.properties)) return [...issues, issue("RELATION_PROPERTIES_NOT_OBJECT", "Relation properties must be an object.", relation.id, "properties")];
    for (const [key, field] of Object.entries(effective.properties)) {
      if (relation.properties[key] === void 0) {
        if (field.required || spec.required_properties?.includes(key)) issues.push(issue("REQUIRED_RELATION_PROPERTY_MISSING", `Relation property ${key} is required.`, relation.id, `properties.${key}`));
      } else issues.push(...validateFieldValue(relation.properties[key], field, `properties.${key}`, relation.id, graph));
    }
    for (const key of Object.keys(relation.properties)) {
      if (effective.forbidden_properties.has(key)) issues.push(issue("FORBIDDEN_RELATION_PROPERTY_PRESENT", `Relation property ${key} is forbidden by an active concept; its value is preserved.`, relation.id, `properties.${key}`));
      else if (!(key in effective.properties)) issues.push(issue("UNKNOWN_RELATION_PROPERTY", `Relation property ${key} is not in the effective schema; its value is preserved.`, relation.id, `properties.${key}`, relation.status === "active" ? "error" : "warning"));
    }
    for (const c of effective.constraints) if (!applyConstraint(relation.properties, c)) issues.push(issue("RELATION_CONCEPT_CONSTRAINT_FAILED", c.message ?? `Constraint ${c.operator} failed for relation property ${c.field}.`, relation.id, `properties.${c.field}`));
    return issues;
  }
  validateGraph(graph) {
    const issues = [];
    for (const [id, entity] of Object.entries(graph.entities)) {
      if (id !== entity.id) issues.push(issue("ENTITY_MAP_KEY_MISMATCH", `Entity map key ${id} differs from record id ${entity.id}.`, id));
      issues.push(...this.validateEntity(entity, graph));
    }
    for (const [id, relation] of Object.entries(graph.relations)) {
      if (id !== relation.id) issues.push(issue("RELATION_MAP_KEY_MISMATCH", `Relation map key ${id} differs from record id ${relation.id}.`, id));
      if (relation.status !== "tombstoned") issues.push(...this.validateRelation(relation, graph));
    }
    for (const entity of Object.values(graph.entities)) {
      if (entity.status === "tombstoned") continue;
      const schema = this.effectiveEntitySchema(entity.entity_type, entity.concept_bindings, graph, entity.id, entity.properties);
      for (const rule of schema.required_relations ?? []) {
        const matching = Object.values(graph.relations).filter((r) => r.status !== "tombstoned" && r.relation_type === rule.relation_type && (rule.direction === "outgoing" && r.from === entity.id || rule.direction === "incoming" && r.to === entity.id || rule.direction === "either" && (r.from === entity.id || r.to === entity.id)) && (!rule.target_types?.length || rule.target_types.includes(graph.entities[r.from === entity.id ? r.to : r.from]?.entity_type ?? "")));
        const min = rule.min_count ?? 1;
        if (matching.length < min) issues.push(issue("REQUIRED_RELATION_MISSING", `${entity.id} requires at least ${min} ${rule.direction} ${rule.relation_type} relation(s); found ${matching.length}.`, entity.id));
        if (rule.max_count !== void 0 && matching.length > rule.max_count) issues.push(issue("RELATION_CARDINALITY_EXCEEDED", `${entity.id} allows at most ${rule.max_count} ${rule.direction} ${rule.relation_type} relation(s); found ${matching.length}.`, entity.id));
      }
    }
    return issues;
  }
};

// src/graph-api.ts
var GraphOperationError = class extends Error {
  constructor(message, issues = []) {
    super(message);
    this.issues = issues;
    this.name = "GraphOperationError";
  }
  issues;
};
function clone(value) {
  return JSON.parse(JSON.stringify(value));
}
function makeId(prefix) {
  const uuid = typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
  return `${prefix.toUpperCase().replace(/[^A-Z0-9]+/g, "-")}-${uuid}`;
}
function errorsOnly(issues) {
  return issues.filter((x) => x.severity === "error");
}
var HoloTaxonAPI = class {
  constructor(store, registrySeed = DEFAULT_REGISTRY) {
    this.store = store;
    this.registrySeed = registrySeed;
  }
  store;
  registrySeed;
  async getSnapshot() {
    return this.store.loadGraph();
  }
  async getRegistry() {
    return this.store.loadRegistry();
  }
  async getEntity(id, includeTombstoned = false) {
    const graph = await this.store.loadGraph();
    const record = graph.entities[id];
    if (!record || !includeTombstoned && record.status === "tombstoned") return null;
    return clone(record);
  }
  async listEntities(query = {}) {
    const graph = await this.store.loadGraph();
    const q = query;
    let rows = Object.values(graph.entities).filter((e) => {
      if (e.status === "tombstoned" && q.status !== "tombstoned") return false;
      if (q.entity_type && e.entity_type !== q.entity_type) return false;
      if (q.axis && e.axis !== q.axis) return false;
      if (q.status && e.status !== q.status) return false;
      if (q.concept_binding && !e.concept_bindings.includes(q.concept_binding)) return false;
      if (q.label_contains && !e.label.toLowerCase().includes(q.label_contains.toLowerCase())) return false;
      if (q.property_equals && Object.entries(q.property_equals).some(([key, value]) => e.properties[key] !== value)) return false;
      return true;
    }).sort((a, b) => a.label.localeCompare(b.label) || a.id.localeCompare(b.id));
    const offset = Math.max(0, q.offset ?? 0);
    const limit = Math.min(5e3, Math.max(0, q.limit ?? 100));
    rows = rows.slice(offset, offset + limit);
    return clone(rows);
  }
  async createEntity(input, options = {}) {
    const registry = await this.store.loadRegistry();
    const type = registry.entity_types[input.entity_type];
    if (!type) throw new GraphOperationError(`Unknown entity type ${input.entity_type}.`);
    if (type.axis === "L3" && (input.concept_bindings?.length ?? 0) > 0) throw new GraphOperationError("Layer 3 records cannot be governed by Layer 2 schema concepts.");
    const id = input.id ?? makeId(input.entity_type);
    return this.store.transact(`create-${input.entity_type}`, (graph) => {
      if (graph.entities[id]) throw new GraphOperationError(`Entity ID ${id} already exists. IDs are never silently overwritten.`);
      const now = nowIso();
      const entity = {
        id,
        entity_type: input.entity_type,
        axis: type.axis,
        label: input.label,
        revision: 1,
        status: input.status ?? "active",
        concept_bindings: [...new Set(input.concept_bindings ?? [])],
        properties: clone(input.properties ?? {}),
        created_at: now,
        updated_at: now,
        ...input.extension_data ? { extension_data: clone(input.extension_data) } : {}
      };
      graph.entities[id] = entity;
      const engine = new SchemaEngine(registry);
      const issues = engine.validateEntity(entity, graph);
      const errors = errorsOnly(issues);
      if (errors.length && !options.allow_draft) throw new GraphOperationError(`Entity ${id} failed schema validation; no change was committed.`, issues);
      if (errors.length) entity.status = "draft";
      return clone(entity);
    }, options.expected_generation);
  }
  /** Merge property keys; this intentionally does not replace the full properties object. */
  async updateEntity(id, patch, options = {}) {
    const registry = await this.store.loadRegistry();
    return this.store.transact(`update-entity-${id}`, (graph) => {
      const entity = graph.entities[id];
      if (!entity || entity.status === "tombstoned") throw new GraphOperationError(`Active entity ${id} was not found.`);
      if (options.expected_revision !== void 0 && entity.revision !== options.expected_revision) throw new GraphOperationError(`Stale entity revision: expected ${options.expected_revision}, current ${entity.revision}.`);
      if (patch.label !== void 0) entity.label = patch.label;
      if (patch.status !== void 0) {
        if (patch.status === "tombstoned") throw new GraphOperationError("Use tombstoneEntity() so relationship and revision rules are enforced.");
        entity.status = patch.status;
      }
      if (patch.properties) entity.properties = { ...entity.properties, ...clone(patch.properties) };
      if (patch.extension_data) entity.extension_data = { ...entity.extension_data ?? {}, ...clone(patch.extension_data) };
      entity.revision += 1;
      entity.updated_at = nowIso();
      this.validateMutationImpact(graph, registry, /* @__PURE__ */ new Set([id]), options.allow_draft ?? false, entity.entity_type === "Layer2Concept" ? /* @__PURE__ */ new Set([id]) : /* @__PURE__ */ new Set());
      return clone(entity);
    }, options.expected_generation);
  }
  async removeProperty(id, propertyPath, options = {}) {
    const registry = await this.store.loadRegistry();
    return this.store.transact(`remove-property-${id}-${propertyPath}`, (graph) => {
      const entity = graph.entities[id];
      if (!entity || entity.status === "tombstoned") throw new GraphOperationError(`Active entity ${id} was not found.`);
      if (options.expected_revision !== void 0 && entity.revision !== options.expected_revision) throw new GraphOperationError(`Stale entity revision for ${id}.`);
      const parts = propertyPath.split(".");
      let cur = entity.properties;
      for (const part of parts.slice(0, -1)) {
        const next = cur[part];
        if (!next || typeof next !== "object" || Array.isArray(next)) throw new GraphOperationError(`Property path ${propertyPath} does not exist.`);
        cur = next;
      }
      if (!(parts[parts.length - 1] in cur)) throw new GraphOperationError(`Property path ${propertyPath} does not exist.`);
      delete cur[parts[parts.length - 1]];
      entity.revision += 1;
      entity.updated_at = nowIso();
      this.validateMutationImpact(graph, registry, /* @__PURE__ */ new Set([id]), options.allow_draft ?? false);
      return clone(entity);
    }, options.expected_generation);
  }
  async bindConcept(entityId, conceptId, options = {}) {
    const registry = await this.store.loadRegistry();
    return this.store.transact(`bind-concept-${conceptId}-to-${entityId}`, (graph) => {
      const entity = graph.entities[entityId];
      const concept = graph.entities[conceptId];
      if (!entity || entity.status === "tombstoned") throw new GraphOperationError(`Active entity ${entityId} was not found.`);
      if (!concept || concept.entity_type !== "Layer2Concept" || concept.axis !== "L2") throw new GraphOperationError(`${conceptId} is not an existing Layer2Concept.`);
      if (entity.axis === "L3") throw new GraphOperationError("Layer 3 metrology entities cannot be reshaped by Layer 2 concepts.");
      if (options.expected_revision !== void 0 && entity.revision !== options.expected_revision) throw new GraphOperationError(`Stale entity revision for ${entityId}.`);
      if (!entity.concept_bindings.includes(conceptId)) entity.concept_bindings.push(conceptId);
      entity.revision += 1;
      entity.updated_at = nowIso();
      this.validateMutationImpact(graph, registry, /* @__PURE__ */ new Set([entityId]), options.allow_draft ?? false, /* @__PURE__ */ new Set([conceptId]));
      return clone(entity);
    }, options.expected_generation);
  }
  async unbindConcept(entityId, conceptId, options = {}) {
    const registry = await this.store.loadRegistry();
    return this.store.transact(`unbind-concept-${conceptId}-from-${entityId}`, (graph) => {
      const entity = graph.entities[entityId];
      if (!entity || entity.status === "tombstoned") throw new GraphOperationError(`Active entity ${entityId} was not found.`);
      if (options.expected_revision !== void 0 && entity.revision !== options.expected_revision) throw new GraphOperationError(`Stale entity revision for ${entityId}.`);
      entity.concept_bindings = entity.concept_bindings.filter((id) => id !== conceptId);
      entity.revision += 1;
      entity.updated_at = nowIso();
      this.validateMutationImpact(graph, registry, /* @__PURE__ */ new Set([entityId]), options.allow_draft ?? false, /* @__PURE__ */ new Set([conceptId]));
      return clone(entity);
    }, options.expected_generation);
  }
  async createRelation(input, options = {}) {
    const registry = await this.store.loadRegistry();
    const id = input.id ?? makeId(`REL-${input.relation_type}`);
    return this.store.transact(`create-relation-${input.relation_type}`, (graph) => {
      if (graph.relations[id]) throw new GraphOperationError(`Relation ID ${id} already exists. Relations are not silently overwritten.`);
      const from = graph.entities[input.from];
      const to = graph.entities[input.to];
      if (!from || from.status === "tombstoned") throw new GraphOperationError(`Active source entity ${input.from} was not found.`);
      if (!to || to.status === "tombstoned") throw new GraphOperationError(`Active target entity ${input.to} was not found.`);
      const now = nowIso();
      const relation = {
        id,
        relation_type: input.relation_type,
        from: input.from,
        to: input.to,
        revision: 1,
        status: input.status ?? "active",
        concept_bindings: [...new Set(input.concept_bindings ?? [])],
        properties: clone(input.properties ?? {}),
        assertion: input.assertion ? clone(input.assertion) : void 0,
        created_at: now,
        updated_at: now
      };
      graph.relations[id] = relation;
      const issues = new SchemaEngine(registry).validateRelation(relation, graph);
      const errors = errorsOnly(issues);
      if (errors.length && !options.allow_draft) throw new GraphOperationError(`Relation ${id} failed validation; no change was committed.`, issues);
      if (errors.length) relation.status = "draft";
      return clone(relation);
    }, options.expected_generation);
  }
  /** Merge relation-property keys; endpoint and relation IDs are immutable. */
  async updateRelation(id, patch, options = {}) {
    const registry = await this.store.loadRegistry();
    return this.store.transact(`update-relation-${id}`, (graph) => {
      const relation = graph.relations[id];
      if (!relation || relation.status === "tombstoned") throw new GraphOperationError(`Active relation ${id} was not found.`);
      if (options.expected_revision !== void 0 && relation.revision !== options.expected_revision) throw new GraphOperationError(`Stale relation revision for ${id}.`);
      if (patch.properties) relation.properties = { ...relation.properties, ...clone(patch.properties) };
      if (patch.assertion) relation.assertion = { ...relation.assertion ?? {}, ...clone(patch.assertion) };
      if (patch.status) {
        if (patch.status === "tombstoned") throw new GraphOperationError("Use tombstoneRelation() for soft deletion.");
        relation.status = patch.status;
      }
      relation.revision += 1;
      relation.updated_at = nowIso();
      const issues = new SchemaEngine(registry).validateRelation(relation, graph);
      const errors = errorsOnly(issues);
      if (errors.length && !options.allow_draft) throw new GraphOperationError(`Relation ${id} update failed validation; prior data is unchanged.`, issues);
      if (errors.length) relation.status = "draft";
      return clone(relation);
    }, options.expected_generation);
  }
  async tombstoneRelation(id, options = {}) {
    return this.store.transact(`tombstone-relation-${id}`, (graph) => {
      const relation = graph.relations[id];
      if (!relation) throw new GraphOperationError(`Relation ${id} was not found.`);
      if (options.expected_revision !== void 0 && relation.revision !== options.expected_revision) throw new GraphOperationError(`Stale relation revision for ${id}.`);
      relation.status = "tombstoned";
      relation.tombstoned_at = nowIso();
      relation.updated_at = nowIso();
      relation.revision += 1;
      return clone(relation);
    }, options.expected_generation);
  }
  async tombstoneEntity(id, options = {}) {
    return this.store.transact(`tombstone-entity-${id}`, (graph) => {
      const entity = graph.entities[id];
      if (!entity) throw new GraphOperationError(`Entity ${id} was not found.`);
      if (options.expected_revision !== void 0 && entity.revision !== options.expected_revision) throw new GraphOperationError(`Stale entity revision for ${id}.`);
      const linked = Object.values(graph.relations).filter((r) => r.status !== "tombstoned" && (r.from === id || r.to === id));
      if (linked.length && !options.cascade_relations) throw new GraphOperationError(`Entity ${id} has ${linked.length} active relations. Re-run with cascade_relations=true to tombstone those relations without deleting their history.`);
      for (const relation of linked) {
        relation.status = "tombstoned";
        relation.tombstoned_at = nowIso();
        relation.updated_at = nowIso();
        relation.revision += 1;
      }
      entity.status = "tombstoned";
      entity.tombstoned_at = nowIso();
      entity.updated_at = nowIso();
      entity.revision += 1;
      return clone(entity);
    }, options.expected_generation);
  }
  /**
   * Revalidate the changed record, all records whose active Layer 2 composition depends on
   * a changed concept, and relations touched by those records. Concept edits are schema
   * migrations: they are rejected by default if they invalidate dependents. allowDraft is
   * explicit and retains all old properties while demoting invalid dependents to draft.
   */
  validateMutationImpact(graph, registry, changedEntityIds, allowDraft, changedConceptIds = /* @__PURE__ */ new Set()) {
    const engine = new SchemaEngine(registry);
    const affectedEntityIds = new Set(changedEntityIds);
    for (const entity of Object.values(graph.entities)) {
      if (entity.status === "tombstoned") continue;
      const schema = engine.effectiveEntitySchema(entity.entity_type, entity.concept_bindings, graph, entity.id, entity.properties);
      if (schema.active_concept_ids.some((id) => changedConceptIds.has(id))) affectedEntityIds.add(entity.id);
    }
    const issues = [];
    const entityErrors = /* @__PURE__ */ new Map();
    for (const id of affectedEntityIds) {
      const entity = graph.entities[id];
      if (!entity || entity.status === "tombstoned") continue;
      const local = engine.validateEntity(entity, graph);
      issues.push(...local);
      const errors = errorsOnly(local);
      if (errors.length) entityErrors.set(id, errors);
    }
    const relationErrors = /* @__PURE__ */ new Map();
    for (const relation of Object.values(graph.relations)) {
      if (relation.status === "tombstoned") continue;
      const endpointAffected = affectedEntityIds.has(relation.from) || affectedEntityIds.has(relation.to);
      let conceptAffected = relation.concept_bindings.some((id) => changedConceptIds.has(id));
      if (!conceptAffected && changedConceptIds.size > 0) {
        const from = graph.entities[relation.from];
        const to = graph.entities[relation.to];
        if (from && to) {
          const effective = engine.effectiveRelationSchema(
            relation.relation_type,
            from,
            to,
            relation.concept_bindings ?? [],
            graph,
            relation.id
          );
          conceptAffected = effective.active_concept_ids.some((id) => changedConceptIds.has(id));
        }
      }
      if (!endpointAffected && !conceptAffected) continue;
      const local = engine.validateRelation(relation, graph);
      issues.push(...local);
      const errors = errorsOnly(local);
      if (errors.length) relationErrors.set(relation.id, errors);
    }
    if ((entityErrors.size || relationErrors.size) && !allowDraft) {
      throw new GraphOperationError("Mutation would violate the effective schema of this record or a dependent record/relationship. No graph change was committed. Use allow_draft only when deliberately staging a migration.", issues);
    }
    if (allowDraft) {
      for (const id of entityErrors.keys()) {
        const entity = graph.entities[id];
        if (entity && entity.status !== "draft") {
          entity.status = "draft";
          if (!changedEntityIds.has(id)) entity.revision += 1;
          entity.updated_at = nowIso();
        }
      }
      for (const id of relationErrors.keys()) {
        const relation = graph.relations[id];
        if (relation && relation.status !== "draft") {
          relation.status = "draft";
          relation.revision += 1;
          relation.updated_at = nowIso();
        }
      }
    }
    return issues;
  }
  async validateGraph() {
    const [graph, registry] = await Promise.all([this.store.loadGraph(), this.store.loadRegistry()]);
    const issues = new SchemaEngine(registry).validateGraph(graph);
    return {
      ok: issues.every((x) => x.severity !== "error"),
      generation: graph.generation,
      checked_entities: Object.keys(graph.entities).length,
      checked_relations: Object.values(graph.relations).filter((r) => r.status !== "tombstoned").length,
      errors: issues.filter((x) => x.severity === "error").length,
      warnings: issues.filter((x) => x.severity === "warning").length,
      issues
    };
  }
  async effectiveEntitySchema(entityId) {
    const [graph, registry] = await Promise.all([this.store.loadGraph(), this.store.loadRegistry()]);
    const entity = graph.entities[entityId];
    if (!entity) throw new GraphOperationError(`Entity ${entityId} was not found.`);
    return new SchemaEngine(registry).effectiveEntitySchema(entity.entity_type, entity.concept_bindings, graph, entity.id, entity.properties);
  }
  async traverse(query) {
    const [graph, registry] = await Promise.all([this.store.loadGraph(), this.store.loadRegistry()]);
    if (!graph.entities[query.start_id]) throw new GraphOperationError(`Traversal start ${query.start_id} was not found.`);
    const direction = query.direction ?? "both";
    const maxDepth = Math.min(64, Math.max(0, query.max_depth ?? 4));
    const maxNodes = Math.min(1e4, Math.max(1, query.max_nodes ?? 1e3));
    const includeTombstones = query.include_tombstoned ?? false;
    const allowed = query.relation_types ? new Set(query.relation_types) : null;
    const found = /* @__PURE__ */ new Map();
    const seenDepth = /* @__PURE__ */ new Map([[query.start_id, 0]]);
    const queue = [{ id: query.start_id, depth: 0, path: [] }];
    let truncated = false;
    if (query.include_start) found.set(query.start_id, { entity: clone(graph.entities[query.start_id]), depth: 0, via_relation_ids: [] });
    while (queue.length) {
      const current = queue.shift();
      if (current.depth >= maxDepth) continue;
      const nexts = [];
      for (const relation of Object.values(graph.relations)) {
        if (relation.status === "tombstoned" && !includeTombstones) continue;
        if (allowed && !allowed.has(relation.relation_type)) continue;
        const relationSpec = registry.relation_types[relation.relation_type];
        if ((direction === "outgoing" || direction === "both") && relation.from === current.id) nexts.push({ id: relation.to, relation });
        if ((direction === "incoming" || direction === "both") && relation.to === current.id) nexts.push({ id: relation.from, relation });
        if (relationSpec?.symmetric && (direction === "outgoing" || direction === "incoming") && (relation.from === current.id || relation.to === current.id)) nexts.push({ id: relation.from === current.id ? relation.to : relation.from, relation });
      }
      for (const next of nexts) {
        const entity = graph.entities[next.id];
        if (!entity || entity.status === "tombstoned" && !includeTombstones) continue;
        const nextDepth = current.depth + 1;
        const best = seenDepth.get(next.id);
        if (best !== void 0 && best <= nextDepth) {
          if (found.has(next.id) && !found.get(next.id).via_relation_ids.includes(next.relation.id)) found.get(next.id).via_relation_ids.push(next.relation.id);
          continue;
        }
        if (found.size >= maxNodes) {
          truncated = true;
          break;
        }
        seenDepth.set(next.id, nextDepth);
        const item = { entity: clone(entity), depth: nextDepth, via_relation_ids: [...current.path, next.relation.id] };
        found.set(next.id, item);
        queue.push({ id: next.id, depth: nextDepth, path: item.via_relation_ids });
      }
      if (truncated) break;
    }
    return { entities: [...found.values()].sort((a, b) => a.depth - b.depth || a.entity.label.localeCompare(b.entity.label)), truncated };
  }
  async mergeBundledRegistry() {
    return this.store.mergeBundledRegistry();
  }
};

// src/graph-store.ts
var import_obsidian = require("obsidian");
var json = (value) => JSON.stringify(value, null, 2) + "\n";
var deepClone = (value) => JSON.parse(JSON.stringify(value));
var sanitize = (value) => value.toLowerCase().replace(/[^a-z0-9._-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "change";
var JsonVaultGraphStore = class {
  constructor(app, pluginVersion) {
    this.app = app;
    this.pluginVersion = pluginVersion;
  }
  app;
  pluginVersion;
  rootPath = "HoloTaxon";
  graphPath = "HoloTaxon/graph.json";
  registryPath = "HoloTaxon/registry.json";
  backupFolder = "HoloTaxon/backups";
  lockTail = Promise.resolve();
  async withLock(fn) {
    const prior = this.lockTail;
    let release;
    this.lockTail = new Promise((resolve) => {
      release = resolve;
    });
    await prior;
    try {
      return await fn();
    } finally {
      release();
    }
  }
  async exists(path) {
    return await this.app.vault.adapter.exists((0, import_obsidian.normalizePath)(path));
  }
  async ensureFolder(path) {
    const normalized = (0, import_obsidian.normalizePath)(path);
    if (await this.exists(normalized)) return;
    const parts = normalized.split("/");
    let current = "";
    for (const part of parts) {
      current = current ? `${current}/${part}` : part;
      if (!await this.exists(current)) await this.app.vault.createFolder(current);
    }
  }
  async readJson(path) {
    const file = this.app.vault.getAbstractFileByPath((0, import_obsidian.normalizePath)(path));
    if (!(file instanceof import_obsidian.TFile)) throw new Error(`Expected file at ${path}; it is missing or not a file.`);
    const raw = await this.app.vault.read(file);
    try {
      return JSON.parse(raw);
    } catch (error) {
      throw new Error(`HoloTaxon refused to overwrite invalid JSON at ${path}. Preserve the file, restore a backup, or repair it manually. Parser error: ${String(error)}`);
    }
  }
  async writeJsonPreserving(path, value) {
    await this.ensureFolder(path.split("/").slice(0, -1).join("/"));
    const content = json(value);
    const tempPath = `${path}.pending-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const tempFile = await this.app.vault.create((0, import_obsidian.normalizePath)(tempPath), content);
    try {
      const existing = this.app.vault.getAbstractFileByPath((0, import_obsidian.normalizePath)(path));
      if (existing instanceof import_obsidian.TFile) await this.app.vault.modify(existing, content);
      else if (existing) throw new Error(`Refusing to replace non-file at ${path}.`);
      else await this.app.vault.create((0, import_obsidian.normalizePath)(path), content);
      await this.app.vault.delete(tempFile);
    } catch (error) {
      throw new Error(`Write failed for ${path}. Current data and a pre-write backup are retained where available. Pending candidate: ${tempPath}. ${String(error)}`);
    }
  }
  async ensureInitialized() {
    await this.ensureFolder(this.rootPath);
    await this.ensureFolder(this.backupFolder);
    await this.ensureFolder("HoloTaxon/reports");
    if (!await this.exists(this.registryPath)) {
      await this.app.vault.create(this.registryPath, json(deepClone(DEFAULT_REGISTRY)));
    }
    if (!await this.exists(this.graphPath)) {
      const now = nowIso();
      const graph = {
        graph_format_version: "1.0.0",
        graph_id: `HOLOTAXON-${now.replace(/[^0-9]/g, "").slice(0, 14)}`,
        generation: 0,
        metadata: { title: "HoloTaxon Graph", created_at: now, updated_at: now, plugin_version: this.pluginVersion, notes: ["Canonical graph data. Plugin upgrades must never replace this file with a blank template."] },
        entities: {},
        relations: {}
      };
      await this.app.vault.create(this.graphPath, json(graph));
    }
    await this.loadGraph();
    await this.loadRegistry();
  }
  async loadGraph() {
    const graph = await this.readJson(this.graphPath);
    if (!graph || typeof graph !== "object" || !graph.entities || !graph.relations || typeof graph.generation !== "number") {
      throw new Error(`Graph envelope at ${this.graphPath} is invalid. The file was not modified.`);
    }
    return graph;
  }
  async loadRegistry() {
    const registry = await this.readJson(this.registryPath);
    if (!registry?.entity_types || !registry?.relation_types || !registry?.bundled_registry_version) {
      throw new Error(`Registry at ${this.registryPath} is invalid. The file was not modified.`);
    }
    return registry;
  }
  async backupGraph(reason) {
    const graph = await this.loadGraph();
    await this.ensureFolder(this.backupFolder);
    const nonce = Math.random().toString(36).slice(2, 8);
    const filename = `graph-g${graph.generation}-${(/* @__PURE__ */ new Date()).toISOString().replace(/[:.]/g, "-")}-${sanitize(reason)}-${nonce}.json`;
    const path = `${this.backupFolder}/${filename}`;
    await this.app.vault.create((0, import_obsidian.normalizePath)(path), json(graph));
    return path;
  }
  async backupRegistry(reason) {
    const registry = await this.loadRegistry();
    const nonce = Math.random().toString(36).slice(2, 8);
    const filename = `registry-${(/* @__PURE__ */ new Date()).toISOString().replace(/[:.]/g, "-")}-${sanitize(reason)}-${nonce}.json`;
    const path = `${this.backupFolder}/${filename}`;
    await this.app.vault.create((0, import_obsidian.normalizePath)(path), json(registry));
    return path;
  }
  async saveRegistry(registry, reason) {
    await this.withLock(async () => {
      if (await this.exists(this.registryPath)) await this.backupRegistry(reason);
      await this.writeJsonPreserving(this.registryPath, registry);
    });
  }
  async transact(label, mutator, expectedGeneration) {
    return this.withLock(async () => {
      const current = await this.loadGraph();
      if (expectedGeneration !== void 0 && expectedGeneration !== current.generation) {
        throw new Error(`Stale graph generation: expected ${expectedGeneration}, current generation is ${current.generation}. Reload and retry.`);
      }
      const next = deepClone(current);
      const result = await mutator(next);
      next.generation = current.generation + 1;
      next.metadata.updated_at = nowIso();
      next.metadata.plugin_version = this.pluginVersion;
      await this.backupGraph(label);
      await this.writeJsonPreserving(this.graphPath, next);
      return result;
    });
  }
  async mergeBundledRegistry() {
    return this.withLock(async () => {
      const current = await this.loadRegistry();
      const bundled = deepClone(DEFAULT_REGISTRY);
      const merged = deepClone(current);
      const report = {
        changed: false,
        added_entity_types: [],
        added_relation_types: [],
        added_fields: [],
        conflicts: [],
        bundled_version: bundled.bundled_registry_version
      };
      for (const [typeId, bundledType] of Object.entries(bundled.entity_types)) {
        if (!merged.entity_types[typeId]) {
          merged.entity_types[typeId] = deepClone(bundledType);
          report.added_entity_types.push(typeId);
          report.changed = true;
          continue;
        }
        const currentType = merged.entity_types[typeId];
        for (const [fieldName, fieldSpec] of Object.entries(bundledType.fields)) {
          if (!currentType.fields[fieldName]) {
            currentType.fields[fieldName] = deepClone(fieldSpec);
            report.added_fields.push(`${typeId}.${fieldName}`);
            report.changed = true;
          } else if (!sameJson2(currentType.fields[fieldName], fieldSpec)) {
            report.conflicts.push({ path: `entity_types.${typeId}.fields.${fieldName}`, current_value: currentType.fields[fieldName], bundled_value: fieldSpec, resolution: "preserved_current_value" });
          }
        }
        const scalarKeys = ["axis", "description", "immutable_fields", "allow_extra_fields", "allowed_outgoing_relations", "allowed_incoming_relations"];
        for (const key of scalarKeys) {
          if (currentType[key] !== void 0 && !sameJson2(currentType[key], bundledType[key])) {
            report.conflicts.push({ path: `entity_types.${typeId}.${key}`, current_value: currentType[key], bundled_value: bundledType[key], resolution: "preserved_current_value" });
          } else if (currentType[key] === void 0 && bundledType[key] !== void 0) {
            currentType[key] = deepClone(bundledType[key]);
            report.changed = true;
          }
        }
      }
      for (const [relId, bundledRel] of Object.entries(bundled.relation_types)) {
        if (!merged.relation_types[relId]) {
          merged.relation_types[relId] = deepClone(bundledRel);
          report.added_relation_types.push(relId);
          report.changed = true;
        } else if (!sameJson2(merged.relation_types[relId], bundledRel)) report.conflicts.push({ path: `relation_types.${relId}`, current_value: merged.relation_types[relId], bundled_value: bundledRel, resolution: "preserved_current_value" });
      }
      merged.bundled_registry_version = bundled.bundled_registry_version;
      merged.registry_format_version = current.registry_format_version || bundled.registry_format_version;
      merged.metadata = { ...bundled.metadata, ...current.metadata, last_merged_bundle_version: bundled.bundled_registry_version };
      if (report.changed || current.metadata.last_merged_bundle_version !== bundled.bundled_registry_version) {
        if (await this.exists(this.registryPath)) await this.backupRegistry(`registry-merge-${bundled.bundled_registry_version}`);
        await this.writeJsonPreserving(this.registryPath, merged);
      }
      if (report.conflicts.length) {
        const reportPath = `HoloTaxon/reports/registry-merge-${(/* @__PURE__ */ new Date()).toISOString().replace(/[:.]/g, "-")}.json`;
        await this.app.vault.create((0, import_obsidian.normalizePath)(reportPath), json(report));
      }
      return report;
    });
  }
};
function sameJson2(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}

// src/main.ts
var HOLOTAXON_VIEW_TYPE = "holotaxon-dashboard";
var HoloTaxonPlugin = class extends import_obsidian2.Plugin {
  api;
  store;
  async onload() {
    this.store = new JsonVaultGraphStore(this.app, this.manifest.version);
    await this.store.ensureInitialized();
    this.api = new HoloTaxonAPI(this.store);
    const merge = await this.api.mergeBundledRegistry();
    if (merge.conflicts.length) new import_obsidian2.Notice(`HoloTaxon preserved ${merge.conflicts.length} registry conflict(s). Review HoloTaxon/reports.`);
    this.registerView(HOLOTAXON_VIEW_TYPE, (leaf) => new HoloTaxonDashboardView(leaf, this));
    this.addRibbonIcon("git-branch", "Open HoloTaxon dashboard", () => void this.openDashboard());
    this.addCommand({ id: "open-dashboard", name: "Open HoloTaxon dashboard", callback: () => void this.openDashboard() });
    this.addCommand({ id: "validate-graph", name: "Validate graph and save report", callback: () => void this.runValidation() });
    this.addCommand({ id: "create-entity", name: "Create entity from JSON", callback: () => new EntityJsonModal(this.app, this).open() });
    this.addCommand({ id: "create-relation", name: "Create relation from JSON", callback: () => new RelationJsonModal(this.app, this).open() });
    this.addCommand({ id: "export-snapshot", name: "Export graph snapshot", callback: () => void this.exportSnapshot() });
    this.addCommand({ id: "merge-registry", name: "Merge bundled registry additions (preserve conflicts)", callback: () => void this.mergeRegistry() });
    this.registerEvent(this.app.workspace.on("layout-change", () => {
    }));
  }
  onunload() {
    this.app.workspace.detachLeavesOfType(HOLOTAXON_VIEW_TYPE);
  }
  async openDashboard() {
    const existing = this.app.workspace.getLeavesOfType(HOLOTAXON_VIEW_TYPE);
    const leaf = existing[0] ?? this.app.workspace.getRightLeaf(false);
    if (!leaf) {
      new import_obsidian2.Notice("Could not open HoloTaxon view.");
      return;
    }
    await leaf.setViewState({ type: HOLOTAXON_VIEW_TYPE, active: true });
    this.app.workspace.revealLeaf(leaf);
  }
  async runValidation() {
    try {
      const report = await this.api.validateGraph();
      await ensureFolder(this.app, "HoloTaxon/reports");
      const path = `HoloTaxon/reports/validation-${(/* @__PURE__ */ new Date()).toISOString().replace(/[:.]/g, "-")}.json`;
      await this.app.vault.create(path, JSON.stringify(report, null, 2) + "\n");
      new import_obsidian2.Notice(`HoloTaxon validation: ${report.errors} error(s), ${report.warnings} warning(s). Report saved.`);
    } catch (error) {
      showError(error);
    }
  }
  async exportSnapshot() {
    try {
      const graph = await this.api.getSnapshot();
      await ensureFolder(this.app, "HoloTaxon/exports");
      const path = `HoloTaxon/exports/graph-g${graph.generation}-${(/* @__PURE__ */ new Date()).toISOString().replace(/[:.]/g, "-")}.json`;
      await this.app.vault.create(path, JSON.stringify(graph, null, 2) + "\n");
      new import_obsidian2.Notice(`Exported graph generation ${graph.generation} to ${path}.`);
    } catch (error) {
      showError(error);
    }
  }
  async mergeRegistry() {
    try {
      const result = await this.api.mergeBundledRegistry();
      new import_obsidian2.Notice(`Registry merge complete: +${result.added_entity_types.length} type(s), +${result.added_relation_types.length} relation(s), ${result.conflicts.length} conflict(s) preserved.`);
    } catch (error) {
      showError(error);
    }
  }
};
var HoloTaxonDashboardView = class extends import_obsidian2.ItemView {
  constructor(leaf, plugin) {
    super(leaf);
    this.plugin = plugin;
  }
  plugin;
  getViewType() {
    return HOLOTAXON_VIEW_TYPE;
  }
  getDisplayText() {
    return "HoloTaxon";
  }
  getIcon() {
    return "git-branch";
  }
  async onOpen() {
    await this.render();
  }
  async onClose() {
  }
  async render() {
    const root = this.containerEl.children[1];
    root.empty();
    root.createEl("h2", { text: "HoloTaxon graph runtime" });
    root.createEl("p", { text: "Layer 2 concepts are active schema operators. Layer 3 records are metrology-only and cannot reshape Layer 1 records." });
    const actionRow = root.createDiv({ cls: "holotaxon-actions" });
    actionRow.createEl("button", { text: "Refresh" }).addEventListener("click", () => void this.render());
    actionRow.createEl("button", { text: "Validate graph" }).addEventListener("click", () => void this.plugin.runValidation());
    actionRow.createEl("button", { text: "Create entity" }).addEventListener("click", () => new EntityJsonModal(this.app, this.plugin).open());
    actionRow.createEl("button", { text: "Create relation" }).addEventListener("click", () => new RelationJsonModal(this.app, this.plugin).open());
    try {
      const [graph, registry, report] = await Promise.all([this.plugin.api.getSnapshot(), this.plugin.api.getRegistry(), this.plugin.api.validateGraph()]);
      const stats = root.createDiv({ cls: "holotaxon-stats" });
      const entityCount = Object.values(graph.entities).filter((e) => e.status !== "tombstoned").length;
      const relationCount = Object.values(graph.relations).filter((r) => r.status !== "tombstoned").length;
      const axisCounts = { B: 0, M: 0, W: 0, L2: 0, L3: 0 };
      for (const entity of Object.values(graph.entities)) if (entity.status !== "tombstoned") axisCounts[entity.axis] = (axisCounts[entity.axis] ?? 0) + 1;
      stats.createEl("p", { text: `Graph ${graph.graph_id} \xB7 generation ${graph.generation} \xB7 ${entityCount} active entities \xB7 ${relationCount} active relations` });
      stats.createEl("p", { text: `Axes \u2014 B: ${axisCounts.B}, M: ${axisCounts.M}, W: ${axisCounts.W}, Layer 2: ${axisCounts.L2}, Layer 3: ${axisCounts.L3}` });
      stats.createEl("p", { text: `Registry ${registry.bundled_registry_version} \xB7 ${Object.keys(registry.entity_types).length} entity types \xB7 ${Object.keys(registry.relation_types).length} core relation types` });
      const validation = root.createEl("div", { cls: report.ok ? "holotaxon-valid" : "holotaxon-invalid" });
      validation.createEl("h3", { text: report.ok ? "Validation: no errors" : `Validation: ${report.errors} error(s)` });
      validation.createEl("p", { text: `${report.warnings} warning(s). ${report.issues.length} total issue(s).` });
      if (report.issues.length) {
        const list = validation.createEl("ul");
        report.issues.slice(0, 25).forEach((item) => list.createEl("li", { text: `[${item.severity}] ${item.code}: ${item.message}` }));
        if (report.issues.length > 25) validation.createEl("p", { text: `Showing first 25 issues. Full report is available via the Validate command.` });
      }
      root.createEl("h3", { text: "Recent records" });
      const recent = Object.values(graph.entities).filter((e) => e.status !== "tombstoned").sort((a, b) => b.updated_at.localeCompare(a.updated_at)).slice(0, 12);
      const table = root.createEl("table", { cls: "holotaxon-table" });
      const head = table.createEl("thead").createEl("tr");
      ["ID", "Axis", "Type", "Label", "Revision", "Concept bindings"].forEach((x) => head.createEl("th", { text: x }));
      const body = table.createEl("tbody");
      recent.forEach((entity) => {
        const row = body.createEl("tr");
        [entity.id, entity.axis, entity.entity_type, entity.label, String(entity.revision), entity.concept_bindings.join(", ") || "\u2014"].forEach((text) => row.createEl("td", { text }));
      });
    } catch (error) {
      root.createEl("pre", { text: String(error) });
    }
  }
};
var EntityJsonModal = class extends import_obsidian2.Modal {
  constructor(app, plugin) {
    super(app);
    this.plugin = plugin;
  }
  plugin;
  input = "";
  feedback;
  onOpen() {
    this.titleEl.setText("Create HoloTaxon entity");
    this.contentEl.createEl("p", { text: "Enter a JSON object with entity_type, label, properties, and optional concept_bindings. IDs are generated if omitted. Fields are validated against the effective schema." });
    const area = this.contentEl.createEl("textarea", { cls: "holotaxon-json-input" });
    area.rows = 15;
    area.value = JSON.stringify({ entity_type: "Population", label: "New population", properties: { population_basis: "ecological", identity_rule: "Replace with an explicit continuity rule", unit_definition: "Replace with the organismal unit definition" }, concept_bindings: [] }, null, 2);
    area.addEventListener("input", () => {
      this.input = area.value;
    });
    this.input = area.value;
    this.feedback = this.contentEl.createDiv({ cls: "holotaxon-feedback" });
    new import_obsidian2.Setting(this.contentEl).addButton((button) => button.setButtonText("Create draft if needed").setCta().onClick(async () => {
      try {
        const parsed = JSON.parse(this.input || area.value);
        const record = await this.plugin.api.createEntity(parsed, { allow_draft: true });
        this.feedback.setText(`Created ${record.id} (${record.status}).`);
        new import_obsidian2.Notice(`HoloTaxon entity ${record.id} created as ${record.status}.`);
      } catch (error) {
        this.feedback.setText(errorText(error));
      }
    })).addButton((button) => button.setButtonText("Close").onClick(() => this.close()));
  }
  onClose() {
    this.contentEl.empty();
  }
};
var RelationJsonModal = class extends import_obsidian2.Modal {
  constructor(app, plugin) {
    super(app);
    this.plugin = plugin;
  }
  plugin;
  input = "";
  feedback;
  onOpen() {
    this.titleEl.setText("Create HoloTaxon relation");
    this.contentEl.createEl("p", { text: "Enter JSON with relation_type, from, to, and optional properties, concept_bindings, and assertion metadata." });
    const area = this.contentEl.createEl("textarea", { cls: "holotaxon-json-input" });
    area.rows = 14;
    area.value = JSON.stringify({ relation_type: "MEMBER_OF_POPULATION", from: "ORGANISMALUNIT-ID", to: "POPULATION-ID", properties: {}, assertion: { epistemic_status: "proposed", definition_refs: [], evidence_refs: [], source_refs: [] } }, null, 2);
    area.addEventListener("input", () => {
      this.input = area.value;
    });
    this.input = area.value;
    this.feedback = this.contentEl.createDiv({ cls: "holotaxon-feedback" });
    new import_obsidian2.Setting(this.contentEl).addButton((button) => button.setButtonText("Create draft if needed").setCta().onClick(async () => {
      try {
        const parsed = JSON.parse(this.input || area.value);
        const record = await this.plugin.api.createRelation(parsed, { allow_draft: true });
        this.feedback.setText(`Created ${record.id} (${record.status}).`);
        new import_obsidian2.Notice(`HoloTaxon relation ${record.id} created as ${record.status}.`);
      } catch (error) {
        this.feedback.setText(errorText(error));
      }
    })).addButton((button) => button.setButtonText("Close").onClick(() => this.close()));
  }
  onClose() {
    this.contentEl.empty();
  }
};
async function ensureFolder(app, path) {
  if (await app.vault.adapter.exists(path)) return;
  const parts = path.split("/");
  let current = "";
  for (const part of parts) {
    current = current ? `${current}/${part}` : part;
    if (!await app.vault.adapter.exists(current)) await app.vault.createFolder(current);
  }
}
function errorText(error) {
  if (error instanceof GraphOperationError) return `${error.message}
${error.issues.map((i) => `[${i.severity}] ${i.code}: ${i.message}`).join("\n")}`;
  return String(error);
}
function showError(error) {
  new import_obsidian2.Notice(errorText(error), 1e4);
}
module.exports = module.exports.default;
