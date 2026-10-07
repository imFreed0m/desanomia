# 18 Decisions

Log every design choice. Status: Accepted (from SPEC.md v1.0.0), Proposed (drafted in brain/, needs owner confirmation), Open (needs an answer). Do not change an Accepted decision without updating SPEC.md first.

## Accepted

D-001 Open-loop feedforward dosing, no closed-loop correction. Reason: predictable, simpler safety case.
D-002 One-way TDS safety gate at 550 to 650 ppm, target 600. Reason: block bad batches without adding control loops.
D-003 Five safety interlocks enforced in ESP32 firmware, no override. Reason: safety must not depend on network, backend, or UI.
D-004 Single distribution pump feeding all 6 beds simultaneously, no per-zone valves in Phase 1.
D-005 Stack: ESP32 + FreeRTOS, Mosquitto, FastAPI + aiomqtt + WebSocket, PostgreSQL, React + Vite + TypeScript + Tailwind + shadcn/ui + ECharts, Docker Compose on Raspberry Pi 4/5.
D-006 Roles Admin, Operator, Viewer with session-based username and password auth.
D-007 Internal network only, remote access via Tailscale, Telegram Bot for alerts.
D-008 Phase 1 non-goals listed in 01_PRD stay out of scope.

## Proposed

D-010 FSM executes on the ESP32, backend mirrors state. Reason: batch must survive network or backend loss. Confirm against SPEC.md.
D-011 Fault is a latched flag, not an 11th FSM state. Reason: SPEC lists 10 states and a Reset Fault action.
D-012 Gate failure halts distribution and latches a fault, no automatic re-dose.
D-013 Power loss mid-batch boots to IDLE with latched fault, no automatic resume.
D-014 Frontend is a static Vite bundle served by nginx on the Pi, fully offline-capable. Reason: control-room screen has no internet.
D-015 State-changing commands are never retried automatically, idempotent by cmd_id.
D-016 Raw telemetry kept 90 days then rolled up to 1-minute aggregates.
D-017 MQTT topic prefix `desanomia/gh1/` and ack-based command model (07).
D-018 PlatformIO for firmware, Python 3.12 backend, Alembic migrations.
D-019 Manual abort command (cmd/batch/abort) added as a safe-stop. Confirm whether SPEC allows it.
D-028 No sign up, email verification, or onboarding. Admin creates accounts, first Admin via CLI with forced password change.
D-029 Dark theme default for the control room, light theme via system preference or toggle, primary color blue so it never reads as a status color.
D-030 Manual actuator controls are disabled in the UI whenever FSM is not IDLE, firmware remains the authority. Confirm against SPEC.md.
D-031 Appflow (02) and UI/UX brief (03) are separate files from the UI behavior spec (12), so each can be handed to the AI on its own.
D-033 File numbering follows the development flow: product (01 to 03), technical foundation (04 to 07), cross-cutting rules (08, 09), component specs (10 to 12), quality and release (13 to 16), execution and logs (17 to 19).

## Open

D-020 Time source when the Pi has no internet: RTC plus local NTP, or another option.
D-021 UI language: Bahasa Indonesia for all labels or only where SPEC specifies.
D-022 Does Drum 1 have a level sensor, and what happens when concentrate runs out.
D-023 Exact gate inclusivity at 550 and 650, and exact gate-failure outcome.
D-024 Whether scheduled batches may start unattended.
D-025 Interlock definitions IL-01 to IL-05 copied into 10, plus any SPEC fault codes.
D-026 Session idle and absolute expiry values.
D-027 Whether firmware needs flash encryption and secure boot before go-live.
D-032 Brand colors, logo, and final typeface if the owner has any, which would replace the 03 palette.
