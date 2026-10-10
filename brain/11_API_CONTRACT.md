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

## MQTT Fieldbus Contract (`desanomia/gh1/#`)

Dedicated to the isolated OT LAN (`ETH0:1883`, Mosquitto broker on Beelink EQ12). ESP32-S3 and FastAPI backend communicate exclusively via QoS 0/1 topics under the `desanomia/gh1/` namespace:

### 1. Topic Topology

```
desanomia/gh1/
  ├── cmd             [QoS 1]  (Backend -> ESP32: discrete state-changing commands)
  ├── ack             [QoS 1]  (ESP32 -> Backend: correlated UUID execution receipts)
  ├── telemetry       [QoS 0]  (ESP32 -> Backend: periodic multi-sensor telemetry stream)
  ├── events          [QoS 1]  (ESP32 -> Backend: discrete FSM state transitions & safety trips)
  └── status          [QoS 1]  (ESP32 -> Backend: LWT liveness heartbeat, retain=true)
```

> **Identifier Mapping Note:** In all MQTT command, telemetry, and event payloads, the integer field `tank_pair_id` (1–5, e.g. `1`) maps directly to foreign key column `tank_id` in PostgreSQL tables `batches`, `telemetry`, and `schedules` (referencing `tank_pairs(id)` in [06_DATA_MODEL.md](file:///home/maria_zahra/Documents/projects/greenhouse/desanomia/brain/06_DATA_MODEL.md)).

### 2. Command Payload Schema (`desanomia/gh1/cmd` - QoS 1)

Every command carries a UUIDv4 `cmd_id` and strict payload typing:

```json
{
  "cmd_id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
  "type": "START_BATCH",
  "batch_id": 1042,
  "recipe_id": 2,
  "recipe_name": "Fase Generatif",
  "target_tds_ppm": 1250,
  "tolerance_band_ppm": 50,
  "tank_pair_id": 1,
  "force_same_day_override": false,
  "timestamp": 1728518400
}
```

*Command `type` Discriminators:*
- `START_BATCH`: Initiates active preparation FSM (`batch_id`, `recipe_id`, `target_tds_ppm`, `tank_pair_id`).
- `RESUME_FILL`: Re-opens clean water fill valve following `FAULT_NO_WATER_SUPPLY` or `FAULT_FILL_TIMEOUT`.
- `RESUME_DEFICIT_BATCH`: Acknowledges Pause Mode (`BATCH_PAUSED_INSPECTION`) to execute calculated deficit dosing.
- `RESET_FAULT`: Clears latched fault (validated against Drum 2 $\le 5.0\text{ L}$ and `hw_estop_pressed == false`).
- `ESTOP`: Software Emergency Stop trigger de-energizing all relays in $< 100\text{ ms}$.
- `MANUAL_ACTUATOR`: Executes discrete manual bump (`{"actuator": "dosing_pump", "duration_ms": 1070}` for +10 mL, or `{"actuator": "mixing_pump", "duration_ms": 15000}`).
- `CALIBRATE_SENSOR`: Commits calibrated slope and offset to ESP32 NVS (`{"sensor": "tds", "slope": 1.1245, "offset": 0.0421}`).

### 3. Command ACK Payload Schema (`desanomia/gh1/ack` - QoS 1)

```json
{
  "cmd_id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
  "status": "ACCEPTED",
  "fsm_state": "FILLING_WATER",
  "reason": null,
  "timestamp": 1728518401
}
```
*Rejected ACK Example:*
```json
{
  "cmd_id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
  "status": "REJECTED",
  "fsm_state": "IDLE",
  "reason": "INTERLOCK_IL03_DRUM2_NOT_EMPTY",
  "timestamp": 1728518401
}
```

### 4. Consolidated Telemetry Stream (`desanomia/gh1/telemetry` - QoS 0)

Published every 5.0 seconds (accelerated to 1.0 second during `MEASURING_TDS`, `GATE_EVALUATE`, and calibration):

```json
{
  "timestamp": 1728518405,
  "tank_pair_id": 1,
  "fsm_state": "MIXING",
  "drum2_volume_l": 140.0,
  "drum2_level_pct": 100.0,
  "tds_ppm": 1248.5,
  "water_temp_c": 27.0,
  "relays": {
    "fill_valve": false,
    "dosing_pump": false,
    "mixing_pump": true,
    "dist_pump": false
  },
  "hw_estop_pressed": false,
  "active_fault": null,
  "cmd_ack_id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
  "eth_link": true,
  "free_heap_bytes": 194820,
  "uptime_seconds": 86420
}
```

### 5. Batch Lifecycle Event Journal (`desanomia/gh1/events` - QoS 1)

Emitted upon every discrete FSM transition, gate result, top-up injection, or fault trip:

```json
{
  "event_id": 48102,
  "batch_id": 1042,
  "tank_pair_id": 1,
  "ts": 1728518460,
  "from_state": "DOSING",
  "to_state": "MIXING",
  "trigger": "DOSING_COMPLETE",
  "payload": {
    "concentrate_injected_ml": 842.1,
    "target_tds_ppm": 1250,
    "baseline_tds_ppm": 142.0
  }
}
```

### 6. Liveness Heartbeat & Last Will and Testament (`desanomia/gh1/status` - QoS 1, retain=true)

- Online boot heartbeat: `{"online": true, "firmware_version": "1.0.0-prod", "mac": "CC:7B:5C:80:12:34", "ip": "192.168.10.20", "ts": 1728518000}`.
- Last Will and Testament (LWT, broker-dispatched upon connection loss): `{"online": false, "reason": "lwt"}`.

### 7. Idempotency & Offline Spooling Guarantees

- **3.0s ACK Timeout:** Backend marks command `TIMEOUT` (504) if no ACK arrives on `ack` within 3.0s.
- **32-Slot RAM Cache + NVS Journaling (D-045):** ESP32 maintains a 32-entry circular RAM cache of executed `cmd_id`s and writes `last_executed_cmd_id` to NVS to eliminate duplicate relay actuation upon reboot.
- **500-Event PSRAM Ring Buffer:** When network connectivity is lost, ESP32 continues executing the active batch autonomously, buffering up to 500 lifecycle events in 8MB PSRAM and flushing them chronologically to `events` upon reconnection.

## Errors

```json
{"error":{"code":"INTERLOCK_REJECTED","message":"...","detail":{"interlock":"IL-03"}}}
```

Standard codes: `UNAUTHENTICATED` 401, `FORBIDDEN` 403, `NOT_FOUND` 404, `INVALID_STATE` 409, `INTERLOCK_REJECTED` 409, `DEVICE_OFFLINE` 409, `VALIDATION_ERROR` 422, `RATE_LIMITED` 429, `COMMAND_TIMEOUT` 504, `INTERNAL` 500.

## Rules

Every state-changing call writes an immutable row to `audit_logs` with SHA-256 cryptographic chaining. Viewer role receives zero mutation endpoints. Login enforces Argon2id and rate limiting. Responses never leak password hashes or session tokens.
