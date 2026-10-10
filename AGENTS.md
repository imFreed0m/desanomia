# DESANOMIA

Research greenhouse IoT system spanning ESP32 firmware, backend/edge services, and a web dashboard.

## Project Map & Domain Boundaries

- `brain/**` — PRD, TRD, architecture, data model, API, firmware, decisions. Authority starts at `brain/00_MASTER_RULES.md`.
- `firmware/**` — ESP32, FreeRTOS, sensor conditioning, actuators.
- `backend/**` — API, edge services, infrastructure.
- `frontend/**` — Dashboard UI.
- `hardware/**` — Hardware schematics and BOM.
- `.agents/**` — Project rules and skills.

<important if="you are receiving, planning, or executing any task">
- Skill Pre-Flight Requirement: Before taking any action or planning steps, scan `.agents/skills/` to identify all skills relevant to the user request.
- Mandatory Execution: If any relevant skill exists in `.agents/skills/<skill-name>/SKILL.md`, read and invoke its instructions first before modifying code, querying tools, or generating output.
</important>

<important if="you are designing, implementing, modifying, or reviewing code or architecture">
- Safety Critical: Never weaken, bypass, or remove safety interlocks, actuator guards, sensor conditioning, or data-integrity controls.
- Forbidden Regressions: Do NOT reintroduce rejected architectures.
- System Authority: `brain/00_MASTER_RULES.md` and `brain/18_DECISIONS.md` govern system invariants.
- Domain Isolation: Keep changes inside the relevant domain directory. Cross-domain edits require an explicit integration task.
- Self-Protection: Do not alter `AGENTS.md` or `brain/00_MASTER_RULES.md` from autonomous loops.
</important>

<important if="you are creating, triaging, or updating issues in .scratch/">
- Issue Tracking: File markdown issues under `.scratch/<feature>/` (see `.agents/issue-tracker.md`).
- Triage Vocabulary: Use the 5-status schema (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`) in the `Status:` line (see `.agents/triage-labels.md`).
</important>

<important if="you need canonical vocabulary or architecture references">
- Terminology: Consult `brain/20_GLOSSARY.md` for required domain vocabulary and forbidden terms.
- Decisions: Consult `brain/18_DECISIONS.md` before proposing architectural changes.
</important>
