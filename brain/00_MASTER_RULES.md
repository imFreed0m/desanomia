# 00 Master Rules

Entry point for every agent session on Desanomia. Read this file, then 01, 04, and 05, then only the files the task touches.

Tags used across brain/: [SPEC] comes from approved SPEC.md v1.0.0. [PROPOSED] is drafted here and needs owner confirmation. [VERIFY] is inferred from names or context, reconcile with SPEC.md before relying on it.

## Project

Desanomia is a web app for a semi-automatic greenhouse fertigation system (Greenhouse Utama) with ESP32 IoT integration. The ESP32 runs the batch process and safety interlocks. FastAPI backend and React UI monitor and command it. Phase 1 scope: automated fertigation only. [SPEC]

## Read order

1. 00_MASTER_RULES, 01_PRD, 04_TRD, 05_ARCHITECTURE at every session start
2. 06, 07 for data and MQTT work, 11 for API work
3. 10 for firmware work, 02, 03, 12 for frontend work (02 navigation and click flows, 03 visual system and layouts, 12 behavior and components)
4. 08, 09, 13 before merging anything that touches control, auth, or errors
5. 14, 15, 16 for CI, deployment, and go-live
6. 17_MICROTASKS to pick the next task, 18_DECISIONS before changing any design choice, 19_CHANGELOG after every merged task

## Hard rules

1. SPEC.md v1.0.0 is the source of truth. If a brain file conflicts with it, SPEC.md wins, fix the brain file, log it in 18_DECISIONS.
2. The 5 safety interlocks are enforced in ESP32 firmware only and cannot be bypassed in AUTO or MANUAL mode. Backend and UI never reimplement, relax, or bypass them, and no API may offer an override. [SPEC]
3. Dosing is open-loop feedforward with a one-way TDS safety gate. Never add closed-loop auto-adjust or re-dosing after measurement. [SPEC]
4. Target TDS 600 ppm, gate band 550 to 650 ppm. Read these from one config source, never hardcode in several places. [SPEC]
5. Distribution is simultaneous to all 6 beds through a single pump. No per-zone valve logic. [SPEC]
6. Phase 1 non-goals stay unbuilt: per-zone valves, closed-loop dosing, multi-greenhouse, crop management, environmental monitoring, native mobile app, e-commerce, AI/ML dosing. [SPEC]
7. The control-room screen has no WiFi or internet. No CDN, remote fonts, or external requests in the frontend bundle.
8. Never invent interlock logic, FSM transitions, or dosing formulas. If SPEC.md does not define it, stop and ask.
9. Technical artifacts, code, comments, commits in English. UI labels follow SPEC wording (for example "Mulai Batch").
10. No secrets in git. Use .env files excluded by .gitignore and GitHub Actions secrets.

## Workflow

One microtask at a time from 17_MICROTASKS. Write the failing test first for FSM, gate, auth, and command logic. Finish with: tests green, lint and type checks green, 19_CHANGELOG updated, 18_DECISIONS updated if a choice was made.

## Definition of done

Acceptance line of the task met, CI green, no new [VERIFY] left unresolved in touched files without a note in 18_DECISIONS, and no safety rule above weakened.
