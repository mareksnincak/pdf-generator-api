---
name: architecture-decision-records
description: Create a new Architecture Decision Record (ADR) for this project.
---

Create a new Architecture Decision Record (ADR) for this project.

TRIGGER when: the user asks to write/create/add an ADR, architectural decision record, or architecture decision.
DO NOT TRIGGER when: the user asks to read, list, or discuss existing ADRs without creating a new one.

## Steps

1. Read `docs/architecture-decision-records/README.md` to find the next ADR number (count existing entries and increment by 1).

2. Read `002-iac-tooling.md` and `003-single-table-dynamodb-design.md` to match the writing style and structure.

3. Create the ADR file at `docs/architecture-decision-records/<NNN>-<kebab-case-title>.md` using this structure:
   - `# <Title>` - short, noun-phrase title matching the filename
   - `## Context` - what situation or problem prompted this decision; include relevant constraints, prior state, and why the status quo was insufficient
   - `## Decision` - what was decided and why; focus on the reasoning and intent, not implementation details or references to specific files, code, or configuration
   - `## Alternatives considered` - one `###` subsection per alternative; each must explain why it was rejected, not just what it is
   - `## Consequences` - bullet list of concrete outcomes (good and bad), things that change, and operational implications

4. Add an entry to `docs/architecture-decision-records/README.md`:
   ```
   <N>. [<Title>](./<NNN>-<kebab-case-title>.md)
   ```

The topic/subject for the ADR is inferred from the conversation context.
