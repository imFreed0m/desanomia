# Project Documentation

Applies only to `docs/**`.

## Source-of-truth order

1. `CONSTITUTION.md` — non-negotiable safety/system invariants.
2. `SPEC.md` — frozen technical and field constants.
3. `ARCHITECTURE.md` — component/service boundaries and integration.
4. `decisions.md` — accepted/rejected design decisions.
5. `craft-floor.md` — implementation gotchas and accumulated practical knowledge.

## Rules

- Do not change a higher-authority document merely to make implementation convenient.
- Record intentional architecture changes in the appropriate decision/spec document.
- Keep factual constants in their canonical source; do not duplicate conflicting copies.
- Autonomous loops may append implementation gotchas to `craft-floor.md` but must not modify `CONSTITUTION.md`.
