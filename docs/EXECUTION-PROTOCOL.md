# HoloTaxon executable delivery protocol

Protocol version: 0.1.0
Baseline branch: feat/schema-runtime-v0.1.0
Protocol date: 2026-10-25
Timezone for deadlines: America/New_York

This file defines the ordered implementation protocol. GitHub Issues are the task ledger; this document defines dependencies, gates, evidence, and release policy. Dates are target deadlines, not proof that work has been completed. A gate can only be marked PASS with attached evidence.

## State machine

Allowed stage states: `queued`, `ready`, `active`, `blocked`, `pass`, `fail`, `deferred`.

Transition rules:
- A stage becomes `ready` only when all dependency gates are `pass`.
- A stage becomes `active` when work begins and its owner is explicit in the issue.
- A stage becomes `pass` only when all acceptance criteria are satisfied and evidence is attached.
- A stage becomes `blocked` when a dependency, environment, or unresolved decision prevents valid execution; record the blocking fact and next action.
- A stage becomes `fail` when an acceptance criterion is violated. Failure opens a corrective issue; it does not waive the gate.
- `deferred` requires an explicit scope decision and rationale. Required release gates cannot be deferred.

## Stage register

| Stage | Deadline | Issue | Depends on | Gate |
|---|---|---|---|---|
| S0: package/install in disposable vault | 2026-10-27 | [#2](https://github.com/mizael-miz/1-SBKMPZK.HoloTaxon-fcf86651704d72301c52f7fc07acc0e3/issues/2) | None | G0: reproducible installation and runtime load |
| S1: Obsidian end-to-end API verification | 2026-10-30 | [#3](https://github.com/mizael-miz/1-SBKMPZK.HoloTaxon-fcf86651704d72301c52f7fc07acc0e3/issues/3) | G0 | G1: commands and persisted operations work |
| S2: persistence/recovery/upgrade safety | 2026-11-03 | [#4](https://github.com/mizael-miz/1-SBKMPZK.HoloTaxon-fcf86651704d72301c52f7fc07acc0e3/issues/4) | G1 | G2: no silent destructive failure |
| S3: Layer 2 semantics and cross-axis invariants | 2026-11-07 | [#5](https://github.com/mizael-miz/1-SBKMPZK.HoloTaxon-fcf86651704d72301c52f7fc07acc0e3/issues/5) | G1, G2 | G3: normative effects plus regression tests |
| S4: query and graph exploration workflows | 2026-11-14 | [#6](https://github.com/mizael-miz/1-SBKMPZK.HoloTaxon-fcf86651704d72301c52f7fc07acc0e3/issues/6) | relevant G3 contracts | G4: two usable retrieval paths |
| S5: scale benchmark and adapter decision | 2026-11-21 | [#7](https://github.com/mizael-miz/1-SBKMPZK.HoloTaxon-fcf86651704d72301c52f7fc07acc0e3/issues/7) | G2, G3 | G5: measured limits and explicit adapter decision |
| GR: release adjudication | 2026-11-24 | [#8](https://github.com/mizael-miz/1-SBKMPZK.HoloTaxon-fcf86651704d72301c52f7fc07acc0e3/issues/8) | G0–G5 or documented limited-scope exception | GR: recorded ACCEPT / REJECT / DEFER |

## Hard release gates

G0, G1, G2, and G3 are mandatory for any release that claims the graph runtime is operational. G4 and G5 may be deferred only for a clearly labeled limited bootstrap release. No release may claim multi-million-record readiness without benchmark evidence and integrity tests at relevant sizes.

CI green means the repository compiles and its automated test suite passes. It does not establish that the plugin was loaded in Obsidian, that file recovery works under fault, or that large-scale performance is adequate.

## Evidence format

Every completed issue must include:
- exact commit SHA and plugin version tested;
- environment (Obsidian version, OS, storage location, Node version where applicable);
- procedure and observed result;
- expected vs actual behavior;
- artifact/log/test reference;
- gate status: PASS, FAIL, BLOCKED, or DEFERRED;
- known residual risk and follow-up issue, if any.

## Change and data-preservation rules

1. Work in feature branches; review through pull requests.
2. Keep commits semantically small and traceable.
3. Never replace a vault's graph or registry with an empty template during installation or upgrade.
4. Back up the full `HoloTaxon/` data directory before tests involving migration or fault injection.
5. Use disposable vaults for destructive tests.
6. A failed gate blocks downstream stages unless a documented dependency change is approved.
7. Do not automatically merge the PR, tag a release, or install into a production vault as a side effect of passing CI.

## Deadline policy

Dates above are proposed delivery targets set on 2026-10-25. GitHub Issues do not expose a native due-date field through the available issue interface used here, so each target date is encoded in the issue title/body and this stage register. If a deadline slips, edit the issue with the new date, reason, impact on dependent stages, and approval record; do not silently slide the schedule.

## Current status

- G0–GR: no gate is marked PASS until its explicit acceptance evidence is attached.
- Repository CI success proves only the checked-in automated checks. It does not prove a live Obsidian installation.
- PR #1 (runtime baseline) is merged; PR #9 contains this execution protocol and remains the review point for protocol changes.
- Live Obsidian installation and vault-level acceptance are not yet verified. S0 remains blocked until a real Obsidian instance is used to load the package, confirm command registration, and capture startup/error observations.
- The package-generation step creates a downloadable CI artifact, but artifact creation alone does not satisfy G0.
