# 17 Microtasks

Do one task at a time, in order within a milestone. Each line: id, task, done when. Update 19_CHANGELOG after each.

## M0 Repo and docs

T-001 Create monorepo folders (firmware, backend, frontend, deploy, simulator, docs, brain). Done when: folders committed with READMEs.
T-002 Copy SPEC.md to docs/ and resolve every [VERIFY] tag in brain/. Done when: no [VERIFY] remain or each is logged in 18.
T-003 Add .gitignore, .editorconfig, pre-commit (ruff, prettier). Done when: pre-commit runs clean.

## M1 Backend

T-010 FastAPI skeleton with /health, config via env. Done when: container starts, /health 200.
T-011 SQLAlchemy models and first Alembic migration from 06. Done when: migration up and down works on empty DB.
T-012 Session auth and RBAC dependency. Done when: tests prove viewer gets 403 on command routes.
T-013 User management endpoints (Admin) and first-admin CLI with forced password change. Done when: create, role change, deactivate, first-login password change tested.
T-014 aiomqtt subscriber persisting telemetry, state, events, device status. Done when: published messages appear in DB.
T-015 WebSocket endpoint with snapshot and live fan-out. Done when: client receives snapshot then updates.
T-016 Command publishing with cmd_id, ack handling, timeout. Done when: accepted, rejected, timeout paths tested.
T-017 Batch, event, fault, telemetry read endpoints. Done when: pagination and filters tested.
T-018 Schedules CRUD and scheduler that issues start commands. Done when: schedule fires against simulator.
T-019 Telegram alerts with dedupe and retry queue. Done when: fault alert received, offline queue flushes.
T-020 Audit log on every state-changing route and login. Done when: test asserts a row per action.
T-021 Retention and rollup jobs. Done when: old telemetry rolled up and removed.

## M2 Simulator

T-030 Simulator implementing 05 topics and the 10-state FSM with configurable timings. Done when: full batch runs end to end.
T-031 Fault injection (sensor range, gate fail, offline, interlock trip). Done when: each produces the expected fault.

## M3 Frontend

T-040 Vite, TypeScript, Tailwind, shadcn/ui, router, self-hosted fonts. Done when: build has no external origins.
T-041 Login page, session handling, route guards, 403 and 404, return-to-path after expiry per 02. Done when: viewer, operator, admin routes guarded and expiry returns to the saved path.
T-042 WebSocket store with reconnect and stale state. Done when: unplugging backend shows stale banner.
T-043 UI-01 FSM status card, UI-02 TDS gauge, UI-03 Drum 2 tank. Done when: values update live from simulator.
T-044 UI-04 actuator panel, UI-05 timeline, UI-07 connectivity indicator. Done when: match simulator data.
T-045 UI-08 Mulai Batch and UI-09 Reset Fault with confirmation and result states. Done when: accepted, rejected, timeout shown.
T-046 UI-06 TDS history chart and UI-10 batch history with detail page. Done when: gate band shaded, filters work.
T-047 UI-11 manual controls, UI-12 schedules, UI-14 user management. Done when: role restrictions verified.
T-048 Kiosk mode and offline-origin CI check. Done when: dashboard fits 1920x1080, CI fails on external origin.
T-049 Implement 03 design tokens (CSS variables, Tailwind config, ECharts theme) and light and dark themes. Done when: both themes render, contrast checked.

## M4 Firmware

T-060 PlatformIO project, FreeRTOS task skeleton, watchdog. Done when: boots and runs idle tasks.
T-061 Sensor drivers with filtering and range validation. Done when: bench values match reference within agreed tolerance.
T-062 Actuator HAL as the single output owner. Done when: no other code writes outputs.
T-063 Interlock module with the 5 SPEC interlocks and native tests. Done when: each trips and cannot be overridden.
T-064 FSM and gate with native tests per 13. Done when: all must-have firmware tests green.
T-065 MQTT client, Last Will, command handling, ack. Done when: works against simulator-tested backend.
T-066 NVS config with cmd/config/set. Done when: values persist across reboot and respect hard limits.
T-067 Boot recovery, connectivity-loss behavior, event buffering. Done when: tests 5 and 6 in 13 pass.
T-068 Signed OTA with rollback. Done when: update and forced rollback both work.

## M5 Integration and CI

T-080 Docker Compose stack with Mosquitto, ACLs, Postgres, backend, frontend. Done when: one command brings up everything.
T-081 GitHub Actions per 14. Done when: all required checks green on a PR.
T-082 Playwright E2E against stack plus simulator. Done when: login, batch, fault, role tests pass.

## M6 Bench and hardware

T-090 Bench wiring and actuator tests with water. Done when: every actuator verified.
T-091 Sensor calibration and record. Done when: calibration table committed to docs/.
T-092 Interlock trigger tests on hardware. Done when: all 5 observed safe.
T-093 Full water-only batch. Done when: gate evaluates, distribution runs, batch closes.

## M7 Production

T-100 Deploy to Beelink EQ12 Mini PC, auto-start, backups, restore test. Done when: 16 operations section ticked.
T-101 Tailscale ACLs and port scan. Done when: security section of 16 ticked.
T-102 Control-room kiosk with internet unplugged. Done when: dashboard fully functional.
T-103 Supervised first fertilizer batch, then 7-day review. Done when: 16 first runs ticked.
