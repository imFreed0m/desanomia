# DESANOMIA

Research greenhouse IoT system spanning ESP32 firmware, backend/edge services, and a web dashboard.

## Project invariants

- `brain/00_MASTER_RULES.md` and `brain/18_DECISIONS.md` are the authority for system invariants and accepted decisions.
- `docs/SPEC.md` is the authority for frozen empirical/system constants.
- Never weaken, bypass, or remove safety interlocks, actuator guards, sensor conditioning, or data-integrity controls.
- Do not reintroduce rejected architecture: stepper motor, dual flow meter, DS18B20 ATC, per-zone solenoid manifold, or closed-loop auto-dosing.
- Preserve the existing architecture unless the task explicitly changes it.

## Domain boundaries

- `brain/**` — project spec set (PRD, TRD, architecture, data model, API, firmware, decisions). Start at `brain/00_MASTER_RULES.md`.
- `frontend/**` — dashboard/UI.
- `backend/**` — API, services, edge/infrastructure.
- `firmware/**` — ESP32, FreeRTOS, sensors, actuators.
- `hardware/**` — hardware/BOM documentation.
- `docs/**` — agent config (`docs/agents/`), test results, and working notes. Not the spec; that lives in `brain/`.
- Keep changes inside the relevant domain. Cross-domain edits require an explicit end-to-end integration task.

## Working rules

- Read only the relevant scoped `AGENTS.md`, rule, skill, and canonical docs.
- Reuse existing patterns and dependencies before adding new ones.
- Avoid speculative abstractions and unrelated refactors.
- Fix shared root causes rather than patching symptoms.
- Validate changed behavior with the narrowest appropriate deterministic check.
- Do not alter `AGENTS.md` or `brain/00_MASTER_RULES.md` from autonomous loops.

## Canonical docs

`brain/00_MASTER_RULES.md` → entry point, read order, safety/system rules
`brain/05_ARCHITECTURE.md` → system boundaries and integration
`brain/18_DECISIONS.md` → accepted/rejected design decisions
`docs/SPEC.md` → source of frozen constants (`[SPEC]`); transitional, `brain/` is being aligned to it

For workflow procedures, use `.agents/rules/`. For specialized expertise, load the matching skill from `.agents/skills/`.

## Agent skills

### Issue tracker

Issues live as markdown files under `.scratch/<feature>/`. See `docs/agents/issue-tracker.md`.

### Triage labels

Default five-role vocabulary (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`), recorded in each issue's `Status:` line. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: one `GLOSSARY.md` + `docs/adr/` at the repo root. See `docs/agents/domain.md`.
