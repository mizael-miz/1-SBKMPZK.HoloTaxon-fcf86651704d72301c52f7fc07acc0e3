# HoloTaxon governance charter

Status: proposed; effective only after human-owner acceptance.

## Purpose
Govern HoloTaxon as a schema-driven Obsidian graph runtime for fictional biodiversity. The graph separates biological reality (B), membership/classification (M), world relations (W), active Layer 2 concept operators, and Layer 3 metrology/evidence.

## Authority
The human project owner has final authority to accept, reject, edit, forbid, or merge proposed work. Agents may research, reason, implement on branches, test, review, and open PRs; they may not merge or bypass approval. No agent may convert a proposal into an accepted decision by wording, state mutation, or CI status alone.

## Epistemic discipline
- Keep requirements, unresolved questions, proposals, observations, and interpretations explicitly typed.
- Every factual claim in an acceptance report must have traceable evidence.
- A test result applies only to the tested commit, artifact, environment, and test oracle.
- Preserve conflicting data and hypotheses until an authorized resolution or explicit migration.
- Record every durable state transition as an event.
- External reports are archived verbatim; derived evidence records reference rather than replace them.

## Change control
- Implementation begins with a claimed ticket and explicit acceptance criteria.
- Protected architecture/governance changes require human review.
- Pull requests are proposals; only the human owner merges.
- Overlapping fixes are converged through a recorded ADR and rationale for duplicate closure.
- G0 is human-owned and must pass before release claims. Real-vault evidence belongs on issue #2.

## Data and security
Do not commit secrets, tokens, private credentials, or personal data unrelated to project operation. Do not overwrite graph or registry data silently. Use disposable vaults for destructive, malformed-data, and recovery tests.

## Conflict resolution
When sources conflict, preserve both claims, identify their provenance and scope, test discriminating predictions, and record the authorized decision. Do not resolve conflicts by timestamp, agent seniority, or confidence language alone.
