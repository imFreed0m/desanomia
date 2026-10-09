# Domain Docs

How engineering agents and skills consume Desanomia's domain documentation when exploring the codebase.

## Before exploring, read these

- **`brain/20_GLOSSARY.md`**: Canonical domain vocabulary, ubiquitous language, and explicit forbidden synonyms (`_Avoid_`).
- **`brain/00_MASTER_RULES.md`**: System invariants, read order, safety controls, and architecture boundaries.
- **`brain/18_DECISIONS.md`**: Architectural Decision Log containing accepted and rejected design decisions (D-001 through latest).
- **`brain/05_ARCHITECTURE.md`**: Component boundaries, communication protocols (MQTT, WebSocket), and hardware/software topologies.
- **`docs/SPEC.md`**: Empirical frozen constants, sensor calibrations, and system constants (`[SPEC]`).

## Repository structure

Desanomia is organized with consolidated specifications in `brain/`, domain runtime components, and agent guidance in `.agents/`:

```
/
├── brain/                         ← Unified project spec set, decisions & glossary
│   ├── 00_MASTER_RULES.md         ← Entry point, system invariants, read order
│   ├── 05_ARCHITECTURE.md         ← System boundaries & network topology
│   ├── 17_MICROTASKS.md           ← Ordered implementation task list (M0–M5)
│   ├── 18_DECISIONS.md            ← Formal architectural decisions (D-001+)
│   ├── 19_CHANGELOG.md            ← Specification and implementation changelog
│   └── 20_GLOSSARY.md             ← Canonical ubiquitous domain vocabulary
├── docs/                          ← Reference docs, test notes, empirical constants
│   └── SPEC.md                    ← Source of frozen constants ([SPEC])
├── frontend/                      ← React + Vite + TypeScript + Tailwind UI
├── backend/                       ← FastAPI + aiomqtt + PostgreSQL edge stack
├── firmware/                      ← ESP32-S3 FreeRTOS C/C++ firmware
├── hardware/                      ← Electrical schematics, wiring, BOM
└── .agents/                       ← Agent configuration, rules, and skills
    ├── domain.md                  ← This domain doc guideline
    ├── issue-tracker.md           ← Issue tracking & scratch convention
    ├── triage-labels.md           ← Five-role triage label mappings
    ├── rules/                     ← Procedural rules (.agents/rules/)
    └── skills/                    ← Specialized agent skills (.agents/skills/)
```

## Use the glossary's vocabulary

When your output names a domain concept (in an issue title, a refactor proposal, a test name, or variable/function naming), use the term as defined in `brain/20_GLOSSARY.md`.
Do not drift to synonyms the glossary explicitly avoids:
- Use **Concentrate Drum (Drum 1)**, *never* Drum pekat, Jerigen stok, Stock container.
- Use **Distribution Drum (Drum 2)**, *never* Drum nutrisi, Tandon air, Mixing drum, Reservoir.
- Use **Raised Bed**, *never* Bedeng, Zone, Plot.
- Use **Batch**, *never* Run, Cycle, Dosing job.
- Use **Single-Pass Top-Up Recovery**, *never* Closed-loop auto-dosing, Iterative top-up.

If the concept you need isn't in `brain/20_GLOSSARY.md` yet, that's a signal: either you're inventing language the project doesn't use (reconsider) or there is a real gap (propose adding it to `brain/20_GLOSSARY.md`).

## Flag Decision & Architecture conflicts

If your proposal contradicts an accepted decision in `brain/18_DECISIONS.md` or invariant in `brain/00_MASTER_RULES.md`, surface it explicitly rather than silently overriding:

> _Contradicts Decision D-025 (Configurable Recipe Targets), but worth reopening because…_
