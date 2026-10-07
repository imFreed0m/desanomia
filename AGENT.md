# DESANOMIA

Research greenhouse IoT system spanning ESP32 firmware, backend/edge services, and a web dashboard.

## Project invariants

- `docs/CONSTITUTION.md` is the authority for safety-critical system invariants.
- `docs/SPEC.md` is the authority for frozen empirical/system constants.
- Never weaken, bypass, or remove safety interlocks, actuator guards, sensor conditioning, or data-integrity controls.
- Do not reintroduce rejected architecture: stepper motor, dual flow meter, DS18B20 ATC, per-zone solenoid manifold, or closed-loop auto-dosing.
- Preserve the existing architecture unless the task explicitly changes it.

## Domain boundaries

- `brain/**` — [TO BE FILLED].
- `frontend/**` — dashboard/UI. 
- `backend/**` — API, services, edge/infrastructure.
- `firmware/**` — ESP32, FreeRTOS, sensors, actuators.
- `hardware/**` — hardware/BOM documentation.
- `docs/**` — project specifications, architecture, decisions, and records. [NEEDS ALLIGMENT WITH brain/]
- Keep changes inside the relevant domain. Cross-domain edits require an explicit end-to-end integration task.

## Working rules

- Read only the relevant scoped `AGENTS.md`, rule, skill, and canonical docs.
- Reuse existing patterns and dependencies before adding new ones.
- Avoid speculative abstractions and unrelated refactors.
- Fix shared root causes rather than patching symptoms.
- Validate changed behavior with the narrowest appropriate deterministic check.
- Do not alter `AGENTS.md` or `docs/CONSTITUTION.md` from autonomous loops.

## Canonical docs

`docs/CONSTITUTION.md` → safety/system invariants
`docs/SPEC.md` → frozen technical/field constants
`docs/ARCHITECTURE.md` → system boundaries and integration
`docs/decisions.md` → accepted/rejected design decisions

For workflow procedures, use `.agents/rules/`. For specialized expertise, load the matching skill from `.agents/skills/`.
