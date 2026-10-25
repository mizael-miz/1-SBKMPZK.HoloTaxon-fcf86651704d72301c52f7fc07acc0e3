# Operations contract

Status: proposed for M0; human-owner acceptance required.

## Authority and changes
- The human project owner is the sole final decision-maker and merger.
- Work must be performed on a branch and proposed through a pull request.
- Never merge a pull request or alter open fix PRs #12, #13, #14, or #15 as part of governance bootstrap.
- Claim a ticket before opening a solution PR. Until ADR-0001 is accepted, PR #12 is the accepted base sequence for convergence; bundling selection follows AUD-0001.
- G0 is a human-owned acceptance gate. No release or live-acceptance claim before the packaged artifact is installed in a disposable real Obsidian vault and evidence is recorded on issue #2.

## Work loop
1. Read root AGENTS.md and governance/CHARTER.md.
2. Read only the assigned ticket, dependencies, and cited evidence.
3. Claim/record ownership and update ticket state before implementation.
4. Make a focused branch change; run relevant validation and tests.
5. Record durable state changes as individual events under ledgers/events/.
6. Open a PR with file map, acceptance criteria, test evidence, risks, and unresolved decisions.
7. Human owner reviews and merges. Do not self-merge.

## Evidence discipline
- Separate observed facts, reproduced results, inference, and hypotheses.
- Preserve source URLs, retrieval timestamps, exact versions/commits, and test environments.
- Store external audit reports verbatim under the assigned report directory. Do not rewrite reports into evidence records; evidence records point to the original report.
- A simulated loader or mocked vault proves only behavior within that simulation.
- CI, package assembly, and local tests do not prove real Obsidian/Android acceptance.

## Repository-backed coordination
- Canonical messages live in coordination/bus/. Inbox files are pointers/copies and must retain message_id.
- Assume at-least-once delivery; consumers must be idempotent. Do not assume global message ordering.
- Never put credentials or secrets in messages, issues, commits, or artifacts.
- Use append-only corrections rather than silently editing historical messages/events.

## Ticket states
Allowed states: unaddressed, ready, claimed, resolving, solution_pending, workflow_pending, project_pending, verification_pending, resolved, blocked, rejected, superseded.
A ticket may be resolved only when acceptance criteria have verification evidence and any required human approval is recorded. Expired claims return to ready or blocked with an event.

## M0 gate
M0 exits only when the human owner accepts the architecture boundaries and the governance PR. This PR does not close S0/G0 or authorize release.
