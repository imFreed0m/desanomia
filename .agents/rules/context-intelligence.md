---
trigger: model_decision
description: "Use indexed project context before broad codebase exploration, unfamiliar code changes, cross-module debugging, or architectural work."
---

# Context Intelligence

Use the minimum context sources needed for the task. Do not run the full stack by default.

## Source Selection

* `claude-mem` → recent work, decisions, blockers, prior attempts.
* `graphify` → architecture, module boundaries, dependency topology.
* `codegraph` → symbols, definitions, references, callers, callees, impact.
* `openviking` → specifications, domain rules, schemas, architectural knowledge.

## Workflow

For a clearly targeted file and change:

* Read the relevant code.
* Edit directly.
* Verify the result.

For unfamiliar or cross-file code:

1. Use `codegraph` to locate relevant symbols and relationships.
2. Use `graphify` when architectural boundaries or dependency impact matter.
3. Use `claude-mem` when prior work or decisions may affect the task.
4. Use `openviking` when requirements, domain rules, or specifications are relevant.
5. Read only the source sections required to implement or diagnose the change.

Do not assume this is a fixed sequence. Escalate only when the current context is insufficient.

## Search Discipline

Prefer indexed tools over repository-wide scanning.

Avoid:

```bash
grep -r .
find .
```

Use bounded `rg`, file inspection, or other direct search only when indexed tools cannot answer the question.

## Reliability

* Treat memory and indexes as context, not proof; verify important claims against source.
* Never fabricate unavailable tool results.
* Continue with bounded local inspection when a daemon, MCP server, or index is unavailable.
* Do not repeatedly retry a failed service.

## Verification

After meaningful changes, run the smallest relevant test, type check, lint, build, or validation command.

Do not claim verification without actually performing it.
