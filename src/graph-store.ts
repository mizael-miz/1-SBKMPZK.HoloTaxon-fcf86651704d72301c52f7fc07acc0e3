import { App, TFile, normalizePath } from "obsidian";
import { DEFAULT_REGISTRY } from "./default-registry";
import type { CoreRegistry, GraphDocument } from "./model";
import { nowIso } from "./model";

export interface RegistryMergeConflict {
  path: string;
  current_value: unknown;
  bundled_value: unknown;
  resolution: "preserved_current_value";
}
export interface RegistryMergeReport {
  changed: boolean;
  added_entity_types: string[];
  added_relation_types: string[];
  added_fields: string[];
  conflicts: RegistryMergeConflict[];
  bundled_version: string;
}

export interface GraphStore {
  ensureInitialized(): Promise<void>;
  loadGraph(): Promise<GraphDocument>;
  loadRegistry(): Promise<CoreRegistry>;
  saveRegistry(registry: CoreRegistry, reason: string): Promise<void>;
  transact<T>(label: string, mutator: (graph: GraphDocument) => T | Promise<T>, expectedGeneration?: number): Promise<T>;
  backupGraph(reason: string): Promise<string>;
  mergeBundledRegistry(): Promise<RegistryMergeReport>;
}

const json = (value: unknown): string => JSON.stringify(value, null, 2) + "\n";
const deepClone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
const sanitize = (value: string): string => value.toLowerCase().replace(/[^a-z0-9._-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "change";

export class JsonVaultGraphStore implements GraphStore {
  readonly rootPath = "HoloTaxon";
  readonly graphPath = "HoloTaxon/graph.json";
  readonly registryPath = "HoloTaxon/registry.json";
  readonly backupFolder = "HoloTaxon/backups";
  private lockTail: Promise<void> = Promise.resolve();

  constructor(private readonly app: App, private readonly pluginVersion: string) {}

  private async withLock<T>(fn: () => Promise<T>): Promise<T> {
    const prior = this.lockTail;
    let release!: () => void;
    this.lockTail = new Promise<void>(resolve => { release = resolve; });
    await prior;
    try { return await fn(); }
    finally { release(); }
  }

  private async exists(path: string): Promise<boolean> {
    return await this.app.vault.adapter.exists(normalizePath(path));
  }

  private async ensureFolder(path: string): Promise<void> {
    const normalized = normalizePath(path);
    if (await this.exists(normalized)) return;
    const parts = normalized.split("/");
    let current = "";
    for (const part of parts) {
      current = current ? `${current}/${part}` : part;
      if (!(await this.exists(current))) await this.app.vault.createFolder(current);
    }
  }

  private async readJson<T>(path: string): Promise<T> {
    const file = this.app.vault.getAbstractFileByPath(normalizePath(path));
    if (!(file instanceof TFile)) throw new Error(`Expected file at ${path}; it is missing or not a file.`);
    const raw = await this.app.vault.read(file);
    try { return JSON.parse(raw) as T; }
    catch (error) {
      throw new Error(`HoloTaxon refused to overwrite invalid JSON at ${path}. Preserve the file, restore a backup, or repair it manually. Parser error: ${String(error)}`);
    }
  }

  private async writeJsonPreserving(path: string, value: unknown): Promise<void> {
    await this.ensureFolder(path.split("/").slice(0, -1).join("/"));
    const content = json(value);
    const tempPath = `${path}.pending-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const tempFile = await this.app.vault.create(normalizePath(tempPath), content);
    try {
      const existing = this.app.vault.getAbstractFileByPath(normalizePath(path));
      if (existing instanceof TFile) await this.app.vault.modify(existing, content);
      else if (existing) throw new Error(`Refusing to replace non-file at ${path}.`);
      else await this.app.vault.create(normalizePath(path), content);
      await this.app.vault.delete(tempFile);
    } catch (error) {
      // Intentionally leave the pending file as a recoverable candidate if the final write fails.
      throw new Error(`Write failed for ${path}. Current data and a pre-write backup are retained where available. Pending candidate: ${tempPath}. ${String(error)}`);
    }
  }

  async ensureInitialized(): Promise<void> {
    await this.ensureFolder(this.rootPath);
    await this.ensureFolder(this.backupFolder);
    await this.ensureFolder("HoloTaxon/reports");
    if (!(await this.exists(this.registryPath))) {
      await this.app.vault.create(this.registryPath, json(deepClone(DEFAULT_REGISTRY)));
    }
    if (!(await this.exists(this.graphPath))) {
      const now = nowIso();
      const graph: GraphDocument = {
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

  async loadGraph(): Promise<GraphDocument> {
    const graph = await this.readJson<GraphDocument>(this.graphPath);
    if (!graph || typeof graph !== "object" || !graph.entities || !graph.relations || typeof graph.generation !== "number") {
      throw new Error(`Graph envelope at ${this.graphPath} is invalid. The file was not modified.`);
    }
    return graph;
  }

  async loadRegistry(): Promise<CoreRegistry> {
    const registry = await this.readJson<CoreRegistry>(this.registryPath);
    if (!registry?.entity_types || !registry?.relation_types || !registry?.bundled_registry_version) {
      throw new Error(`Registry at ${this.registryPath} is invalid. The file was not modified.`);
    }
    return registry;
  }

  async backupGraph(reason: string): Promise<string> {
    const graph = await this.loadGraph();
    await this.ensureFolder(this.backupFolder);
    const nonce = Math.random().toString(36).slice(2, 8);
    const filename = `graph-g${graph.generation}-${new Date().toISOString().replace(/[:.]/g, "-")}-${sanitize(reason)}-${nonce}.json`;
    const path = `${this.backupFolder}/${filename}`;
    await this.app.vault.create(normalizePath(path), json(graph));
    return path;
  }

  private async backupRegistry(reason: string): Promise<string> {
    const registry = await this.loadRegistry();
    const nonce = Math.random().toString(36).slice(2, 8);
    const filename = `registry-${new Date().toISOString().replace(/[:.]/g, "-")}-${sanitize(reason)}-${nonce}.json`;
    const path = `${this.backupFolder}/${filename}`;
    await this.app.vault.create(normalizePath(path), json(registry));
    return path;
  }

  async saveRegistry(registry: CoreRegistry, reason: string): Promise<void> {
    await this.withLock(async () => {
      if (await this.exists(this.registryPath)) await this.backupRegistry(reason);
      await this.writeJsonPreserving(this.registryPath, registry);
    });
  }

  async transact<T>(label: string, mutator: (graph: GraphDocument) => T | Promise<T>, expectedGeneration?: number): Promise<T> {
    return this.withLock(async () => {
      const current = await this.loadGraph();
      if (expectedGeneration !== undefined && expectedGeneration !== current.generation) {
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

  async mergeBundledRegistry(): Promise<RegistryMergeReport> {
    return this.withLock(async () => {
      const current = await this.loadRegistry();
      const bundled = deepClone(DEFAULT_REGISTRY);
      const merged = deepClone(current);
      const report: RegistryMergeReport = {
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
          report.added_entity_types.push(typeId); report.changed = true; continue;
        }
        const currentType = merged.entity_types[typeId];
        for (const [fieldName, fieldSpec] of Object.entries(bundledType.fields)) {
          if (!currentType.fields[fieldName]) {
            currentType.fields[fieldName] = deepClone(fieldSpec);
            report.added_fields.push(`${typeId}.${fieldName}`); report.changed = true;
          } else if (!sameJson(currentType.fields[fieldName], fieldSpec)) {
            report.conflicts.push({ path: `entity_types.${typeId}.fields.${fieldName}`, current_value: currentType.fields[fieldName], bundled_value: fieldSpec, resolution: "preserved_current_value" });
          }
        }
        const scalarKeys: Array<keyof typeof bundledType> = ["axis", "description", "immutable_fields", "allow_extra_fields", "allowed_outgoing_relations", "allowed_incoming_relations"];
        for (const key of scalarKeys) {
          if ((currentType as any)[key] !== undefined && !sameJson((currentType as any)[key], (bundledType as any)[key])) {
            report.conflicts.push({ path: `entity_types.${typeId}.${key}`, current_value: (currentType as any)[key], bundled_value: (bundledType as any)[key], resolution: "preserved_current_value" });
          } else if ((currentType as any)[key] === undefined && (bundledType as any)[key] !== undefined) {
            (currentType as any)[key] = deepClone((bundledType as any)[key]); report.changed = true;
          }
        }
      }
      for (const [relId, bundledRel] of Object.entries(bundled.relation_types)) {
        if (!merged.relation_types[relId]) { merged.relation_types[relId] = deepClone(bundledRel); report.added_relation_types.push(relId); report.changed = true; }
        else if (!sameJson(merged.relation_types[relId], bundledRel)) report.conflicts.push({ path: `relation_types.${relId}`, current_value: merged.relation_types[relId], bundled_value: bundledRel, resolution: "preserved_current_value" });
      }
      merged.bundled_registry_version = bundled.bundled_registry_version;
      merged.registry_format_version = current.registry_format_version || bundled.registry_format_version;
      merged.metadata = { ...bundled.metadata, ...current.metadata, last_merged_bundle_version: bundled.bundled_registry_version };
      if (report.changed || current.metadata.last_merged_bundle_version !== bundled.bundled_registry_version) {
        if (await this.exists(this.registryPath)) await this.backupRegistry(`registry-merge-${bundled.bundled_registry_version}`);
        await this.writeJsonPreserving(this.registryPath, merged);
      }
      if (report.conflicts.length) {
        const reportPath = `HoloTaxon/reports/registry-merge-${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
        await this.app.vault.create(normalizePath(reportPath), json(report));
      }
      return report;
    });
  }
}

function sameJson(a: unknown, b: unknown): boolean { return JSON.stringify(a) === JSON.stringify(b); }
