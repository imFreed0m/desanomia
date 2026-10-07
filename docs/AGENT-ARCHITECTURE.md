# Agent Instruction Architecture

This project separates instructions by scope to minimize always-loaded context and prevent conflicting rules.

| File | Scope | Loaded when |
|---|---|---|
| `GEMINI.md` | User/platform-wide Antigravity behavior | Every technical task |
| `AGENTS.md` | Greenhouse V2 project invariants and boundaries | Every task in this repository |
| `<domain>/AGENTS.md` | Domain-specific engineering rules | Only when working in that domain |
| `.agents/rules/*.md` | Procedural workflows | Only when the workflow applies |
| `.agents/skills/*` | Specialized expertise | Only when the task needs it |
| `docs/*.md` | Canonical system knowledge | Only when the task requires the information |

## Separation principle

`GEMINI.md` answers: “How should this user-facing Antigravity agent generally operate?”

`AGENTS.md` answers: “What must be preserved in this greenhouse repository?”

Scoped `AGENTS.md` files answer: “What is special about this technical domain?”

Rules answer: “How should a particular workflow be executed?”

Skills answer: “What specialized knowledge or procedure is needed?”

Documentation answers: “What is true about the system?”

Do not solve the same problem in more than one layer.

## Deliberate removals from the old files

- Removed the full skill catalogue from root project instructions.
- Removed MCP-specific schemas and filesystem paths from project policy.
- Removed session/memory implementation details from root project policy.
- Removed UI-specific lint/design instructions from the root.
- Removed the seven-rung “Ponytail” ladder; retained its useful outcome as minimal-change/root-cause guidance.
- Removed repeated safety numbers from the root; keep them in canonical safety/spec documents and load them for relevant firmware/hardware work.
