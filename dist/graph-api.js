"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HoloTaxonAPI = exports.GraphOperationError = void 0;
const default_registry_1 = require("./default-registry");
const model_1 = require("./model");
const schema_engine_1 = require("./schema-engine");
class GraphOperationError extends Error {
    issues;
    constructor(message, issues = []) {
        super(message);
        this.issues = issues;
        this.name = "GraphOperationError";
    }
}
exports.GraphOperationError = GraphOperationError;
function clone(value) { return JSON.parse(JSON.stringify(value)); }
function makeId(prefix) {
    const uuid = typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
    return `${prefix.toUpperCase().replace(/[^A-Z0-9]+/g, "-")}-${uuid}`;
}
function errorsOnly(issues) { return issues.filter(x => x.severity === "error"); }
class HoloTaxonAPI {
    store;
    registrySeed;
    constructor(store, registrySeed = default_registry_1.DEFAULT_REGISTRY) {
        this.store = store;
        this.registrySeed = registrySeed;
    }
    async getSnapshot() { return this.store.loadGraph(); }
    async getRegistry() { return this.store.loadRegistry(); }
    async getEntity(id, includeTombstoned = false) {
        const graph = await this.store.loadGraph();
        const record = graph.entities[id];
        if (!record || (!includeTombstoned && record.status === "tombstoned"))
            return null;
        return clone(record);
    }
    async listEntities(query = {}) {
        const graph = await this.store.loadGraph();
        const q = query;
        let rows = Object.values(graph.entities).filter(e => {
            if (e.status === "tombstoned" && q.status !== "tombstoned")
                return false;
            if (q.entity_type && e.entity_type !== q.entity_type)
                return false;
            if (q.axis && e.axis !== q.axis)
                return false;
            if (q.status && e.status !== q.status)
                return false;
            if (q.concept_binding && !e.concept_bindings.includes(q.concept_binding))
                return false;
            if (q.label_contains && !e.label.toLowerCase().includes(q.label_contains.toLowerCase()))
                return false;
            if (q.property_equals && Object.entries(q.property_equals).some(([key, value]) => e.properties[key] !== value))
                return false;
            return true;
        }).sort((a, b) => a.label.localeCompare(b.label) || a.id.localeCompare(b.id));
        const offset = Math.max(0, q.offset ?? 0);
        const limit = Math.min(5000, Math.max(0, q.limit ?? 100));
        rows = rows.slice(offset, offset + limit);
        return clone(rows);
    }
    async createEntity(input, options = {}) {
        const registry = await this.store.loadRegistry();
        const type = registry.entity_types[input.entity_type];
        if (!type)
            throw new GraphOperationError(`Unknown entity type ${input.entity_type}.`);
        if (type.axis === "L3" && (input.concept_bindings?.length ?? 0) > 0)
            throw new GraphOperationError("Layer 3 records cannot be governed by Layer 2 schema concepts.");
        const id = input.id ?? makeId(input.entity_type);
        return this.store.transact(`create-${input.entity_type}`, graph => {
            if (graph.entities[id])
                throw new GraphOperationError(`Entity ID ${id} already exists. IDs are never silently overwritten.`);
            const now = (0, model_1.nowIso)();
            const entity = {
                id, entity_type: input.entity_type, axis: type.axis, label: input.label,
                revision: 1, status: input.status ?? "active", concept_bindings: [...new Set(input.concept_bindings ?? [])],
                properties: clone(input.properties ?? {}), created_at: now, updated_at: now,
                ...(input.extension_data ? { extension_data: clone(input.extension_data) } : {})
            };
            graph.entities[id] = entity;
            const engine = new schema_engine_1.SchemaEngine(registry);
            const issues = engine.validateEntity(entity, graph);
            const errors = errorsOnly(issues);
            if (errors.length && !options.allow_draft)
                throw new GraphOperationError(`Entity ${id} failed schema validation; no change was committed.`, issues);
            if (errors.length)
                entity.status = "draft";
            return clone(entity);
        }, options.expected_generation);
    }
    /** Merge property keys; this intentionally does not replace the full properties object. */
    async updateEntity(id, patch, options = {}) {
        const registry = await this.store.loadRegistry();
        return this.store.transact(`update-entity-${id}`, graph => {
            const entity = graph.entities[id];
            if (!entity || entity.status === "tombstoned")
                throw new GraphOperationError(`Active entity ${id} was not found.`);
            if (options.expected_revision !== undefined && entity.revision !== options.expected_revision)
                throw new GraphOperationError(`Stale entity revision: expected ${options.expected_revision}, current ${entity.revision}.`);
            if (patch.label !== undefined)
                entity.label = patch.label;
            if (patch.status !== undefined) {
                if (patch.status === "tombstoned")
                    throw new GraphOperationError("Use tombstoneEntity() so relationship and revision rules are enforced.");
                entity.status = patch.status;
            }
            if (patch.properties)
                entity.properties = { ...entity.properties, ...clone(patch.properties) };
            if (patch.extension_data)
                entity.extension_data = { ...(entity.extension_data ?? {}), ...clone(patch.extension_data) };
            entity.revision += 1;
            entity.updated_at = (0, model_1.nowIso)();
            this.validateMutationImpact(graph, registry, new Set([id]), options.allow_draft ?? false, entity.entity_type === "Layer2Concept" ? new Set([id]) : new Set());
            return clone(entity);
        }, options.expected_generation);
    }
    async removeProperty(id, propertyPath, options = {}) {
        const registry = await this.store.loadRegistry();
        return this.store.transact(`remove-property-${id}-${propertyPath}`, graph => {
            const entity = graph.entities[id];
            if (!entity || entity.status === "tombstoned")
                throw new GraphOperationError(`Active entity ${id} was not found.`);
            if (options.expected_revision !== undefined && entity.revision !== options.expected_revision)
                throw new GraphOperationError(`Stale entity revision for ${id}.`);
            const parts = propertyPath.split(".");
            let cur = entity.properties;
            for (const part of parts.slice(0, -1)) {
                const next = cur[part];
                if (!next || typeof next !== "object" || Array.isArray(next))
                    throw new GraphOperationError(`Property path ${propertyPath} does not exist.`);
                cur = next;
            }
            if (!(parts[parts.length - 1] in cur))
                throw new GraphOperationError(`Property path ${propertyPath} does not exist.`);
            delete cur[parts[parts.length - 1]];
            entity.revision += 1;
            entity.updated_at = (0, model_1.nowIso)();
            this.validateMutationImpact(graph, registry, new Set([id]), options.allow_draft ?? false);
            return clone(entity);
        }, options.expected_generation);
    }
    async bindConcept(entityId, conceptId, options = {}) {
        const registry = await this.store.loadRegistry();
        return this.store.transact(`bind-concept-${conceptId}-to-${entityId}`, graph => {
            const entity = graph.entities[entityId];
            const concept = graph.entities[conceptId];
            if (!entity || entity.status === "tombstoned")
                throw new GraphOperationError(`Active entity ${entityId} was not found.`);
            if (!concept || concept.entity_type !== "Layer2Concept" || concept.axis !== "L2")
                throw new GraphOperationError(`${conceptId} is not an existing Layer2Concept.`);
            if (entity.axis === "L3")
                throw new GraphOperationError("Layer 3 metrology entities cannot be reshaped by Layer 2 concepts.");
            if (options.expected_revision !== undefined && entity.revision !== options.expected_revision)
                throw new GraphOperationError(`Stale entity revision for ${entityId}.`);
            if (!entity.concept_bindings.includes(conceptId))
                entity.concept_bindings.push(conceptId);
            entity.revision += 1;
            entity.updated_at = (0, model_1.nowIso)();
            this.validateMutationImpact(graph, registry, new Set([entityId]), options.allow_draft ?? false, new Set([conceptId]));
            return clone(entity);
        }, options.expected_generation);
    }
    async unbindConcept(entityId, conceptId, options = {}) {
        const registry = await this.store.loadRegistry();
        return this.store.transact(`unbind-concept-${conceptId}-from-${entityId}`, graph => {
            const entity = graph.entities[entityId];
            if (!entity || entity.status === "tombstoned")
                throw new GraphOperationError(`Active entity ${entityId} was not found.`);
            if (options.expected_revision !== undefined && entity.revision !== options.expected_revision)
                throw new GraphOperationError(`Stale entity revision for ${entityId}.`);
            entity.concept_bindings = entity.concept_bindings.filter(id => id !== conceptId);
            entity.revision += 1;
            entity.updated_at = (0, model_1.nowIso)();
            // Properties introduced by the removed concept are never deleted. An invalid result may remain as a draft.
            this.validateMutationImpact(graph, registry, new Set([entityId]), options.allow_draft ?? false, new Set([conceptId]));
            return clone(entity);
        }, options.expected_generation);
    }
    async createRelation(input, options = {}) {
        const registry = await this.store.loadRegistry();
        const id = input.id ?? makeId(`REL-${input.relation_type}`);
        return this.store.transact(`create-relation-${input.relation_type}`, graph => {
            if (graph.relations[id])
                throw new GraphOperationError(`Relation ID ${id} already exists. Relations are not silently overwritten.`);
            const from = graph.entities[input.from];
            const to = graph.entities[input.to];
            if (!from || from.status === "tombstoned")
                throw new GraphOperationError(`Active source entity ${input.from} was not found.`);
            if (!to || to.status === "tombstoned")
                throw new GraphOperationError(`Active target entity ${input.to} was not found.`);
            const now = (0, model_1.nowIso)();
            const relation = {
                id, relation_type: input.relation_type, from: input.from, to: input.to, revision: 1,
                status: input.status ?? "active", concept_bindings: [...new Set(input.concept_bindings ?? [])],
                properties: clone(input.properties ?? {}), assertion: input.assertion ? clone(input.assertion) : undefined,
                created_at: now, updated_at: now
            };
            graph.relations[id] = relation;
            const issues = new schema_engine_1.SchemaEngine(registry).validateRelation(relation, graph);
            const errors = errorsOnly(issues);
            if (errors.length && !options.allow_draft)
                throw new GraphOperationError(`Relation ${id} failed validation; no change was committed.`, issues);
            if (errors.length)
                relation.status = "draft";
            return clone(relation);
        }, options.expected_generation);
    }
    /** Merge relation-property keys; endpoint and relation IDs are immutable. */
    async updateRelation(id, patch, options = {}) {
        const registry = await this.store.loadRegistry();
        return this.store.transact(`update-relation-${id}`, graph => {
            const relation = graph.relations[id];
            if (!relation || relation.status === "tombstoned")
                throw new GraphOperationError(`Active relation ${id} was not found.`);
            if (options.expected_revision !== undefined && relation.revision !== options.expected_revision)
                throw new GraphOperationError(`Stale relation revision for ${id}.`);
            if (patch.properties)
                relation.properties = { ...relation.properties, ...clone(patch.properties) };
            if (patch.assertion)
                relation.assertion = { ...(relation.assertion ?? {}), ...clone(patch.assertion) };
            if (patch.status) {
                if (patch.status === "tombstoned")
                    throw new GraphOperationError("Use tombstoneRelation() for soft deletion.");
                relation.status = patch.status;
            }
            relation.revision += 1;
            relation.updated_at = (0, model_1.nowIso)();
            const issues = new schema_engine_1.SchemaEngine(registry).validateRelation(relation, graph);
            const errors = errorsOnly(issues);
            if (errors.length && !options.allow_draft)
                throw new GraphOperationError(`Relation ${id} update failed validation; prior data is unchanged.`, issues);
            if (errors.length)
                relation.status = "draft";
            return clone(relation);
        }, options.expected_generation);
    }
    async tombstoneRelation(id, options = {}) {
        return this.store.transact(`tombstone-relation-${id}`, graph => {
            const relation = graph.relations[id];
            if (!relation)
                throw new GraphOperationError(`Relation ${id} was not found.`);
            if (options.expected_revision !== undefined && relation.revision !== options.expected_revision)
                throw new GraphOperationError(`Stale relation revision for ${id}.`);
            relation.status = "tombstoned";
            relation.tombstoned_at = (0, model_1.nowIso)();
            relation.updated_at = (0, model_1.nowIso)();
            relation.revision += 1;
            return clone(relation);
        }, options.expected_generation);
    }
    async tombstoneEntity(id, options = {}) {
        return this.store.transact(`tombstone-entity-${id}`, graph => {
            const entity = graph.entities[id];
            if (!entity)
                throw new GraphOperationError(`Entity ${id} was not found.`);
            if (options.expected_revision !== undefined && entity.revision !== options.expected_revision)
                throw new GraphOperationError(`Stale entity revision for ${id}.`);
            const linked = Object.values(graph.relations).filter(r => r.status !== "tombstoned" && (r.from === id || r.to === id));
            if (linked.length && !options.cascade_relations)
                throw new GraphOperationError(`Entity ${id} has ${linked.length} active relations. Re-run with cascade_relations=true to tombstone those relations without deleting their history.`);
            for (const relation of linked) {
                relation.status = "tombstoned";
                relation.tombstoned_at = (0, model_1.nowIso)();
                relation.updated_at = (0, model_1.nowIso)();
                relation.revision += 1;
            }
            entity.status = "tombstoned";
            entity.tombstoned_at = (0, model_1.nowIso)();
            entity.updated_at = (0, model_1.nowIso)();
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
    validateMutationImpact(graph, registry, changedEntityIds, allowDraft, changedConceptIds = new Set()) {
        const engine = new schema_engine_1.SchemaEngine(registry);
        const affectedEntityIds = new Set(changedEntityIds);
        for (const entity of Object.values(graph.entities)) {
            if (entity.status === "tombstoned")
                continue;
            const schema = engine.effectiveEntitySchema(entity.entity_type, entity.concept_bindings, graph, entity.id, entity.properties);
            if (schema.active_concept_ids.some(id => changedConceptIds.has(id)))
                affectedEntityIds.add(entity.id);
        }
        const issues = [];
        const entityErrors = new Map();
        for (const id of affectedEntityIds) {
            const entity = graph.entities[id];
            if (!entity || entity.status === "tombstoned")
                continue;
            const local = engine.validateEntity(entity, graph);
            issues.push(...local);
            const errors = errorsOnly(local);
            if (errors.length)
                entityErrors.set(id, errors);
        }
        const relationErrors = new Map();
        for (const relation of Object.values(graph.relations)) {
            if (relation.status === "tombstoned")
                continue;
            const endpointAffected = affectedEntityIds.has(relation.from) || affectedEntityIds.has(relation.to);
            let conceptAffected = relation.concept_bindings.some(id => changedConceptIds.has(id));
            if (!conceptAffected && changedConceptIds.size > 0) {
                const from = graph.entities[relation.from];
                const to = graph.entities[relation.to];
                if (from && to) {
                    const effective = engine.effectiveRelationSchema(relation.relation_type, from, to, relation.concept_bindings ?? [], graph, relation.id);
                    conceptAffected = effective.active_concept_ids.some(id => changedConceptIds.has(id));
                }
            }
            if (!endpointAffected && !conceptAffected)
                continue;
            const local = engine.validateRelation(relation, graph);
            issues.push(...local);
            const errors = errorsOnly(local);
            if (errors.length)
                relationErrors.set(relation.id, errors);
        }
        if ((entityErrors.size || relationErrors.size) && !allowDraft) {
            throw new GraphOperationError("Mutation would violate the effective schema of this record or a dependent record/relationship. No graph change was committed. Use allow_draft only when deliberately staging a migration.", issues);
        }
        if (allowDraft) {
            for (const id of entityErrors.keys()) {
                const entity = graph.entities[id];
                if (entity && entity.status !== "draft") {
                    entity.status = "draft";
                    if (!changedEntityIds.has(id))
                        entity.revision += 1;
                    entity.updated_at = (0, model_1.nowIso)();
                }
            }
            for (const id of relationErrors.keys()) {
                const relation = graph.relations[id];
                if (relation && relation.status !== "draft") {
                    relation.status = "draft";
                    relation.revision += 1;
                    relation.updated_at = (0, model_1.nowIso)();
                }
            }
        }
        return issues;
    }
    async validateGraph() {
        const [graph, registry] = await Promise.all([this.store.loadGraph(), this.store.loadRegistry()]);
        const issues = new schema_engine_1.SchemaEngine(registry).validateGraph(graph);
        return {
            ok: issues.every(x => x.severity !== "error"), generation: graph.generation,
            checked_entities: Object.keys(graph.entities).length,
            checked_relations: Object.values(graph.relations).filter(r => r.status !== "tombstoned").length,
            errors: issues.filter(x => x.severity === "error").length,
            warnings: issues.filter(x => x.severity === "warning").length,
            issues
        };
    }
    async effectiveEntitySchema(entityId) {
        const [graph, registry] = await Promise.all([this.store.loadGraph(), this.store.loadRegistry()]);
        const entity = graph.entities[entityId];
        if (!entity)
            throw new GraphOperationError(`Entity ${entityId} was not found.`);
        return new schema_engine_1.SchemaEngine(registry).effectiveEntitySchema(entity.entity_type, entity.concept_bindings, graph, entity.id, entity.properties);
    }
    async traverse(query) {
        const [graph, registry] = await Promise.all([this.store.loadGraph(), this.store.loadRegistry()]);
        if (!graph.entities[query.start_id])
            throw new GraphOperationError(`Traversal start ${query.start_id} was not found.`);
        const direction = query.direction ?? "both";
        const maxDepth = Math.min(64, Math.max(0, query.max_depth ?? 4));
        const maxNodes = Math.min(10000, Math.max(1, query.max_nodes ?? 1000));
        const includeTombstones = query.include_tombstoned ?? false;
        const allowed = query.relation_types ? new Set(query.relation_types) : null;
        const found = new Map();
        const seenDepth = new Map([[query.start_id, 0]]);
        const queue = [{ id: query.start_id, depth: 0, path: [] }];
        let truncated = false;
        if (query.include_start)
            found.set(query.start_id, { entity: clone(graph.entities[query.start_id]), depth: 0, via_relation_ids: [] });
        while (queue.length) {
            const current = queue.shift();
            if (current.depth >= maxDepth)
                continue;
            const nexts = [];
            for (const relation of Object.values(graph.relations)) {
                if (relation.status === "tombstoned" && !includeTombstones)
                    continue;
                if (allowed && !allowed.has(relation.relation_type))
                    continue;
                const relationSpec = registry.relation_types[relation.relation_type];
                if ((direction === "outgoing" || direction === "both") && relation.from === current.id)
                    nexts.push({ id: relation.to, relation });
                if ((direction === "incoming" || direction === "both") && relation.to === current.id)
                    nexts.push({ id: relation.from, relation });
                if (relationSpec?.symmetric && (direction === "outgoing" || direction === "incoming") && (relation.from === current.id || relation.to === current.id))
                    nexts.push({ id: relation.from === current.id ? relation.to : relation.from, relation });
            }
            for (const next of nexts) {
                const entity = graph.entities[next.id];
                if (!entity || (entity.status === "tombstoned" && !includeTombstones))
                    continue;
                const nextDepth = current.depth + 1;
                const best = seenDepth.get(next.id);
                if (best !== undefined && best <= nextDepth) {
                    if (found.has(next.id) && !found.get(next.id).via_relation_ids.includes(next.relation.id))
                        found.get(next.id).via_relation_ids.push(next.relation.id);
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
            if (truncated)
                break;
        }
        return { entities: [...found.values()].sort((a, b) => a.depth - b.depth || a.entity.label.localeCompare(b.entity.label)), truncated };
    }
    async mergeBundledRegistry() { return this.store.mergeBundledRegistry(); }
}
exports.HoloTaxonAPI = HoloTaxonAPI;
