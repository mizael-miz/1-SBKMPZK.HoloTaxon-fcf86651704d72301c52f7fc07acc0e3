import { readFileSync } from "node:fs";

const manifest = JSON.parse(readFileSync("protocol/stages.json", "utf8"));
const state = JSON.parse(readFileSync("protocol/stage-state.json", "utf8"));
const errors = [];
const stages = manifest.stages;
const byId = new Map(stages.map((stage) => [stage.id, stage]));
const byGate = new Map(stages.map((stage) => [stage.gate, stage]));
const validStates = new Set(manifest.state_enum);

if (byId.size !== stages.length) errors.push("Stage IDs must be unique.");
if (byGate.size !== stages.length) errors.push("Gate IDs must be unique.");

for (const stage of stages) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(stage.deadline) || Number.isNaN(Date.parse(stage.deadline))) {
    errors.push(`${stage.id}: deadline must be an ISO calendar date.`);
  }
  if (!Number.isInteger(stage.issue) || stage.issue < 1) errors.push(`${stage.id}: issue must be a positive integer.`);
  for (const dependency of stage.depends_on) {
    if (!byGate.has(dependency)) errors.push(`${stage.id}: unknown dependency gate ${dependency}.`);
    if (dependency === stage.gate) errors.push(`${stage.id}: a stage cannot depend on its own gate.`);
  }
  const current = state.stages?.[stage.id];
  if (!current) {
    errors.push(`${stage.id}: missing state entry.`);
    continue;
  }
  if (!validStates.has(current.status)) errors.push(`${stage.id}: invalid status ${current.status}.`);
  if (current.status === "pass" && (!Array.isArray(current.evidence) || current.evidence.length === 0)) {
    errors.push(`${stage.id}: PASS requires at least one evidence reference.`);
  }
  if (current.status === "blocked" && !current.blocker) errors.push(`${stage.id}: BLOCKED requires a blocker description.`);
  if (current.status === "deferred" && !current.defer_reason) errors.push(`${stage.id}: DEFERRED requires a reason.`);
  if (["ready", "active", "pass"].includes(current.status)) {
    for (const dependency of stage.depends_on) {
      const dependencyStage = byGate.get(dependency);
      const dependencyStatus = state.stages?.[dependencyStage?.id]?.status;
      const optionalReleaseGate = stage.id === "GR" && ["G4", "G5"].includes(dependency);
      if (dependencyStatus !== "pass" && !(optionalReleaseGate && dependencyStatus === "deferred")) {
        errors.push(`${stage.id}: cannot be ${current.status}; dependency ${dependency} is ${dependencyStatus ?? "missing"}.`);
      }
    }
  }
}
for (const id of Object.keys(state.stages ?? {})) {
  if (!byId.has(id)) errors.push(`State contains unknown stage ${id}.`);
}
for (const gate of manifest.required_release_gates) {
  if (!byGate.has(gate)) errors.push(`Required release gate ${gate} is not defined.`);
}
const release = state.stages?.GR;
if (release?.status === "pass") {
  for (const gate of manifest.required_release_gates) {
    const stage = byGate.get(gate);
    if (state.stages?.[stage.id]?.status !== "pass") errors.push(`Release gate cannot PASS while required gate ${gate} is not PASS.`);
  }
}
if (errors.length) {
  console.error("Stage protocol validation FAILED:");
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}
console.log(`Stage protocol valid: ${stages.length} stages, ${manifest.required_release_gates.length} mandatory release gates.`);
console.log("Note: structural validation does not independently verify issue closure or evidence authenticity.");
