# Agent operating contract

1. **Authority:** The human project owner is the only merger and final decision-maker. Never merge PRs.
2. **Before work:** Read this file, governance/CHARTER.md, architecture/MASTER.yaml, the assigned ticket, and only its referenced dependencies.
3. **Ticket first:** Claim a ticket before implementation or opening a solution PR. No new solution PR without a claimed ticket.
4. **Current fix sequence:** Until ADR-0001 is accepted, treat PR #12 as the base sequence. Do not edit or mutate open PRs #12–#15 during governance bootstrap. Bundling selection follows AUD-0001 and TSK-0003.
5. **G0:** TSK-0002 is owned by the human project owner. No release claim until the exact packaged artifact is tested in a disposable real Obsidian vault and the exact console output/environment evidence is recorded on issue #2.
6. **Evidence:** Distinguish observation, reproduction, inference, and hypothesis. Never treat CI or a simulation as live acceptance.
7. **Audit reports:** Store external reports verbatim under reports/audits/AUD-0001-LOADER-FAILURE/. Evidence records cite their paths and provenance; do not summarize a report into a substitute report.
8. **Events:** Every durable state change must be recorded under ledgers/events/. Do not rewrite history silently.
9. **Safety:** Never commit credentials/secrets. Preserve user data. Test destructive behavior only in disposable vaults.
10. **PRs:** Include scope, file map, event IDs, validation, acceptance criteria, risks, unresolved decisions, and explicit notice that the human owner must merge.
