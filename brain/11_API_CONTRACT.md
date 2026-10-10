# 11 API Contract

Base path `/api/v1`. JSON format. Auth by session cookie (`HttpOnly`, `SameSite=Lax`, `Secure`). Tier-differentiated sessions: Kiosk persistent Operator session with 15-min Admin step-up; Gazebo TV read-only Viewer bearer token; Mobile PWA sliding 8h / 7-day cookie. State-changing requests carry a CSRF header. [Aligned with 00_MASTER_RULES.md, 04_TRD.md, 05_ARCHITECTURE.md, 06_DATA_MODEL.md, and 07_DATA_SOURCES.md]

## Roles

V = viewer, O = operator, A = admin. Higher includes lower.

## REST

| Method and path | Role | Purpose |
| --- | --- | --- |
| POST /auth/login | none | Username and password, establishes session |
| POST /auth/logout | V | Terminate current session |
| GET /auth/me | V | Current user and role info |
| GET /state | V | Current FSM, active fault, hardware connectivity, latest telemetry |
| POST /batches | O | Create batch (recipe_id, tank_id, timing 'now' vs 'later'), publishes `START_BATCH` to `desanomia/gh1/cmd` with UUID `cmd_id` |
| POST /batches/{id}/abort | O | Abort running batch, body `{confirm: true}`, safe halt via firmware |
| GET /batches | V | Paginated history, filters by date, status, gate_result |
| GET /batches/{id} | V | Detailed batch record with recipe snapshot and top-up metrics |
| GET /batches/{id}/events | V | Append-only event timeline from `batch_events` |
| POST /faults/reset | O | Body `{confirm: true}`, dispatches `RESET_FAULT` command; rejected by firmware if Drum 2 level $> 5.0\text{ L}$ or `hw_estop_pressed == true` |
| GET /faults | V | Latched and historical faults with Gated Reset clear timestamps |
| POST /concentrate/refill | O | Confirms physical 20 L / 2 kg NPK addition, resets virtual stock to 20,000 mL, logs `CONCENTRATE_REFILLED` |
| POST /actuators/{name} | O | Body `{state: on/off/jog, duration_ms}`, manual bump, guarded strictly by 7 safety interlocks |
| GET /telemetry | V | `from`, `to`, `resolution` (raw `telemetry`, 1m `telemetry_1m`), max 10k points |
| GET /recipes, POST /recipes | V, O | Named Recipe Presets Library (Vegetatif, Generatif, Panen) |
| PUT /recipes/{id}, DELETE /recipes/{id} | O, A | Update target TDS / tolerance band, soft-archive preset |
| GET /schedules, POST /schedules | V, O | Unified schedule timetable with Zero-Conflict Invariant validation |
| PUT /schedules/{id}, DELETE /schedules/{id} | O | Update or remove schedule slot |
| GET /users, POST /users | A | User administration (Admin only) |
| PUT /users/{id}, DELETE /users/{id} | A | Change role, deactivate user, reset password |
| GET /health | none | Health check: backend, database, broker, ESP32 wired Ethernet link |

## Command semantics

Command endpoints return HTTP 202 Accepted with `{ "cmd_id": "...", "status": "QUEUED" }` after publishing QoS 1 to `desanomia/gh1/cmd`. Handshake completes via correlated receipt on `desanomia/gh1/ack`. If no ACK arrives within **3.0 seconds**, the backend marks the command `TIMEOUT` (504) and surfaces an in-app toast. If firmware rejects, the response indicates `REJECTED` with the exact interlock code (e.g. `INTERLOCK_IL03_DRUM2_NOT_EMPTY`). UI disables buttons pessimistically until resolution.

## WebSocket Hub

Endpoint: `GET /api/v1/ws/telemetry` (authenticated via session cookie). Broadcasts consolidated frames at **1.0 Hz** (< 500 ms initial hydration on connect):

```json
{"type":"state","data":{"fsm":"MIXING","batch_id":1042,"tank_id":1,"fault_code":null,"ts":"2026-10-10T13:45:00Z"}}
{"type":"telemetry","data":{"tds_ppm":1248.5,"drum2_level_pct":100.0,"drum2_volume_l":140.0,"water_temp_c":27.0,"hw_estop_pressed":false,"ts":"2026-10-10T13:45:00Z"}}
{"type":"actuators","data":{"mixing_pump":{"on":true,"source":"fsm"}}}
{"type":"event","data":{"batch_id":1042,"event_type":"state_enter","state":"MIXING","ts":"2026-10-10T13:45:00Z"}}
{"type":"device","data":{"online":true,"liveness":"online","last_seen":"2026-10-10T13:45:00Z"}}
{"type":"command_result","data":{"cmd_id":"9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d","status":"ACCEPTED","reason":null}}
```

On disconnect or silent telemetry $> 12.0\text{ s}$, UI displays a yellow `STALE` badge; if silent $> 20.0\text{ s}$, UI displays red `OFFLINE` and disables control mutations.

## Errors

```json
{"error":{"code":"INTERLOCK_REJECTED","message":"...","detail":{"interlock":"IL-03"}}}
```

Standard codes: `UNAUTHENTICATED` 401, `FORBIDDEN` 403, `NOT_FOUND` 404, `INVALID_STATE` 409, `INTERLOCK_REJECTED` 409, `DEVICE_OFFLINE` 409, `VALIDATION_ERROR` 422, `RATE_LIMITED` 429, `COMMAND_TIMEOUT` 504, `INTERNAL` 500.

## Rules

Every state-changing call writes an immutable row to `audit_logs` with SHA-256 cryptographic chaining. Viewer role receives zero mutation endpoints. Login enforces Argon2id and rate limiting. Responses never leak password hashes or session tokens.
