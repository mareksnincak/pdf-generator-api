---
name: architecture-decision-records
description: Creates Architecture Decision Records (ADRs) documenting key design choices with context, alternatives, and consequences. Use when the user asks to write, create, or add an ADR, architectural decision record, or architecture decision. Do not trigger when the user only wants to read, list, or discuss existing ADRs.
---

# Architecture Decision Records

## Quick start

Infer the topic from the conversation context, then follow the workflow below to create the ADR and register it.

## Workflow

1. Read `docs/architecture-decision-records/README.md` to determine the next ADR number (count existing entries + 1).

2. Read `002-iac-tooling.md` and `003-single-table-dynamodb-design.md` to match the writing style.

3. Create `docs/architecture-decision-records/<NNN>-<kebab-case-title>.md`:
   - `# <Title>` - short noun-phrase matching the filename
   - `## Context` - the situation or problem; include constraints, prior state, and why the status quo was insufficient
   - `## Decision` - what was decided and why; focus on reasoning and intent, not file paths or implementation details
   - `## Alternatives considered` - one `###` subsection per alternative, each explaining why it was rejected
   - `## Consequences` - bullet list of concrete outcomes (positive and negative), things that change, and operational implications

4. Append to the README index:
   ```
   <N>. [<Title>](./<NNN>-<kebab-case-title>.md)
   ```
