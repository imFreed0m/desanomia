# 11 API Contract

Base path `/api/v1`. JSON. Auth by session cookie (httpOnly, SameSite=Strict). State-changing requests carry a CSRF header. [PROPOSED, SPEC defines roles and session auth]

## Roles

V = viewer, O = operator, A = admin. Higher includes lower.

## REST

| Method and path | Role | Purpose |
| --- | --- | --- |
| POST /auth/login | none | username and password, sets session |
| POST /auth/logout | V | end session |
| GET /auth/me | V | current user and role |
| GET /state | V | current FSM, fault, connectivity, last telemetry |
| POST /batches/start | O | body `{confirm: true}`, publishes cmd/batch/start |
| POST /batches/abort | O | body `{confirm: true}` [PROPOSED] |
| GET /batches | V | paginated history, filters by date, status, gate_result |
| GET /batches/{id} | V | batch row |
| GET /batches/{id}/events | V | timeline |
| POST /faults/reset | O | body `{confirm: true}` |
| GET /faults | V | active and past faults |
| POST /actuators/{name} | O | body `{state: on or off}`, manual mode, may be rejected by interlock |
| GET /telemetry | V | `from`, `to`, `resolution` (raw, 1m), max 10k points |
| GET /schedules, POST /schedules | V, O | list, create |
| PUT /schedules/{id}, DELETE /schedules/{id} | O | update, delete |
| GET /users, POST /users | A | list, create |
| PUT /users/{id}, DELETE /users/{id} | A | change role, deactivate, reset password |
| GET /health | none | backend, database, broker, device online |

## Command semantics

Command endpoints return 202 with `{cmd_id}` after publish, then resolve through WebSocket `command_result`. If no ack in 3 s, result is `timeout`. If firmware rejects, result is `rejected` with `reason` naming the interlock or FSM state. The UI shows the reason verbatim.

## WebSocket

`/ws` authenticated by the session cookie. Server pushes:

```json
{"type":"state","data":{"fsm":"DOSING","batch_id":42,"fault_code":null,"ts":"..."}}
{"type":"telemetry","data":{"tds_ppm":598.2,"drum2_level_pct":71.4,"drum2_volume_l":99.9,"ts":"..."}}
{"type":"actuators","data":{"dosing_pump":{"on":true,"source":"fsm"}}}
{"type":"event","data":{"batch_id":42,"event_type":"state_enter","state":"MIXING","ts":"..."}}
{"type":"device","data":{"online":true,"last_seen":"..."}}
{"type":"command_result","data":{"cmd_id":"...","result":"accepted","reason":null}}
```

On connect the server sends a full snapshot (`state`, `telemetry`, `actuators`, `device`). Client reconnects with backoff and shows stale state while disconnected.

## Errors

```json
{"error":{"code":"INTERLOCK_REJECTED","message":"...","detail":{}}}
```

Codes: UNAUTHENTICATED 401, FORBIDDEN 403, VALIDATION_ERROR 422, NOT_FOUND 404, DEVICE_OFFLINE 409, INVALID_STATE 409, INTERLOCK_REJECTED 409, COMMAND_TIMEOUT 504, RATE_LIMITED 429, INTERNAL 500.

## Rules

Every state-changing call writes audit_log. Viewer receives no command endpoints. Login is rate limited. Responses never include password hashes or session ids.
