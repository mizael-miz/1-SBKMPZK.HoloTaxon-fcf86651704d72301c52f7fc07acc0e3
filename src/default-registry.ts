import type { CoreRegistry, EntityTypeSpec, FieldSpec, RelationTypeSpec } from "./model";

const f = (type: FieldSpec["type"], options: Omit<FieldSpec, "type"> = {}): FieldSpec => ({ type, ...options });
const fields = (items: Record<string, FieldSpec>) => items;

const entityTypes: Record<string, EntityTypeSpec> = {
  OrganismalUnit: {
    id: "OrganismalUnit", axis: "B", description: "An organismal individual under an explicit individuality convention.",
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
    id: "Population", axis: "B", description: "A delimited biological collective under a declared population definition and identity rule.",
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
    id: "PopulationState", axis: "B", description: "A time-scoped state of a persistent population entity.",
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
    id: "BiologicalSample", axis: "B", description: "Biological material or selected organismal units collected under a stated sampling design.",
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
    id: "SamplingEvent", axis: "B", description: "An event or process through which biological units, material, or observations are sampled.",
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
    id: "OrganismalMaterial", axis: "B", description: "Traceable material originating from biological or fossil sources.",
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
    id: "Lineage", axis: "B", description: "A hypothesized or stipulated evolving historical trajectory.",
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
    id: "BiologicalEvent", axis: "B", description: "A biological occurrence affecting entities or their history.",
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
    id: "TaxonConcept", axis: "M", description: "A taxonomic circumscription under a defined treatment, rank, and classification context.",
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
    id: "TaxonomicName", axis: "M", description: "A nomenclatural name object, distinct from particular name usages and taxon concepts.",
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
    id: "NameUsage", axis: "M", description: "A particular source- or treatment-scoped application of a taxonomic name.",
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
    id: "ClassificationScheme", axis: "M", description: "A defined taxonomic classification system and its versioned conventions.",
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
    id: "TaxonomicTreatment", axis: "M", description: "A versioned authority or work defining, adopting, revising, or disputing taxon concepts.",
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
    id: "TaxonomicIdentification", axis: "M", description: "A versioned identification assertion targeting an organism, sample, specimen, population, occurrence, or other referent.",
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
    id: "SpeciesDelimitationHypothesis", axis: "M", description: "A case-specific hypothesis about species boundaries under a named species concept and protocol.",
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
    id: "TaxonomicAct", axis: "M", description: "A documented classification operation, such as naming, splitting, merging, transferring, or synonymizing.",
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
    id: "CladeHypothesis", axis: "M", description: "A hypothesis of clade membership under a specified phylogenetic hypothesis.",
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
    id: "PhylogeneticHypothesis", axis: "M", description: "A versioned proposition about evolutionary relationships among specified lineages or taxa.",
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
    id: "WorldEntity", axis: "W", description: "A nonbiological referent in the fictional world, such as a material resource, structure, or environmental object.",
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
    id: "Place", axis: "W", description: "A spatial entity or region with a declared geometry and boundary basis.",
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
    id: "TemporalInterval", axis: "W", description: "An interval in a named temporal coordinate system.",
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
    id: "ChronostratigraphicUnit", axis: "W", description: "A defined time-stratigraphic unit in a specified stratigraphic scheme.",
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
    id: "Occurrence", axis: "W", description: "A scoped claim that a referent is present or existed at a place and time.",
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
    id: "EnvironmentalState", axis: "W", description: "A time- and place-scoped state of relevant environmental variables.",
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
    id: "NicheModel", axis: "W", description: "A representation of environmental conditions, resources, constraints, and interactions relevant to a biological entity.",
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
    id: "InteractionEvent", axis: "W", description: "A spatially and temporally scoped interaction involving biological entities and/or their environment.",
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
    id: "BehavioralEvent", axis: "W", description: "A particular instance of behavior attributable to one or more organismal units or populations.",
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
    id: "BehavioralPattern", axis: "W", description: "A recurring or defined behavioral pattern with a specified population, temporal, and evidentiary scope.",
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
    id: "EnvironmentalTrace", axis: "W", description: "A material or informational trace attributed, with a stated confidence, to a biological activity or process.",
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
    id: "EcologicalAnomaly", axis: "W", description: "A measured or inferred departure from an explicit behavioral or ecological baseline model.",
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
    id: "Layer2Concept", axis: "L2", description: "An executable concept/definition whose declared effects actively shape applicable Layer 1 entity or relationship schemas.",
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
    id: "Layer3Metric", axis: "L3", description: "A metric specification that measures or operationalizes a construct without changing the schema of the measured entity.",
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
    id: "MeasurementEvent", axis: "L3", description: "A particular application of a measurement protocol to a target.",
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
    id: "MeasurementResult", axis: "L3", description: "A value, estimate, distribution, category, or other output produced by a measurement event.",
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
    id: "UncertaintyModel", axis: "L3", description: "A declared model for measurement, parameter, temporal, epistemic, or model uncertainty.",
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
    id: "EvidenceEvaluation", axis: "L3", description: "An evaluation of evidence in relation to a specified claim and decision context.",
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

const relationTypes: Record<string, RelationTypeSpec> = {};
const addRelation = (id: string, from_types: string[], to_types: string[], description: string, options: Partial<RelationTypeSpec> = {}) => {
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

// Relationship domains/ranges are authoritative for base edge legality. Derive the default
// per-entity adjacency allowlists from those declarations to avoid duplicated, drifting lists.
for (const entityType of Object.values(entityTypes)) {
  entityType.allowed_outgoing_relations = Object.values(relationTypes)
    .filter(rel => rel.from_types.includes(entityType.id) || rel.from_types.includes("*"))
    .map(rel => rel.id);
  entityType.allowed_incoming_relations = Object.values(relationTypes)
    .filter(rel => rel.to_types.includes(entityType.id) || rel.to_types.includes("*"))
    .map(rel => rel.id);
}

export const DEFAULT_REGISTRY: CoreRegistry = {
  registry_format_version: "1.0.0",
  bundled_registry_version: "0.1.0",
  entity_types: entityTypes,
  relation_types: relationTypes,
  metadata: {
    description: "HoloTaxon core registry. Layer 2 concept instances in the graph can actively modify applicable entity and relation schemas. Layer 3 entities are observational/metrological only.",
    upgrade_policy: "additive-preserve-conflicts"
  }
};
