"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JsonVaultGraphStore = void 0;
const obsidian_1 = require("obsidian");
const default_registry_1 = require("./default-registry");
const model_1 = require("./model");
const json = (value) => JSON.stringify(value, null, 2) + "\n";
const deepClone = (value) => JSON.parse(JSON.stringify(value));
const sanitize = (value) => value.toLowerCase().replace(/[^a-z0-9._-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "change";
class JsonVaultGraphStore {
    app;
    pluginVersion;
    rootPath = "HoloTaxon";
    graphPath = "HoloTaxon/graph.json";
    registryPath = "HoloTaxon/registry.json";
    backupFolder = "HoloTaxon/backups";
    lockTail = Promise.resolve();
    constructor(app, pluginVersion) {
        this.app = app;
        this.pluginVersion = pluginVersion;
    }
    async withLock(fn) {
        const prior = this.lockTail;
        let release;
        this.lockTail = new Promise(resolve => { release = resolve; });
        await prior;
        try {
            return await fn();
        }
        finally {
            release();
        }
    }
    async exists(path) {
        return await this.app.vault.adapter.exists((0, obsidian_1.normalizePath)(path));
    }
    async ensureFolder(path) {
        const normalized = (0, obsidian_1.normalizePath)(path);
        if (await this.exists(normalized))
            return;
        const parts = normalized.split("/");
        let current = "";
        for (const part of parts) {
            current = current ? `${current}/${part}` : part;
            if (!(await this.exists(current)))
                await this.app.vault.createFolder(current);
        }
    }
    async readJson(path) {
        const file = this.app.vault.getAbstractFileByPath((0, obsidian_1.normalizePath)(path));
        if (!(file instanceof obsidian_1.TFile))
            throw new Error(`Expected file at ${path}; it is missing or not a file.`);
        const raw = await this.app.vault.read(file);
        try {
            return JSON.parse(raw);
        }
        catch (error) {
            throw new Error(`HoloTaxon refused to overwrite invalid JSON at ${path}. Preserve the file, restore a backup, or repair it manually. Parser error: ${String(error)}`);
        }
    }
    async writeJsonPreserving(path, value) {
        await this.ensureFolder(path.split("/").slice(0, -1).join("/"));
        const content = json(value);
        const tempPath = `${path}.pending-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        const tempFile = await this.app.vault.create((0, obsidian_1.normalizePath)(tempPath), content);
        try {
            const existing = this.app.vault.getAbstractFileByPath((0, obsidian_1.normalizePath)(path));
            if (existing instanceof obsidian_1.TFile)
                await this.app.vault.modify(existing, content);
            else if (existing)
                throw new Error(`Refusing to replace non-file at ${path}.`);
            else
                await this.app.vault.create((0, obsidian_1.normalizePath)(path), content);
            await this.app.vault.delete(tempFile);
        }
        catch (error) {
            // Intentionally leave the pending file as a recoverable candidate if the final write fails.
            throw new Error(`Write failed for ${path}. Current data and a pre-write backup are retained where available. Pending candidate: ${tempPath}. ${String(error)}`);
        }
    }
    async ensureInitialized() {
        await this.ensureFolder(this.rootPath);
        await this.ensureFolder(this.backupFolder);
        await this.ensureFolder("HoloTaxon/reports");
        if (!(await this.exists(this.registryPath))) {
            await this.app.vault.create(this.registryPath, json(deepClone(default_registry_1.DEFAULT_REGISTRY)));
        }
        if (!(await this.exists(this.graphPath))) {
            const now = (0, model_1.nowIso)();
            const graph = {
                graph_format_version: "1.0.0",
                graph_id: `HOLOTAXON-${now.replace(/[^0-9]/g, "").slice(0, 14)}`,
                generation: 0,
                metadata: { title: "HoloTaxon Graph", created_at: now, updated_at: now, plugin_version: this.pluginVersion, notes: ["Canonical graph data. Plugin upgrades must never replace this file with a blank template."] },
                entities: {}, relations: {}
            };
            await this.app.vault.create(this.graphPath, json(graph));
        }
        // A failed load is intentionally fatal to initialization: never silently reset user data.
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
        const filename = `graph-g${graph.generation}-${new Date().toISOString().replace(/[:.]/g, "-")}-${sanitize(reason)}-${nonce}.json`;
        const path = `${this.backupFolder}/${filename}`;
        await this.app.vault.create((0, obsidian_1.normalizePath)(path), json(graph));
        return path;
    }
    async backupRegistry(reason) {
        const registry = await this.loadRegistry();
        const nonce = Math.random().toString(36).slice(2, 8);
        const filename = `registry-${new Date().toISOString().replace(/[:.]/g, "-")}-${sanitize(reason)}-${nonce}.json`;
        const path = `${this.backupFolder}/${filename}`;
        await this.app.vault.create((0, obsidian_1.normalizePath)(path), json(registry));
        return path;
    }
    async saveRegistry(registry, reason) {
        await this.withLock(async () => {
            if (await this.exists(this.registryPath))
                await this.backupRegistry(reason);
            await this.writeJsonPreserving(this.registryPath, registry);
        });
    }
    async transact(label, mutator, expectedGeneration) {
        return this.withLock(async () => {
            const current = await this.loadGraph();
            if (expectedGeneration !== undefined && expectedGeneration !== current.generation) {
                throw new Error(`Stale graph generation: expected ${expectedGeneration}, current generation is ${current.generation}. Reload and retry.`);
            }
            const next = deepClone(current);
            const result = await mutator(next);
            next.generation = current.generation + 1;
            next.metadata.updated_at = (0, model_1.nowIso)();
            next.metadata.plugin_version = this.pluginVersion;
            await this.backupGraph(label);
            await this.writeJsonPreserving(this.graphPath, next);
            return result;
        });
    }
    async mergeBundledRegistry() {
        return this.withLock(async () => {
            const current = await this.loadRegistry();
            const bundled = deepClone(default_registry_1.DEFAULT_REGISTRY);
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
                    }
                    else if (!sameJson(currentType.fields[fieldName], fieldSpec)) {
                        report.conflicts.push({ path: `entity_types.${typeId}.fields.${fieldName}`, current_value: currentType.fields[fieldName], bundled_value: fieldSpec, resolution: "preserved_current_value" });
                    }
                }
                const scalarKeys = ["axis", "description", "immutable_fields", "allow_extra_fields", "allowed_outgoing_relations", "allowed_incoming_relations"];
                for (const key of scalarKeys) {
                    if (currentType[key] !== undefined && !sameJson(currentType[key], bundledType[key])) {
                        report.conflicts.push({ path: `entity_types.${typeId}.${key}`, current_value: currentType[key], bundled_value: bundledType[key], resolution: "preserved_current_value" });
                    }
                    else if (currentType[key] === undefined && bundledType[key] !== undefined) {
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
                }
                else if (!sameJson(merged.relation_types[relId], bundledRel))
                    report.conflicts.push({ path: `relation_types.${relId}`, current_value: merged.relation_types[relId], bundled_value: bundledRel, resolution: "preserved_current_value" });
            }
            merged.bundled_registry_version = bundled.bundled_registry_version;
            merged.registry_format_version = current.registry_format_version || bundled.registry_format_version;
            merged.metadata = { ...bundled.metadata, ...current.metadata, last_merged_bundle_version: bundled.bundled_registry_version };
            if (report.changed || current.metadata.last_merged_bundle_version !== bundled.bundled_registry_version) {
                if (await this.exists(this.registryPath))
                    await this.backupRegistry(`registry-merge-${bundled.bundled_registry_version}`);
                await this.writeJsonPreserving(this.registryPath, merged);
            }
            if (report.conflicts.length) {
                const reportPath = `HoloTaxon/reports/registry-merge-${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
                await this.app.vault.create((0, obsidian_1.normalizePath)(reportPath), json(report));
            }
            return report;
        });
    }
}
exports.JsonVaultGraphStore = JsonVaultGraphStore;
function sameJson(a, b) { return JSON.stringify(a) === JSON.stringify(b); }
