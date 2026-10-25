"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SchemaEngine = void 0;
const model_1 = require("./model");
const issue = (code, message, target_id, path, severity = "error", details) => ({ code, message, target_id, path, severity, details });
const stableJson = (value) => JSON.stringify(value, Object.keys((0, model_1.isRecord)(value) ? value : {}).sort());
const sameJson = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const pathValue = (data, path) => path.split(".").reduce((cur, part) => (0, model_1.isRecord)(cur) ? cur[part] : undefined, data);
const hasPath = (data, path) => path.split(".").every((part, index, parts) => {
    let cur = data;
    for (let i = 0; i <= index; i++)
        cur = (0, model_1.isRecord)(cur) ? cur[parts[i]] : undefined;
    return cur !== undefined;
});
function validCondition(properties, condition) {
    const value = pathValue(properties, condition.field);
    switch (condition.operator) {
        case "equals": return value === condition.value;
        case "not_equals": return value !== condition.value;
        case "in": return Array.isArray(condition.value) && condition.value.includes(value);
        case "exists": return value !== undefined;
        default: return false;
    }
}
function applyConstraint(properties, c) {
    if (c.when && !validCondition(properties, c.when))
        return true;
    const present = hasPath(properties, c.field);
    const value = pathValue(properties, c.field);
    switch (c.operator) {
        case "equals": return value === c.value;
        case "not_equals": return value !== c.value;
        case "in": return Array.isArray(c.value) && c.value.includes(value);
        case "not_in": return Array.isArray(c.value) && !c.value.includes(value);
        case "exists": return present;
        case "not_exists": return !present;
        case "min": return typeof value === "number" && typeof c.value === "number" && value >= c.value;
        case "max": return typeof value === "number" && typeof c.value === "number" && value <= c.value;
        case "requires_field": return !present || (typeof c.value === "string" && hasPath(properties, c.value));
        case "forbids_field": return !present || (typeof c.value === "string" && !hasPath(properties, c.value));
        default: return false;
    }
}
function validateFieldValue(value, spec, path, targetId, graph) {
    const out = [];
    if (value === null) {
        if (spec.nullable)
            return out;
        return [issue("NULL_NOT_ALLOWED", `${path} is null but the field is not nullable.`, targetId, path)];
    }
    const typeOkay = (() => {
        switch (spec.type) {
            case "string": return typeof value === "string";
            case "number": return typeof value === "number" && Number.isFinite(value);
            case "integer": return typeof value === "number" && Number.isInteger(value);
            case "boolean": return typeof value === "boolean";
            case "object": return (0, model_1.isRecord)(value);
            case "array":
            case "reference_list":
            case "string_list": return Array.isArray(value);
            case "reference": return typeof value === "string";
            case "any": return true;
            default: return false;
        }
    })();
    if (!typeOkay)
        return [issue("FIELD_TYPE_MISMATCH", `${path} must have type ${spec.type}.`, targetId, path, "error", { actual: Array.isArray(value) ? "array" : typeof value })];
    if (spec.enum && !spec.enum.some(v => sameJson(v, value)))
        out.push(issue("FIELD_VALUE_NOT_IN_ENUM", `${path} must be one of the declared enum values.`, targetId, path, "error", { allowed: spec.enum }));
    if (typeof value === "number") {
        if (spec.min !== undefined && value < spec.min)
            out.push(issue("FIELD_BELOW_MIN", `${path} must be >= ${spec.min}.`, targetId, path));
        if (spec.max !== undefined && value > spec.max)
            out.push(issue("FIELD_ABOVE_MAX", `${path} must be <= ${spec.max}.`, targetId, path));
    }
    if (typeof value === "string" && spec.pattern) {
        try {
            if (!new RegExp(spec.pattern).test(value))
                out.push(issue("FIELD_PATTERN_MISMATCH", `${path} does not match its declared pattern.`, targetId, path));
        }
        catch {
            out.push(issue("INVALID_SCHEMA_PATTERN", `Schema pattern for ${path} is invalid.`, targetId, path));
        }
    }
    if (Array.isArray(value)) {
        if (spec.min_items !== undefined && value.length < spec.min_items)
            out.push(issue("ARRAY_TOO_SHORT", `${path} requires at least ${spec.min_items} items.`, targetId, path));
        if (spec.max_items !== undefined && value.length > spec.max_items)
            out.push(issue("ARRAY_TOO_LONG", `${path} allows at most ${spec.max_items} items.`, targetId, path));
        if (spec.unique_items && new Set(value.map(v => JSON.stringify(v))).size !== value.length)
            out.push(issue("ARRAY_ITEMS_NOT_UNIQUE", `${path} requires unique items.`, targetId, path));
        if (spec.items)
            value.forEach((item, i) => out.push(...validateFieldValue(item, spec.items, `${path}[${i}]`, targetId, graph)));
        if (spec.type === "string_list")
            value.forEach((item, i) => { if (typeof item !== "string")
                out.push(issue("ARRAY_ITEM_TYPE_MISMATCH", `${path}[${i}] must be a string.`, targetId, `${path}[${i}]`)); });
        if (spec.type === "reference_list")
            value.forEach((item, i) => {
                if (typeof item !== "string") {
                    out.push(issue("REFERENCE_TYPE_MISMATCH", `${path}[${i}] must be an entity ID.`, targetId, `${path}[${i}]`));
                    return;
                }
                const target = graph.entities[item];
                if (!target)
                    out.push(issue("REFERENCE_NOT_FOUND", `${path}[${i}] references missing entity ${item}.`, targetId, `${path}[${i}]`));
                else if (spec.ref_types?.length && !spec.ref_types.includes(target.entity_type))
                    out.push(issue("REFERENCE_TARGET_TYPE_MISMATCH", `${path}[${i}] must refer to one of: ${spec.ref_types.join(", ")}.`, targetId, `${path}[${i}]`));
            });
    }
    if (spec.type === "reference") {
        const target = graph.entities[value];
        if (!target)
            out.push(issue("REFERENCE_NOT_FOUND", `${path} references missing entity ${String(value)}.`, targetId, path));
        else if (spec.ref_types?.length && !spec.ref_types.includes(target.entity_type))
            out.push(issue("REFERENCE_TARGET_TYPE_MISMATCH", `${path} must refer to one of: ${spec.ref_types.join(", ")}.`, targetId, path));
    }
    if ((0, model_1.isRecord)(value)) {
        if (spec.properties) {
            for (const [key, childSpec] of Object.entries(spec.properties)) {
                if (value[key] === undefined && childSpec.required)
                    out.push(issue("REQUIRED_NESTED_FIELD_MISSING", `${path}.${key} is required.`, targetId, `${path}.${key}`));
                else if (value[key] !== undefined)
                    out.push(...validateFieldValue(value[key], childSpec, `${path}.${key}`, targetId, graph));
            }
        }
        if (spec.additional_properties === false && spec.properties) {
            for (const key of Object.keys(value))
                if (!(key in spec.properties))
                    out.push(issue("UNKNOWN_NESTED_FIELD", `${path}.${key} is not allowed.`, targetId, `${path}.${key}`));
        }
    }
    return out;
}
class SchemaEngine {
    registry;
    constructor(registry) {
        this.registry = registry;
    }
    conceptProps(record) {
        if (record.entity_type !== "Layer2Concept" || !(0, model_1.isRecord)(record.properties))
            return null;
        const p = record.properties;
        if (typeof p.concept_kind !== "string" || typeof p.lifecycle !== "string" || !(0, model_1.isRecord)(p.effects))
            return null;
        return p;
    }
    activeConceptClosure(bindings, graph, targetId) {
        const issues = [];
        const ordered = [];
        const visiting = new Set();
        const visited = new Set();
        const visit = (id, depth) => {
            if (visited.has(id))
                return;
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
            for (const parentId of props.extends_concept_ids ?? [])
                visit(parentId, depth + 1);
            visiting.delete(id);
            visited.add(id);
            if (props.lifecycle === "draft" || record.status === "draft")
                issues.push(issue("DRAFT_CONCEPT_BOUND", `Draft concept ${id} is bound to a record.`, targetId, "concept_bindings"));
            if (props.lifecycle === "deprecated")
                issues.push(issue("DEPRECATED_CONCEPT_BOUND", `Deprecated concept ${id} remains bound; its prior effects are still applied.`, targetId, "concept_bindings", "warning"));
            ordered.push({ id, record, props, depth });
        };
        for (const id of bindings)
            visit(id, 0);
        const ids = new Set(ordered.map(c => c.id));
        for (const concept of ordered) {
            const p = concept.props;
            for (const req of p.requires_concept_ids ?? [])
                if (!ids.has(req))
                    issues.push(issue("REQUIRED_CONCEPT_NOT_BOUND", `Concept ${concept.id} requires concept ${req} to be bound or inherited.`, targetId, "concept_bindings", "error", { concept_id: concept.id, required_concept_id: req }));
            for (const excluded of p.excludes_concept_ids ?? [])
                if (ids.has(excluded))
                    issues.push(issue("EXCLUDED_CONCEPT_BOUND", `Concepts ${concept.id} and ${excluded} cannot be active together.`, targetId, "concept_bindings", "error", { concept_id: concept.id, excluded_concept_id: excluded }));
        }
        return { concepts: ordered, issues };
    }
    effectiveEntitySchema(entityType, bindings, graph, targetId, properties = {}) {
        const type = this.registry.entity_types[entityType];
        const issues = [];
        if (!type) {
            issues.push(issue("UNKNOWN_ENTITY_TYPE", `Entity type ${entityType} is not in the active registry.`, targetId));
            return { entity_type: entityType, axis: "?", fields: {}, forbidden_fields: new Set(), constraints: [], allowed_outgoing_relations: new Set(), allowed_incoming_relations: new Set(), denied_outgoing_relations: new Set(), denied_incoming_relations: new Set(), required_relations: [], conditional_required_fields: [], conditional_forbidden_fields: [], active_concept_ids: [], issues };
        }
        const fields = structuredClone(type.fields);
        const origins = new Map(Object.keys(fields).map(key => [key, "$base"]));
        const forbidden = new Set();
        const constraints = [];
        let outgoing = type.allowed_outgoing_relations === "*" ? "*" : new Set(type.allowed_outgoing_relations ?? []);
        let incoming = type.allowed_incoming_relations === "*" ? "*" : new Set(type.allowed_incoming_relations ?? []);
        const deniedOut = new Set();
        const deniedIn = new Set();
        const requiredRelations = [];
        const conditionalRequired = [];
        const conditionalForbidden = [];
        const closure = this.activeConceptClosure(bindings, graph, targetId);
        issues.push(...closure.issues);
        const concepts = closure.concepts;
        const conceptIds = new Set(concepts.map(c => c.id));
        for (const c of concepts) {
            const p = c.props;
            if (!(p.applies_to_entity_types ?? []).includes("*") && !(p.applies_to_entity_types ?? []).includes(entityType)) {
                issues.push(issue("CONCEPT_NOT_APPLICABLE_TO_ENTITY_TYPE", `Concept ${c.id} does not declare applicability to entity type ${entityType}.`, targetId, "concept_bindings", "error", { applies_to: p.applies_to_entity_types ?? [] }));
            }
            const l3Types = (p.applies_to_entity_types ?? []).filter(t => this.registry.entity_types[t]?.axis === "L3");
            if (l3Types.length)
                issues.push(issue("L3_SCHEMA_MUTATION_FORBIDDEN", `Layer 2 concept ${c.id} may not reshape Layer 3 entity types.`, c.id, "properties.applies_to_entity_types", "error", { forbidden_targets: l3Types }));
            const fx = p.effects.entities;
            if (!fx)
                continue;
            for (const [key, spec] of Object.entries(fx.add_fields ?? {})) {
                if (key in fields) {
                    if (sameJson(fields[key], spec) && origins.get(key) === c.id)
                        continue;
                    issues.push(issue("CONCEPT_FIELD_ADD_COLLISION", `Concept ${c.id} adds field ${key}, but it already exists. Use override_fields or an explicit concept inheritance relationship.`, targetId, `properties.${key}`, "error", { concept_id: c.id, existing_origin: origins.get(key) }));
                }
                else {
                    fields[key] = structuredClone(spec);
                    origins.set(key, c.id);
                    forbidden.delete(key);
                }
            }
            for (const [key, spec] of Object.entries(fx.override_fields ?? {})) {
                if (!(key in fields)) {
                    issues.push(issue("CONCEPT_OVERRIDE_TARGET_MISSING", `Concept ${c.id} overrides field ${key}, but that field does not exist in its inherited schema.`, targetId, `properties.${key}`, "error", { concept_id: c.id }));
                    continue;
                }
                const origin = origins.get(key) ?? "$base";
                const originIsAncestor = origin === "$base" || this.isAncestorConcept(origin, c.id, graph, new Set());
                if (!originIsAncestor) {
                    issues.push(issue("CONCEPT_OVERRIDE_CONFLICT", `Concept ${c.id} conflicts with an override of ${key} from unrelated concept ${origin}.`, targetId, `properties.${key}`, "error", { concept_id: c.id, existing_origin: origin }));
                    continue;
                }
                fields[key] = structuredClone(spec);
                origins.set(key, c.id);
                forbidden.delete(key);
            }
            for (const key of fx.remove_fields ?? []) {
                if ((type.immutable_fields ?? []).includes(key)) {
                    issues.push(issue("IMMUTABLE_FIELD_REMOVAL", `Concept ${c.id} may not remove immutable field ${key}.`, targetId, `properties.${key}`));
                    continue;
                }
                if (!(key in fields)) {
                    issues.push(issue("CONCEPT_REMOVE_TARGET_MISSING", `Concept ${c.id} removes field ${key}, but the field is not present in the composed schema.`, targetId, `properties.${key}`, "warning"));
                    continue;
                }
                delete fields[key];
                origins.delete(key);
                forbidden.add(key);
            }
            for (const key of fx.required_fields ?? []) {
                if (!(key in fields))
                    issues.push(issue("CONCEPT_REQUIRED_FIELD_MISSING_FROM_SCHEMA", `Concept ${c.id} requires ${key}, but it is not present in the composed schema.`, targetId, `properties.${key}`));
                else
                    fields[key] = { ...fields[key], required: true };
            }
            for (const key of fx.forbidden_fields ?? []) {
                forbidden.add(key);
                if (key in fields && fields[key].required)
                    issues.push(issue("FIELD_BOTH_REQUIRED_AND_FORBIDDEN", `Concept ${c.id} both requires and forbids field ${key}.`, targetId, `properties.${key}`));
            }
            constraints.push(...(fx.constraints ?? []));
            (fx.required_relations ?? []).forEach(r => requiredRelations.push(r));
            (fx.conditional_required_fields ?? []).forEach(r => conditionalRequired.push(r));
            (fx.conditional_forbidden_fields ?? []).forEach(r => conditionalForbidden.push(r));
            if (fx.allow_outgoing_relations?.length) {
                const current = outgoing;
                if (current !== "*")
                    fx.allow_outgoing_relations.forEach(x => current.add(x));
            }
            if (fx.allow_incoming_relations?.length) {
                const current = incoming;
                if (current !== "*")
                    fx.allow_incoming_relations.forEach(x => current.add(x));
            }
            if (fx.restrict_outgoing_relations?.length)
                outgoing = outgoing === "*" ? new Set(fx.restrict_outgoing_relations) : new Set([...outgoing].filter(x => fx.restrict_outgoing_relations.includes(x)));
            if (fx.restrict_incoming_relations?.length)
                incoming = incoming === "*" ? new Set(fx.restrict_incoming_relations) : new Set([...incoming].filter(x => fx.restrict_incoming_relations.includes(x)));
            fx.deny_outgoing_relations?.forEach(x => deniedOut.add(x));
            fx.deny_incoming_relations?.forEach(x => deniedIn.add(x));
            for (const key of forbidden) {
                if (properties[key] !== undefined)
                    issues.push(issue("REMOVED_OR_FORBIDDEN_FIELD_DATA_PRESERVED", `Field ${key} is no longer permitted by the active concepts. Its value has been preserved and must be explicitly migrated or retained in extension_data.`, targetId, `properties.${key}`, "error", { value_preserved: true }));
            }
        }
        for (const key of forbidden) {
            if (fields[key]?.required)
                issues.push(issue("FIELD_BOTH_REQUIRED_AND_FORBIDDEN", `Field ${key} is both required and forbidden in the composed schema.`, targetId, `properties.${key}`));
        }
        return { entity_type: entityType, axis: type.axis, fields, forbidden_fields: forbidden, constraints, allowed_outgoing_relations: outgoing, allowed_incoming_relations: incoming, denied_outgoing_relations: deniedOut, denied_incoming_relations: deniedIn, required_relations: requiredRelations, conditional_required_fields: conditionalRequired, conditional_forbidden_fields: conditionalForbidden, active_concept_ids: [...conceptIds], issues };
    }
    isAncestorConcept(ancestorId, childId, graph, seen) {
        if (seen.has(childId))
            return false;
        seen.add(childId);
        const child = graph.entities[childId];
        const props = child ? this.conceptProps(child) : null;
        if (!props)
            return false;
        for (const parentId of props.extends_concept_ids ?? []) {
            if (parentId === ancestorId || this.isAncestorConcept(ancestorId, parentId, graph, seen))
                return true;
        }
        return false;
    }
    effectiveRelationSchema(relationType, fromEntity, toEntity, bindings, graph, targetId) {
        const issues = [];
        const candidates = [...fromEntity.concept_bindings, ...toEntity.concept_bindings, ...bindings];
        const closure = this.activeConceptClosure([...new Set(candidates)], graph, targetId);
        issues.push(...closure.issues);
        const concepts = closure.concepts;
        const dynamicSpecs = new Map();
        for (const c of concepts) {
            for (const relSpec of c.props.effects.add_relation_types ?? []) {
                if (relSpec.id !== relationType)
                    continue;
                if (!(c.props.applies_to_relation_types ?? []).includes("*") && !(c.props.applies_to_relation_types ?? []).includes(relationType)) {
                    issues.push(issue("CONCEPT_ADDED_RELATION_NOT_DECLARED_APPLICABLE", `Concept ${c.id} adds ${relationType} without declaring it in applies_to_relation_types.`, c.id, "properties.effects.add_relation_types"));
                }
                const previous = dynamicSpecs.get(relSpec.id);
                if (previous && !sameJson(previous, relSpec))
                    issues.push(issue("DYNAMIC_RELATION_TYPE_CONFLICT", `Active concepts define incompatible relation type ${relSpec.id}.`, targetId, "relation_type", "error", { concept_ids: [c.id] }));
                else
                    dynamicSpecs.set(relSpec.id, relSpec);
            }
        }
        for (const c of concepts) {
            if ((c.props.effects.remove_relation_types ?? []).includes(relationType))
                issues.push(issue("RELATION_TYPE_REMOVED_BY_CONCEPT", `Active concept ${c.id} prohibits relation type ${relationType} in this scope.`, targetId, "relation_type"));
        }
        const staticSpec = this.registry.relation_types[relationType];
        const spec = staticSpec ?? dynamicSpecs.get(relationType);
        if (!spec)
            issues.push(issue("UNKNOWN_RELATION_TYPE", `Relation type ${relationType} is not defined in the core registry or active Layer 2 concepts.`, targetId, "relation_type"));
        if (staticSpec && dynamicSpecs.has(relationType) && !sameJson(staticSpec, dynamicSpecs.get(relationType)))
            issues.push(issue("CORE_RELATION_TYPE_REDEFINITION", `A Layer 2 concept cannot redefine core relation type ${relationType}; it may add constraints or fields only.`, targetId, "relation_type"));
        const props = { ...(spec?.properties ?? {}) };
        const origins = new Map(Object.keys(props).map(k => [k, "$base"]));
        const forbidden = new Set();
        const constraints = [];
        for (const c of concepts) {
            const applies = (c.props.applies_to_relation_types ?? []).includes("*") || (c.props.applies_to_relation_types ?? []).includes(relationType);
            if (!applies)
                continue;
            const fx = c.props.effects.relations;
            if (!fx)
                continue;
            for (const [key, field] of Object.entries(fx.add_property_fields ?? {})) {
                if (key in props)
                    issues.push(issue("CONCEPT_RELATION_FIELD_ADD_COLLISION", `Concept ${c.id} adds relation property ${key}, but it already exists.`, targetId, `properties.${key}`));
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
                if (origin !== "$base" && !this.isAncestorConcept(origin, c.id, graph, new Set())) {
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
                if (!(key in props))
                    issues.push(issue("CONCEPT_RELATION_REQUIRED_FIELD_MISSING", `Concept ${c.id} requires absent relation property ${key}.`, targetId, `properties.${key}`));
                else
                    props[key] = { ...props[key], required: true };
            }
            for (const key of fx.forbidden_property_fields ?? [])
                forbidden.add(key);
            constraints.push(...(fx.constraints ?? []));
        }
        return { relation_type: relationType, spec, properties: props, forbidden_properties: forbidden, constraints, active_concept_ids: concepts.map(c => c.id), issues };
    }
    validateConceptDefinition(record, graph) {
        const out = [];
        const p = this.conceptProps(record);
        if (!p)
            return [issue("MALFORMED_LAYER2_CONCEPT", "Layer2Concept requires concept_kind, lifecycle, and effects object.", record.id, "properties")];
        if (!p.rationale || !p.definition_version)
            out.push(issue("CONCEPT_METADATA_REQUIRED", "Layer 2 concept requires rationale and definition_version.", record.id, "properties"));
        const allowedEffectKeys = ["entities", "relations", "add_relation_types", "remove_relation_types"];
        for (const key of Object.keys(p.effects))
            if (!allowedEffectKeys.includes(key))
                out.push(issue("UNKNOWN_LAYER2_EFFECT_KIND", `Unknown effect block ${key}; the runtime will not execute it.`, record.id, `properties.effects.${key}`));
        if (p.effects.entities && !(0, model_1.isRecord)(p.effects.entities))
            out.push(issue("INVALID_ENTITY_EFFECTS", "effects.entities must be an object.", record.id, "properties.effects.entities"));
        if (p.effects.relations && !(0, model_1.isRecord)(p.effects.relations))
            out.push(issue("INVALID_RELATION_EFFECTS", "effects.relations must be an object.", record.id, "properties.effects.relations"));
        for (const [name, list] of Object.entries({
            remove_fields: p.effects.entities?.remove_fields, required_fields: p.effects.entities?.required_fields,
            forbidden_fields: p.effects.entities?.forbidden_fields, allow_outgoing_relations: p.effects.entities?.allow_outgoing_relations,
            restrict_outgoing_relations: p.effects.entities?.restrict_outgoing_relations, deny_outgoing_relations: p.effects.entities?.deny_outgoing_relations,
            allow_incoming_relations: p.effects.entities?.allow_incoming_relations, restrict_incoming_relations: p.effects.entities?.restrict_incoming_relations,
            deny_incoming_relations: p.effects.entities?.deny_incoming_relations, remove_property_fields: p.effects.relations?.remove_property_fields,
            required_property_fields: p.effects.relations?.required_property_fields, forbidden_property_fields: p.effects.relations?.forbidden_property_fields,
            remove_relation_types: p.effects.remove_relation_types
        }))
            if (list !== undefined && (!Array.isArray(list) || !list.every(x => typeof x === "string")))
                out.push(issue("INVALID_EFFECT_STRING_LIST", `effects.${name} must be an array of strings.`, record.id, `properties.effects.${name}`));
        const types = [...(p.applies_to_entity_types ?? []), ...(p.applies_to_relation_types ?? [])];
        if (types.length === 0)
            out.push(issue("CONCEPT_APPLICABILITY_EMPTY", "Layer 2 concept must declare at least one applicable entity or relation type.", record.id, "properties.applies_to_entity_types"));
        for (const t of p.applies_to_entity_types ?? []) {
            if (t !== "*" && !this.registry.entity_types[t])
                out.push(issue("CONCEPT_UNKNOWN_ENTITY_TARGET", `Concept targets unknown entity type ${t}.`, record.id, "properties.applies_to_entity_types"));
            if (this.registry.entity_types[t]?.axis === "L3")
                out.push(issue("L3_SCHEMA_MUTATION_FORBIDDEN", `Layer 2 concepts cannot alter Layer 3 type ${t}.`, record.id, "properties.applies_to_entity_types"));
        }
        for (const t of p.applies_to_relation_types ?? []) {
            if (t !== "*" && !this.registry.relation_types[t] && !(p.effects.add_relation_types ?? []).some(r => r.id === t)) {
                // A relation type may be contributed by another concept; validation is resolved at binding time.
                out.push(issue("CONCEPT_RELATION_TARGET_NOT_IN_CORE_REGISTRY", `Relation type ${t} is not core-defined and is not added by this concept; ensure a bound ancestor or sibling extension provides it.`, record.id, "properties.applies_to_relation_types", "warning"));
            }
        }
        const allIds = [...(p.extends_concept_ids ?? []), ...(p.requires_concept_ids ?? []), ...(p.excludes_concept_ids ?? [])];
        for (const id of allIds) {
            const target = graph.entities[id];
            if (!target || target.entity_type !== "Layer2Concept")
                out.push(issue("CONCEPT_DEPENDENCY_NOT_FOUND", `Concept dependency ${id} does not reference an existing Layer2Concept.`, record.id, "properties"));
        }
        for (const [key, field] of Object.entries(p.effects.entities?.add_fields ?? {}))
            out.push(...this.validateFieldSpec(field, `${record.id}.effects.entities.add_fields.${key}`, record.id));
        for (const [key, field] of Object.entries(p.effects.entities?.override_fields ?? {}))
            out.push(...this.validateFieldSpec(field, `${record.id}.effects.entities.override_fields.${key}`, record.id));
        for (const [key, field] of Object.entries(p.effects.relations?.add_property_fields ?? {}))
            out.push(...this.validateFieldSpec(field, `${record.id}.effects.relations.add_property_fields.${key}`, record.id));
        for (const rel of p.effects.add_relation_types ?? []) {
            if (!rel.id || !Array.isArray(rel.from_types) || !Array.isArray(rel.to_types) || !(0, model_1.isRecord)(rel.properties))
                out.push(issue("MALFORMED_DYNAMIC_RELATION_TYPE", `Dynamic relation type in ${record.id} requires id, from_types, to_types, and properties.`, record.id, "properties.effects.add_relation_types"));
            for (const t of [...rel.from_types, ...rel.to_types])
                if (!this.registry.entity_types[t])
                    out.push(issue("DYNAMIC_RELATION_UNKNOWN_ENDPOINT_TYPE", `Dynamic relation ${rel.id} references unknown endpoint entity type ${t}.`, record.id, "properties.effects.add_relation_types"));
            for (const [key, field] of Object.entries(rel.properties ?? {}))
                out.push(...this.validateFieldSpec(field, `${record.id}.effects.add_relation_types.${rel.id}.properties.${key}`, record.id));
            for (const t of [...rel.from_types, ...rel.to_types])
                if (this.registry.entity_types[t]?.axis === "L3")
                    out.push(issue("L3_SCHEMA_MUTATION_FORBIDDEN", `Layer 2 concept must not define dynamic relations targeting Layer 3 type ${t}.`, record.id, "properties.effects.add_relation_types"));
        }
        return out;
    }
    validateFieldSpec(spec, path, targetId) {
        const out = [];
        const types = ["string", "number", "integer", "boolean", "object", "array", "reference", "reference_list", "string_list", "any"];
        if (!spec || !types.includes(spec.type))
            return [issue("INVALID_FIELD_SPEC", `${path} has an unsupported or missing field type.`, targetId, path)];
        if (spec.enum && !Array.isArray(spec.enum))
            out.push(issue("INVALID_FIELD_ENUM", `${path}.enum must be an array.`, targetId, `${path}.enum`));
        if (spec.type === "reference" || spec.type === "reference_list")
            for (const type of spec.ref_types ?? [])
                if (!this.registry.entity_types[type])
                    out.push(issue("INVALID_REFERENCE_TYPE", `${path} references unknown entity type ${type}.`, targetId, `${path}.ref_types`));
        return out;
    }
    validateEntity(entity, graph) {
        const issues = [];
        const type = this.registry.entity_types[entity.entity_type];
        if (!type)
            return [issue("UNKNOWN_ENTITY_TYPE", `Entity type ${entity.entity_type} is unknown.`, entity.id, "entity_type")];
        if (entity.axis !== type.axis)
            issues.push(issue("ENTITY_AXIS_MISMATCH", `Entity ${entity.id} axis ${entity.axis} does not match registry axis ${type.axis}.`, entity.id, "axis"));
        if (!Array.isArray(entity.concept_bindings))
            issues.push(issue("INVALID_CONCEPT_BINDINGS", "concept_bindings must be an array of Layer2Concept IDs.", entity.id, "concept_bindings"));
        const effective = this.effectiveEntitySchema(entity.entity_type, entity.concept_bindings ?? [], graph, entity.id, entity.properties ?? {});
        issues.push(...effective.issues);
        if (!(0, model_1.isRecord)(entity.properties))
            return [...issues, issue("ENTITY_PROPERTIES_NOT_OBJECT", "Entity properties must be a JSON object.", entity.id, "properties")];
        for (const [key, spec] of Object.entries(effective.fields)) {
            if (entity.properties[key] === undefined) {
                if (spec.required)
                    issues.push(issue("REQUIRED_FIELD_MISSING", `Required property ${key} is missing.`, entity.id, `properties.${key}`));
            }
            else
                issues.push(...validateFieldValue(entity.properties[key], spec, `properties.${key}`, entity.id, graph));
        }
        for (const key of Object.keys(entity.properties)) {
            if (effective.forbidden_fields.has(key))
                issues.push(issue("FORBIDDEN_FIELD_PRESENT", `Property ${key} is forbidden by an active concept; its stored value is preserved.`, entity.id, `properties.${key}`));
            else if (!(key in effective.fields)) {
                const severity = entity.status === "active" ? "error" : "warning";
                issues.push(issue("UNKNOWN_OR_INACTIVE_FIELD", `Property ${key} is not in the effective schema. The value is preserved; bind its defining concept, migrate explicitly, or move it to extension_data.`, entity.id, `properties.${key}`, severity));
            }
        }
        for (const c of effective.constraints)
            if (!applyConstraint(entity.properties, c))
                issues.push(issue("CONCEPT_CONSTRAINT_FAILED", c.message ?? `Constraint ${c.operator} failed for field ${c.field}.`, entity.id, `properties.${c.field}`, "error", { operator: c.operator, value: c.value }));
        for (const rule of effective.conditional_required_fields)
            if (validCondition(entity.properties, rule.when))
                for (const field of rule.fields) {
                    if (!(field in effective.fields))
                        issues.push(issue("CONDITIONAL_REQUIRED_FIELD_NOT_IN_SCHEMA", `A conditional rule requires ${field}, but it is absent from the effective schema.`, entity.id, `properties.${field}`));
                    else if (entity.properties[field] === undefined)
                        issues.push(issue("CONDITIONAL_REQUIRED_FIELD_MISSING", `Property ${field} is required when ${rule.when.field} satisfies ${rule.when.operator}.`, entity.id, `properties.${field}`));
                }
        for (const rule of effective.conditional_forbidden_fields)
            if (validCondition(entity.properties, rule.when))
                for (const field of rule.fields) {
                    if (entity.properties[field] !== undefined)
                        issues.push(issue("CONDITIONAL_FORBIDDEN_FIELD_PRESENT", `Property ${field} is forbidden when ${rule.when.field} satisfies ${rule.when.operator}; stored data is preserved.`, entity.id, `properties.${field}`));
                }
        for (const [field, expected] of Object.entries(this.conceptApplicabilityValues(entity.concept_bindings ?? [], graph))) {
            if (entity.properties[field] !== expected)
                issues.push(issue("CONCEPT_APPLICABILITY_CONDITION_FAILED", `Active concept requires ${field}=${JSON.stringify(expected)}.`, entity.id, `properties.${field}`));
        }
        if (entity.entity_type === "Layer2Concept")
            issues.push(...this.validateConceptDefinition(entity, graph));
        if (type.axis === "L3" && entity.concept_bindings?.length)
            issues.push(issue("L3_CANNOT_BE_GOVERNED_BY_LAYER2", "Layer 3 metrology records cannot be reshaped by Layer 2 concept bindings.", entity.id, "concept_bindings"));
        if (entity.status === "tombstoned")
            issues.push(issue("TOMBSTONED_ENTITY", "Entity is retained as a tombstone and excluded from normal queries.", entity.id, "status", "info"));
        return issues;
    }
    conceptApplicabilityValues(bindings, graph) {
        const values = {};
        const closure = this.activeConceptClosure(bindings, graph);
        for (const concept of closure.concepts) {
            for (const [key, value] of Object.entries(concept.props.applicability?.required_property_values ?? {})) {
                if (key in values && !sameJson(values[key], value))
                    values[`__conflict__${key}`] = true;
                else
                    values[key] = value;
            }
        }
        return values;
    }
    validateRelation(relation, graph) {
        const issues = [];
        const from = graph.entities[relation.from];
        const to = graph.entities[relation.to];
        if (!from)
            issues.push(issue("RELATION_SOURCE_NOT_FOUND", `Relation source ${relation.from} does not exist.`, relation.id, "from"));
        if (!to)
            issues.push(issue("RELATION_TARGET_NOT_FOUND", `Relation target ${relation.to} does not exist.`, relation.id, "to"));
        if (!from || !to)
            return issues;
        const effective = this.effectiveRelationSchema(relation.relation_type, from, to, relation.concept_bindings ?? [], graph, relation.id);
        issues.push(...effective.issues);
        if (!effective.spec)
            return issues;
        const spec = effective.spec;
        if (!spec.from_types.includes("*") && !spec.from_types.includes(from.entity_type))
            issues.push(issue("RELATION_SOURCE_TYPE_NOT_ALLOWED", `${relation.relation_type} does not allow source type ${from.entity_type}.`, relation.id, "from"));
        if (!spec.to_types.includes("*") && !spec.to_types.includes(to.entity_type))
            issues.push(issue("RELATION_TARGET_TYPE_NOT_ALLOWED", `${relation.relation_type} does not allow target type ${to.entity_type}.`, relation.id, "to"));
        if (relation.from === relation.to && !spec.allow_self_loop)
            issues.push(issue("RELATION_SELF_LOOP_NOT_ALLOWED", `${relation.relation_type} does not allow self loops.`, relation.id));
        const fromSchema = this.effectiveEntitySchema(from.entity_type, from.concept_bindings, graph, from.id, from.properties);
        const toSchema = this.effectiveEntitySchema(to.entity_type, to.concept_bindings, graph, to.id, to.properties);
        if (fromSchema.allowed_outgoing_relations !== "*" && !fromSchema.allowed_outgoing_relations.has(relation.relation_type))
            issues.push(issue("OUTGOING_RELATION_NOT_ALLOWED", `${from.entity_type} ${from.id} does not permit outgoing relation ${relation.relation_type}.`, relation.id, "relation_type"));
        if (fromSchema.denied_outgoing_relations.has(relation.relation_type))
            issues.push(issue("OUTGOING_RELATION_DENIED_BY_CONCEPT", `An active concept forbids ${relation.relation_type} from ${from.id}.`, relation.id, "relation_type"));
        if (toSchema.allowed_incoming_relations !== "*" && !toSchema.allowed_incoming_relations.has(relation.relation_type))
            issues.push(issue("INCOMING_RELATION_NOT_ALLOWED", `${to.entity_type} ${to.id} does not permit incoming relation ${relation.relation_type}.`, relation.id, "relation_type"));
        if (toSchema.denied_incoming_relations.has(relation.relation_type))
            issues.push(issue("INCOMING_RELATION_DENIED_BY_CONCEPT", `An active concept forbids incoming ${relation.relation_type} at ${to.id}.`, relation.id, "relation_type"));
        if (!(0, model_1.isRecord)(relation.properties))
            return [...issues, issue("RELATION_PROPERTIES_NOT_OBJECT", "Relation properties must be an object.", relation.id, "properties")];
        for (const [key, field] of Object.entries(effective.properties)) {
            if (relation.properties[key] === undefined) {
                if (field.required || spec.required_properties?.includes(key))
                    issues.push(issue("REQUIRED_RELATION_PROPERTY_MISSING", `Relation property ${key} is required.`, relation.id, `properties.${key}`));
            }
            else
                issues.push(...validateFieldValue(relation.properties[key], field, `properties.${key}`, relation.id, graph));
        }
        for (const key of Object.keys(relation.properties)) {
            if (effective.forbidden_properties.has(key))
                issues.push(issue("FORBIDDEN_RELATION_PROPERTY_PRESENT", `Relation property ${key} is forbidden by an active concept; its value is preserved.`, relation.id, `properties.${key}`));
            else if (!(key in effective.properties))
                issues.push(issue("UNKNOWN_RELATION_PROPERTY", `Relation property ${key} is not in the effective schema; its value is preserved.`, relation.id, `properties.${key}`, relation.status === "active" ? "error" : "warning"));
        }
        for (const c of effective.constraints)
            if (!applyConstraint(relation.properties, c))
                issues.push(issue("RELATION_CONCEPT_CONSTRAINT_FAILED", c.message ?? `Constraint ${c.operator} failed for relation property ${c.field}.`, relation.id, `properties.${c.field}`));
        return issues;
    }
    validateGraph(graph) {
        const issues = [];
        for (const [id, entity] of Object.entries(graph.entities)) {
            if (id !== entity.id)
                issues.push(issue("ENTITY_MAP_KEY_MISMATCH", `Entity map key ${id} differs from record id ${entity.id}.`, id));
            issues.push(...this.validateEntity(entity, graph));
        }
        for (const [id, relation] of Object.entries(graph.relations)) {
            if (id !== relation.id)
                issues.push(issue("RELATION_MAP_KEY_MISMATCH", `Relation map key ${id} differs from record id ${relation.id}.`, id));
            if (relation.status !== "tombstoned")
                issues.push(...this.validateRelation(relation, graph));
        }
        // Active relations are also checked against concept-defined required cardinalities.
        for (const entity of Object.values(graph.entities)) {
            if (entity.status === "tombstoned")
                continue;
            const schema = this.effectiveEntitySchema(entity.entity_type, entity.concept_bindings, graph, entity.id, entity.properties);
            for (const rule of schema.required_relations ?? []) {
                const matching = Object.values(graph.relations).filter(r => r.status !== "tombstoned" && r.relation_type === rule.relation_type && ((rule.direction === "outgoing" && r.from === entity.id) ||
                    (rule.direction === "incoming" && r.to === entity.id) ||
                    (rule.direction === "either" && (r.from === entity.id || r.to === entity.id))) && (!rule.target_types?.length || rule.target_types.includes(graph.entities[r.from === entity.id ? r.to : r.from]?.entity_type ?? "")));
                const min = rule.min_count ?? 1;
                if (matching.length < min)
                    issues.push(issue("REQUIRED_RELATION_MISSING", `${entity.id} requires at least ${min} ${rule.direction} ${rule.relation_type} relation(s); found ${matching.length}.`, entity.id));
                if (rule.max_count !== undefined && matching.length > rule.max_count)
                    issues.push(issue("RELATION_CARDINALITY_EXCEEDED", `${entity.id} allows at most ${rule.max_count} ${rule.direction} ${rule.relation_type} relation(s); found ${matching.length}.`, entity.id));
            }
        }
        return issues;
    }
}
exports.SchemaEngine = SchemaEngine;
