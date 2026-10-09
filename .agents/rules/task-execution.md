# Task Execution

Use only when task depth requires more than the root workflow.

## L0
Inspect target → edit → verify.

## L1
Targeted search → inspect context → edit → verify.

## L2
Read relevant context/spec → inspect structure → analyze dependencies → plan → edit → verify → review diff.

## L3
Read architecture/spec → map dependencies → identify failure modes → plan → incremental edits → full verification → review diff → architecture check.

## For all levels

- Start at the shallowest useful layer; escalate only when evidence requires it.
- Prefer deterministic tools and repository evidence.
- Fix root causes, not individual symptoms.
- Keep unrelated files untouched.
- A failed command or verification result keeps the task open until resolved or explicitly blocked.
