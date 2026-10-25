"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HOLOTAXON_VIEW_TYPE = void 0;
const obsidian_1 = require("obsidian");
const graph_api_1 = require("./graph-api");
const graph_store_1 = require("./graph-store");
exports.HOLOTAXON_VIEW_TYPE = "holotaxon-dashboard";
class HoloTaxonPlugin extends obsidian_1.Plugin {
    api;
    store;
    async onload() {
        this.store = new graph_store_1.JsonVaultGraphStore(this.app, this.manifest.version);
        await this.store.ensureInitialized();
        this.api = new graph_api_1.HoloTaxonAPI(this.store);
        const merge = await this.api.mergeBundledRegistry();
        if (merge.conflicts.length)
            new obsidian_1.Notice(`HoloTaxon preserved ${merge.conflicts.length} registry conflict(s). Review HoloTaxon/reports.`);
        this.registerView(exports.HOLOTAXON_VIEW_TYPE, leaf => new HoloTaxonDashboardView(leaf, this));
        this.addRibbonIcon("git-branch", "Open HoloTaxon dashboard", () => void this.openDashboard());
        this.addCommand({ id: "open-dashboard", name: "Open HoloTaxon dashboard", callback: () => void this.openDashboard() });
        this.addCommand({ id: "validate-graph", name: "Validate graph and save report", callback: () => void this.runValidation() });
        this.addCommand({ id: "create-entity", name: "Create entity from JSON", callback: () => new EntityJsonModal(this.app, this).open() });
        this.addCommand({ id: "create-relation", name: "Create relation from JSON", callback: () => new RelationJsonModal(this.app, this).open() });
        this.addCommand({ id: "export-snapshot", name: "Export graph snapshot", callback: () => void this.exportSnapshot() });
        this.addCommand({ id: "merge-registry", name: "Merge bundled registry additions (preserve conflicts)", callback: () => void this.mergeRegistry() });
        this.registerEvent(this.app.workspace.on("layout-change", () => {
            // Deliberately no automatic graph traversal/rendering on layout changes.
        }));
    }
    onunload() {
        this.app.workspace.detachLeavesOfType(exports.HOLOTAXON_VIEW_TYPE);
    }
    async openDashboard() {
        const existing = this.app.workspace.getLeavesOfType(exports.HOLOTAXON_VIEW_TYPE);
        const leaf = existing[0] ?? this.app.workspace.getRightLeaf(false);
        if (!leaf) {
            new obsidian_1.Notice("Could not open HoloTaxon view.");
            return;
        }
        await leaf.setViewState({ type: exports.HOLOTAXON_VIEW_TYPE, active: true });
        this.app.workspace.revealLeaf(leaf);
    }
    async runValidation() {
        try {
            const report = await this.api.validateGraph();
            await ensureFolder(this.app, "HoloTaxon/reports");
            const path = `HoloTaxon/reports/validation-${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
            await this.app.vault.create(path, JSON.stringify(report, null, 2) + "\n");
            new obsidian_1.Notice(`HoloTaxon validation: ${report.errors} error(s), ${report.warnings} warning(s). Report saved.`);
        }
        catch (error) {
            showError(error);
        }
    }
    async exportSnapshot() {
        try {
            const graph = await this.api.getSnapshot();
            await ensureFolder(this.app, "HoloTaxon/exports");
            const path = `HoloTaxon/exports/graph-g${graph.generation}-${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
            await this.app.vault.create(path, JSON.stringify(graph, null, 2) + "\n");
            new obsidian_1.Notice(`Exported graph generation ${graph.generation} to ${path}.`);
        }
        catch (error) {
            showError(error);
        }
    }
    async mergeRegistry() {
        try {
            const result = await this.api.mergeBundledRegistry();
            new obsidian_1.Notice(`Registry merge complete: +${result.added_entity_types.length} type(s), +${result.added_relation_types.length} relation(s), ${result.conflicts.length} conflict(s) preserved.`);
        }
        catch (error) {
            showError(error);
        }
    }
}
exports.default = HoloTaxonPlugin;
class HoloTaxonDashboardView extends obsidian_1.ItemView {
    plugin;
    constructor(leaf, plugin) {
        super(leaf);
        this.plugin = plugin;
    }
    getViewType() { return exports.HOLOTAXON_VIEW_TYPE; }
    getDisplayText() { return "HoloTaxon"; }
    getIcon() { return "git-branch"; }
    async onOpen() { await this.render(); }
    async onClose() { }
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
            const entityCount = Object.values(graph.entities).filter(e => e.status !== "tombstoned").length;
            const relationCount = Object.values(graph.relations).filter(r => r.status !== "tombstoned").length;
            const axisCounts = { B: 0, M: 0, W: 0, L2: 0, L3: 0 };
            for (const entity of Object.values(graph.entities))
                if (entity.status !== "tombstoned")
                    axisCounts[entity.axis] = (axisCounts[entity.axis] ?? 0) + 1;
            stats.createEl("p", { text: `Graph ${graph.graph_id} · generation ${graph.generation} · ${entityCount} active entities · ${relationCount} active relations` });
            stats.createEl("p", { text: `Axes — B: ${axisCounts.B}, M: ${axisCounts.M}, W: ${axisCounts.W}, Layer 2: ${axisCounts.L2}, Layer 3: ${axisCounts.L3}` });
            stats.createEl("p", { text: `Registry ${registry.bundled_registry_version} · ${Object.keys(registry.entity_types).length} entity types · ${Object.keys(registry.relation_types).length} core relation types` });
            const validation = root.createEl("div", { cls: report.ok ? "holotaxon-valid" : "holotaxon-invalid" });
            validation.createEl("h3", { text: report.ok ? "Validation: no errors" : `Validation: ${report.errors} error(s)` });
            validation.createEl("p", { text: `${report.warnings} warning(s). ${report.issues.length} total issue(s).` });
            if (report.issues.length) {
                const list = validation.createEl("ul");
                report.issues.slice(0, 25).forEach(item => list.createEl("li", { text: `[${item.severity}] ${item.code}: ${item.message}` }));
                if (report.issues.length > 25)
                    validation.createEl("p", { text: `Showing first 25 issues. Full report is available via the Validate command.` });
            }
            root.createEl("h3", { text: "Recent records" });
            const recent = Object.values(graph.entities).filter(e => e.status !== "tombstoned").sort((a, b) => b.updated_at.localeCompare(a.updated_at)).slice(0, 12);
            const table = root.createEl("table", { cls: "holotaxon-table" });
            const head = table.createEl("thead").createEl("tr");
            ["ID", "Axis", "Type", "Label", "Revision", "Concept bindings"].forEach(x => head.createEl("th", { text: x }));
            const body = table.createEl("tbody");
            recent.forEach(entity => {
                const row = body.createEl("tr");
                [entity.id, entity.axis, entity.entity_type, entity.label, String(entity.revision), entity.concept_bindings.join(", ") || "—"].forEach(text => row.createEl("td", { text }));
            });
        }
        catch (error) {
            root.createEl("pre", { text: String(error) });
        }
    }
}
class EntityJsonModal extends obsidian_1.Modal {
    plugin;
    input = "";
    feedback;
    constructor(app, plugin) {
        super(app);
        this.plugin = plugin;
    }
    onOpen() {
        this.titleEl.setText("Create HoloTaxon entity");
        this.contentEl.createEl("p", { text: "Enter a JSON object with entity_type, label, properties, and optional concept_bindings. IDs are generated if omitted. Fields are validated against the effective schema." });
        const area = this.contentEl.createEl("textarea", { cls: "holotaxon-json-input" });
        area.rows = 15;
        area.value = JSON.stringify({ entity_type: "Population", label: "New population", properties: { population_basis: "ecological", identity_rule: "Replace with an explicit continuity rule", unit_definition: "Replace with the organismal unit definition" }, concept_bindings: [] }, null, 2);
        area.addEventListener("input", () => { this.input = area.value; });
        this.input = area.value;
        this.feedback = this.contentEl.createDiv({ cls: "holotaxon-feedback" });
        new obsidian_1.Setting(this.contentEl).addButton(button => button.setButtonText("Create draft if needed").setCta().onClick(async () => {
            try {
                const parsed = JSON.parse(this.input || area.value);
                const record = await this.plugin.api.createEntity(parsed, { allow_draft: true });
                this.feedback.setText(`Created ${record.id} (${record.status}).`);
                new obsidian_1.Notice(`HoloTaxon entity ${record.id} created as ${record.status}.`);
            }
            catch (error) {
                this.feedback.setText(errorText(error));
            }
        })).addButton(button => button.setButtonText("Close").onClick(() => this.close()));
    }
    onClose() { this.contentEl.empty(); }
}
class RelationJsonModal extends obsidian_1.Modal {
    plugin;
    input = "";
    feedback;
    constructor(app, plugin) {
        super(app);
        this.plugin = plugin;
    }
    onOpen() {
        this.titleEl.setText("Create HoloTaxon relation");
        this.contentEl.createEl("p", { text: "Enter JSON with relation_type, from, to, and optional properties, concept_bindings, and assertion metadata." });
        const area = this.contentEl.createEl("textarea", { cls: "holotaxon-json-input" });
        area.rows = 14;
        area.value = JSON.stringify({ relation_type: "MEMBER_OF_POPULATION", from: "ORGANISMALUNIT-ID", to: "POPULATION-ID", properties: {}, assertion: { epistemic_status: "proposed", definition_refs: [], evidence_refs: [], source_refs: [] } }, null, 2);
        area.addEventListener("input", () => { this.input = area.value; });
        this.input = area.value;
        this.feedback = this.contentEl.createDiv({ cls: "holotaxon-feedback" });
        new obsidian_1.Setting(this.contentEl).addButton(button => button.setButtonText("Create draft if needed").setCta().onClick(async () => {
            try {
                const parsed = JSON.parse(this.input || area.value);
                const record = await this.plugin.api.createRelation(parsed, { allow_draft: true });
                this.feedback.setText(`Created ${record.id} (${record.status}).`);
                new obsidian_1.Notice(`HoloTaxon relation ${record.id} created as ${record.status}.`);
            }
            catch (error) {
                this.feedback.setText(errorText(error));
            }
        })).addButton(button => button.setButtonText("Close").onClick(() => this.close()));
    }
    onClose() { this.contentEl.empty(); }
}
async function ensureFolder(app, path) {
    if (await app.vault.adapter.exists(path))
        return;
    const parts = path.split("/");
    let current = "";
    for (const part of parts) {
        current = current ? `${current}/${part}` : part;
        if (!(await app.vault.adapter.exists(current)))
            await app.vault.createFolder(current);
    }
}
function errorText(error) {
    if (error instanceof graph_api_1.GraphOperationError)
        return `${error.message}\n${error.issues.map(i => `[${i.severity}] ${i.code}: ${i.message}`).join("\n")}`;
    return String(error);
}
function showError(error) { new obsidian_1.Notice(errorText(error), 10000); }
