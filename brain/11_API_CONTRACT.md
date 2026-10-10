# 11 API Contract

> **System:** DESANOMIA Greenhouse Automated Fertigation System  
> **Platform:** FastAPI Edge Backend (Python 3.12 / Pydantic v2) + React 18/19 SPA Dashboard + ESP32-S3 FreeRTOS Microcontroller  
> **Authority:** Aligned with [00_MASTER_RULES.md](file:///home/maria_zahra/Documents/projects/greenhouse/desanomia/brain/00_MASTER_RULES.md), [01_PRD.md](file:///home/maria_zahra/Documents/projects/greenhouse/desanomia/brain/01_PRD.md), [02_APPFLOW.md](file:///home/maria_zahra/Documents/projects/greenhouse/desanomia/brain/02_APPFLOW.md), [04_TRD.md](file:///home/maria_zahra/Documents/projects/greenhouse/desanomia/brain/04_TRD.md), [05_ARCHITECTURE.md](file:///home/maria_zahra/Documents/projects/greenhouse/desanomia/brain/05_ARCHITECTURE.md), [06_DATA_MODEL.md](file:///home/maria_zahra/Documents/projects/greenhouse/desanomia/brain/06_DATA_MODEL.md), [07_DATA_SOURCES.md](file:///home/maria_zahra/Documents/projects/greenhouse/desanomia/brain/07_DATA_SOURCES.md), [08_SECURITY.md](file:///home/maria_zahra/Documents/projects/greenhouse/desanomia/brain/08_SECURITY.md), [09_ERROR_HANDLING.md](file:///home/maria_zahra/Documents/projects/greenhouse/desanomia/brain/09_ERROR_HANDLING.md), [10_FIRMWARE_SPEC.md](file:///home/maria_zahra/Documents/projects/greenhouse/desanomia/brain/10_FIRMWARE_SPEC.md), [18_DECISIONS.md](file:///home/maria_zahra/Documents/projects/greenhouse/desanomia/brain/18_DECISIONS.md), and [SPEC.md](file:///home/maria_zahra/Documents/projects/greenhouse/desanomia/docs/SPEC.md). [SPEC]

---

## 1. API Architecture & Design Principles

Desanomia operates as an edge-first industrial cyber-physical control platform. The API contract coordinates two distinct boundaries:
1. **Frontend ↔ Backend Integration:** RESTful HTTP endpoints and real-time WebSocket push streams served by the FastAPI edge backend on the Beelink EQ12 Mini PC (`192.168.1.10:443`, `127.0.0.1:8080`, and Tailscale `100.x.y.z:443`).
2. **Backend ↔ Firmware Integration:** Low-latency fieldbus communication executed over the isolated OT LAN (`ETH0:1883`, `192.168.10.0/24`) between FastAPI (`backend_service`) and ESP32-S3 (`esp32_gateway`) via Eclipse Mosquitto.

```mermaid
flowchart LR
    classDef client fill:#1e1b4b,stroke:#6366f1,stroke-width:2px,color:#fff;
    classDef backend fill:#1e293b,stroke:#3b82f6,stroke-width:2px,color:#fff;
    classDef broker fill:#042f2e,stroke:#0d9488,stroke-width:2px,color:#fff;
    classDef fw fill:#0f172a,stroke:#eab308,stroke-width:2px,color:#fff;

    subgraph ClientTiers ["Client Display Tiers (IT / WAN / Loopback)"]
        Kiosk["Primary HMI Kiosk (15.6\")\n(Loopback 127.0.0.1:8080)\nOperator + 15m Step-Up"]:::client
        GazeboTV["Secondary Gazebo TV (43\")\n(192.168.1.50)\nRead-Only Viewer"]:::client
        MobilePWA["Remote Mobile PWA\n(Tailscale 100.x.y.z)\nSliding 8h Session"]:::client
    end

    subgraph EdgeBackend ["FastAPI Backend (Beelink EQ12 / Python 3.12)"]
        REST["REST API Engine (/api/v1)\nPydantic v2 Schemas\nRBAC & Audit Logging"]:::backend
        WSHub["WebSocket Broadcast Hub\n(/api/v1/ws/telemetry)\n1.0 Hz Consolidated Push"]:::backend
        DB[("PostgreSQL 16\nMonthly Partitioning\nSHA-256 Audit Logs")]:::backend
    end

    subgraph OTFieldbus ["OT LAN (192.168.10.0/24 / W5500 SPI)"]
        Mosq["Eclipse Mosquitto Broker\n(192.168.10.1:1883)\nTopic ACLs & SHA-512 Auth"]:::broker
        ESP32["ESP32-S3 Microcontroller\n(192.168.10.20)\nFreeRTOS Core 1 FSM"]:::fw
    end

    Kiosk -->|HTTP / WS| REST
    GazeboTV -->|HTTP GET / WS| REST
    MobilePWA -->|HTTPS / WSS| REST
    REST <--> DB
    REST <--> WSHub
    WSHub -.->|1 Hz Push| Kiosk
    WSHub -.->|1 Hz Push| GazeboTV
    WSHub -.->|1 Hz Push| MobilePWA

    REST -->|QoS 1 cmd| Mosq
    Mosq -->|QoS 1 ack / QoS 0 telemetry| REST
    Mosq <-->|Isolated Fieldbus| ESP32
```

### 1.1 Base Conventions
- **Base Path:** `/api/v1`.
- **Resource Naming:** Lowercase, kebab-case, nouns (e.g. `/api/v1/batches`, `/api/v1/tank-pairs`, `/api/v1/recipe-presets`).
- **Data Format:** Strictly JSON (`application/json`) with UTF-8 encoding.
- **Date & Time:** ISO 8601 strings in UTC (`YYYY-MM-DDTHH:MM:SSZ`).
- **Identifiers:** Internal entity IDs are integers (`BIGSERIAL`), while external asynchronous command identifiers are UUIDv4 strings (`cmd_id`).

### 1.2 Authentication & Display Tier Sessions (D-026, TR-13, TR-14)
- **Primary HMI Kiosk (15.6" Touchscreen):** Persistent local loopback `Operator` session (`127.0.0.1:8080`) with zero idle timeout. Administrative operations trigger a step-up elevation modal granting a 15-minute temporary Admin elevation (`is_elevated = true`).
- **Secondary Gazebo Display (Xiaomi TV A 43"):** Auto-authenticated read-only `Viewer` session via Nginx IP allowlist (`192.168.1.50`) and bearer token. Mutation endpoints return `HTTP 403 Forbidden`.
- **Remote Mobile PWA:** Sliding 8-hour idle timeout, 7-day maximum lifetime, secured by `HttpOnly`, `SameSite=Lax`, `Secure` cookies over Tailscale VPN / TLS port 443.
- **CSRF Defense:** State-changing requests (`POST`, `PUT`, `DELETE`) require a custom header: `X-Requested-With: XMLHttpRequest` or valid CSRF token.

### 1.3 Command-Query Separation (CQS) & Asynchronous Execution Flow
To prevent HTTP gateway timeouts caused by physical FreeRTOS task scheduling or network latency, hardware mutation endpoints enforce **Command-Query Separation**:
1. Client issues a command request (e.g. `POST /api/v1/batches`).
2. Backend validates schemas, checks RBAC, records an `audit_log` row, publishes QoS 1 MQTT to `desanomia/gh1/cmd`, and immediately returns **`202 Accepted`**:
   ```json
   {
     "cmd_id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
     "status": "QUEUED",
     "timestamp": "2026-10-10T16:55:00Z"
   }
   ```
3. The frontend enters a pessimistic loading state, disabling mutating buttons.
4. The ESP32 evaluates safety interlocks on Core 1 and replies on `desanomia/gh1/ack`.
5. Backend broadcasts the correlated execution status over WebSocket (`type: "command_result"`):
   - **Accepted:** Result is `ACCEPTED`; UI advances stepper.
   - **Interlock Rejection:** Result is `REJECTED` with reason (e.g. `INTERLOCK_IL03_DRUM2_NOT_EMPTY`); UI surfaces toast.
   - **Timeout (3.0s):** If no ACK arrives within 3.0 seconds, backend broadcasts `TIMEOUT`; UI unlocks buttons and warns operator.

---

## 2. REST API Specification

### 2.1 Role Hierarchy & Permissions
- **Viewer (`V`):** Read-only telemetry, batch history, logs, and schedules.
- **Operator (`O`):** Viewer + batch control (start, pause, resume, abort), fault reset, manual actuators, schedule editing, and concentrate refill confirmation.
- **Admin (`A`):** Operator + user administration, recipe library defaults, sensor calibration wizard, and system backup triggers. (Also available to Kiosk Operator during 15-min elevation).

---

### 2.2 Complete REST Endpoint Reference

| Method & Route | Role | Success Code | Description & Semantics |
| :--- | :---: | :---: | :--- |
| **Authentication & Session (`/auth`)** | | | |
| `POST /auth/login` | None | `200 OK` | Authenticates username & password (Argon2id), issues session cookie. Rate-limited (5/min). |
| `POST /auth/logout` | `V` | `204 No Content`| Revokes session in PostgreSQL `user_sessions`, clears cookie. |
| `GET /auth/me` | `V` | `200 OK` | Returns active user profile, assigned role, `is_elevated`, and elevation timer remaining. |
| `POST /auth/elevate` | `O` | `200 OK` | Kiosk step-up authentication. Validates Admin password, grants 15-min temporary elevation. |
| `POST /auth/elevate/demote` | `O` | `204 No Content`| Operator manually revokes active Kiosk Admin elevation. |
| **System State & Health (`/system`, `/health`)** | | | |
| `GET /health` | None | `200 OK` | Health probe: checks FastAPI backend, PostgreSQL 16, Mosquitto broker, and ESP32 ping. |
| `GET /state` | `V` | `200 OK` | Consolidated system snapshot: FSM state, active batch, active fault, tank volumes, relays. |
| `POST /system/backup` | `A` | `202 Accepted`| Triggers manual local `pg_dump` snapshot and off-device Tailscale rsync (`D-044`). |
| **Batches & Fertigation Operations (`/batches`)** | | | |
| `POST /batches` | `O` | `202 Accepted`| Creates and starts batch. Consolidates recipe, tank pair, and timing. Publishes `START_BATCH`. |
| `GET /batches` | `V` | `200 OK` | Offset-paginated batch history. Filters: `status`, `recipe_id`, `tank_id`, `from`, `to`. |
| `GET /batches/{id}` | `V` | `200 OK` | Full batch detail: recipe target snapshot, top-up metrics, measured TDS, volume, duration. |
| `GET /batches/{id}/events` | `V` | `200 OK` | Chronological audit timeline of discrete transitions from `batch_events`. |
| `POST /batches/{id}/pause` | `O` | `202 Accepted`| Dispatches safe pause to ESP32 during active preparation. |
| `POST /batches/{id}/resume` | `O` | `202 Accepted`| Resumes paused batch; authorizes deficit dosing after power outage recovery (`D-013`). |
| `POST /batches/{id}/abort` | `O` | `202 Accepted`| Aborts running batch, de-energizes all relays immediately. Body `{ "confirm": true }`. |
| **Faults & Safety Gating (`/faults`)** | | | |
| `GET /faults` | `V` | `200 OK` | Active latched faults and historical clearance log. |
| `POST /faults/reset` | `O` | `202 Accepted`| Dispatches `RESET_FAULT`. **Firmware Gated:** Rejects if Drum 2 $> 5.0\text{ L}$ or E-Stop open. |
| **Actuators & Manual Controls (`/actuators`)** | | | |
| `POST /actuators/{name}` | `O` | `202 Accepted`| Manual relay jog/toggle (e.g. +10 mL dosing). **Gated:** Rejects (409) if FSM is NOT `IDLE`. |
| `POST /actuators/estop` | `O` | `202 Accepted`| Software emergency stop trigger. De-energizes all relays immediately (`< 100\text{ ms}`). |
| **Tanks & Concentrate Stock (`/tanks`)** | | | |
| `GET /tanks` | `V` | `200 OK` | Returns 5 tank pairs (Pair 1 active, Pairs 2–5 standby), volumes, and virtual stock levels. |
| `POST /tanks/{id}/refill-confirm`| `O` | `200 OK` | Refill Confirmation Gate: resets Drum 1 virtual stock to 20.0 L, logs to `audit_logs`. |
| **Sensor Calibration (`/sensors`)** | | | |
| `GET /sensors/calibration` | `V` | `200 OK` | Active TDS probe and radar calibration coefficients from NVS (`calib_tds`). |
| `POST /sensors/calibrate/tds` | `A` | `202 Accepted`| Commits calibrated slope ($K_{\text{cell}}$), offset, and baseline offset to ESP32 NVS (`D-036`). |
| **Named Recipe Presets Library (`/recipes`)** | | | |
| `GET /recipes` | `V` | `200 OK` | Returns active and archived recipe presets (Vegetatif: 1100, Generatif: 1250, Panen: 1050). |
| `POST /recipes` | `A` | `201 Created` | Creates named recipe preset with target TDS (500–1800 ppm) and tolerance band. |
| `PUT /recipes/{id}` | `A` | `200 OK` | Modifies target TDS or tolerance band of an existing preset (`D-037`). |
| `DELETE /recipes/{id}` | `A` | `204 No Content`| Soft-archives recipe preset (`is_archived = true`). |
| `POST /recipes/{id}/set-default`| `A` | `200 OK` | Designates active default recipe preset for ad-hoc and scheduled runs. |
| **Scheduling Engine (`/schedules`)** | | | |
| `GET /schedules` | `V` | `200 OK` | Returns automated schedule timetable, ISO recurrence rules, and next planned runs. |
| `POST /schedules` | `O` | `201 Created` | Registers automated schedule. Validates Zero-Conflict Invariant across 5 pairs (`D-040`). |
| `PUT /schedules/{id}` | `O` | `200 OK` | Updates schedule timing or target recipe. |
| `DELETE /schedules/{id}` | `O` | `204 No Content`| Cancels and deletes schedule slot. |
| **In-App Notification Hub & Alerts (`/notifications`)** | | | |
| `GET /notifications` | `V` | `200 OK` | Fetches categorized notifications (Critical, Warning, Success, Info) and unread count. |
| `POST /notifications/{id}/read`| `V` | `200 OK` | Marks notification as read. |
| `POST /notifications/clear-all` | `V` | `204 No Content`| Clears notification drawer history. |
| `GET /alerts/queue` | `A` | `200 OK` | Status of offline Telegram store-and-forward queue (`alert_queue`, `TR-22`). |
| **Historical Telemetry Analytics (`/telemetry`)** | | | |
| `GET /telemetry` | `V` | `200 OK` | Historical time-series query: `from`, `to`, `resolution` (raw vs 1m rollups), max 10k points. |
| **User Administration (`/users`)** | | | |
| `GET /users` | `A` | `200 OK` | Lists user accounts (Admin only). Excludes password hashes. |
| `POST /users` | `A` | `201 Created` | Provisions user account (`D-028`). Enforces initial password change. |
| `PUT /users/{id}` | `A` | `200 OK` | Updates role, deactivates account, or resets password. |
| `DELETE /users/{id}` | `A` | `204 No Content`| Deactivates user (prohibits deleting last active admin). |

---

### 2.3 Selected Request & Response Schemas (Pydantic v2)

#### 1. Batch Creation & Hardware Dispatch
```python
# POST /api/v1/batches
class BatchCreateRequest(BaseModel):
    recipe_id: int = Field(..., description="ID of Named Recipe Preset")
    tank_pair_id: int = Field(default=1, ge=1, le=5, description="Tank pair (1=plumbed)")
    timing: Literal["now", "later"] = Field(default="now", description="Execution timing")
    schedule_at: datetime | None = Field(default=None, description="Required if timing='later'")
    force_same_day_override: bool = Field(default=False, description="Override same-day lockout (D-039)")

class CommandAcceptedResponse(BaseModel):
    cmd_id: str = Field(..., description="UUIDv4 tracking identifier")
    status: Literal["QUEUED"] = "QUEUED"
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
```

#### 2. Detailed Batch Historical Record
```python
# GET /api/v1/batches/{id}
class BatchDetailResponse(BaseModel):
    id: int
    tank_pair_id: int
    recipe_name: str
    target_tds_ppm: int
    tolerance_band_ppm: int
    status: Literal["completed", "failed", "aborted", "paused", "in_progress"]
    initial_measured_tds_ppm: float | None = None
    final_measured_tds_ppm: float | None = None
    gate_result: Literal["PASSED", "FAILED", "PENDING"]
    dose_ml: float
    topup_ml: float
    topup_performed: bool
    started_at: datetime
    completed_at: datetime | None = None
    duration_seconds: int | None = None
    distributed_volume_l: float | None = None
```

#### 3. Gated Fault Reset Request
```python
# POST /api/v1/faults/reset
class FaultResetRequest(BaseModel):
    confirm: bool = Field(..., description="Operator acknowledgment of physical clearance")
```

#### 4. Sensor Calibration Commit
```python
# POST /api/v1/sensors/calibrate/tds
class TDSCalibrationRequest(BaseModel):
    buffer_solution_ppm: float = Field(..., ge=1000.0, le=1500.0, description="Reference buffer (1413 uS/cm)")
    raw_adc_voltage: float = Field(..., ge=0.1, le=3.3, description="Stabilized ADC voltage")
    raw_water_baseline_ppm: float = Field(..., ge=50.0, le=350.0, description="Greenhouse baseline water PPM")
    calculated_k_cell: float = Field(..., ge=0.5, le=2.0, description="Calculated probe cell constant")
```

---

## 3. WebSocket Real-Time Telemetry Contract (`/ws/telemetry`)

The WebSocket endpoint provides full bi-directional synchronization with **1.0 Hz** telemetry broadcast and immediate connection hydration.

- **URL:** `/api/v1/ws/telemetry`
- **Protocol:** WSS (over TLS port 443 / Tailscale) or unencrypted WS (over Kiosk loopback `127.0.0.1:8080`).
- **Authentication:** Valid session cookie or machine bearer token in query parameter (`?token=...`).

### 3.1 Connection Hydration Snapshot (< 500 ms)
Immediately upon WebSocket connection acceptance, the backend flushes a complete system snapshot before commencing the 1 Hz broadcast loop:

```json
{
  "type": "hydration",
  "data": {
    "fsm_state": "MIXING",
    "active_batch": {
      "id": 1042,
      "recipe_name": "Fase Generatif",
      "target_tds_ppm": 1250,
      "started_at": "2026-10-10T16:40:00Z"
    },
    "tank_pair_id": 1,
    "sensors": {
      "drum2_volume_l": 140.0,
      "drum2_level_pct": 100.0,
      "tds_ppm": 1248.5,
      "water_temp_c": 27.0,
      "hw_estop_pressed": false
    },
    "concentrate_stock": {
      "drum1_volume_ml": 18250.0,
      "low_stock_warning": false
    },
    "relays": {
      "fill_valve": false,
      "dosing_pump": false,
      "mixing_pump": true,
      "dist_pump": false
    },
    "active_fault": null,
    "device_status": {
      "online": true,
      "liveness": "online",
      "last_seen": "2026-10-10T16:55:00Z"
    }
  }
}
```

### 3.2 Pushed Message Envelopes

#### 1. Periodic Telemetry Stream (1.0 Hz)
```json
{
  "type": "telemetry",
  "data": {
    "ts": "2026-10-10T16:55:01Z",
    "tank_pair_id": 1,
    "tds_ppm": 1248.5,
    "drum2_volume_l": 140.0,
    "drum2_level_pct": 100.0,
    "water_temp_c": 27.0,
    "hw_estop_pressed": false,
    "relays": {
      "fill_valve": false,
      "dosing_pump": false,
      "mixing_pump": true,
      "dist_pump": false
    }
  }
}
```

#### 2. FSM State Transition Event
```json
{
  "type": "state",
  "data": {
    "ts": "2026-10-10T16:55:00Z",
    "batch_id": 1042,
    "tank_pair_id": 1,
    "fsm_state": "GATE_EVALUATE",
    "active_fault": null
  }
}
```

#### 3. Asynchronous Command Execution Resolution
```json
{
  "type": "command_result",
  "data": {
    "cmd_id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
    "status": "ACCEPTED",
    "reason": null,
    "timestamp": "2026-10-10T16:55:01Z"
  }
}
```

#### 4. Real-Time In-App Notification Toast
```json
{
  "type": "notification",
  "data": {
    "id": 841,
    "severity": "WARNING",
    "title": "Stok Pupuk Menipis",
    "message": "Sisa konsentrat Drum 1 kurang dari 3.0 L (Terhitung: 2.8 L).",
    "action_payload": { "type": "OPEN_DRAWER", "target": "refill" },
    "created_at": "2026-10-10T16:55:00Z"
  }
}
```

---

## 4. MQTT Fieldbus Wire-Level Contract (`desanomia/gh1/#`)

Dedicated to the isolated OT LAN (`ETH0:1883`, Mosquitto broker on Beelink EQ12). ESP32-S3 and FastAPI backend communicate exclusively via QoS 0/1 topics under the `desanomia/gh1/` namespace:

```text
desanomia/gh1/
  ├── cmd             [QoS 1]  (Backend -> ESP32: discrete state-changing commands)
  ├── ack             [QoS 1]  (ESP32 -> Backend: correlated UUID execution receipts)
  ├── telemetry       [QoS 0]  (ESP32 -> Backend: periodic multi-sensor telemetry stream)
  ├── events          [QoS 1]  (ESP32 -> Backend: discrete FSM state transitions & safety trips)
  └── status          [QoS 1]  (ESP32 -> Backend: LWT liveness heartbeat, retain=true)
```

> **Identifier Mapping Note:** In all MQTT command, telemetry, and event payloads, the integer field `tank_pair_id` (1–5, e.g. `1`) maps directly to foreign key column `tank_id` in PostgreSQL tables `batches`, `telemetry`, and `schedules` (referencing `tank_pairs(id)` in [06_DATA_MODEL.md](file:///home/maria_zahra/Documents/projects/greenhouse/desanomia/brain/06_DATA_MODEL.md)).

### 4.1 Command Payload Schema (`desanomia/gh1/cmd` - QoS 1)
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
  "timestamp": 1791625200
}
```

#### Command Discriminators (`type`):
- `START_BATCH`: Initiates active preparation FSM (`batch_id`, `recipe_id`, `target_tds_ppm`, `tank_pair_id`).
- `RESUME_FILL`: Re-opens clean water fill valve following `FAULT_NO_WATER_SUPPLY` or `FAULT_FILL_TIMEOUT`.
- `RESUME_DEFICIT_BATCH`: Acknowledges Pause Mode (`BATCH_PAUSED_INSPECTION`) to execute calculated deficit dosing (`D-013`).
- `RESET_FAULT`: Clears latched fault (validated against Drum 2 $\le 5.0\text{ L}$ and `hw_estop_pressed == false`).
- `ESTOP`: Software Emergency Stop trigger de-energizing all relays in $< 5\text{ ms}$.
- `MANUAL_ACTUATOR`: Executes discrete manual bump (`{"actuator": "dosing_pump", "duration_ms": 1070}` for +10 mL, or `{"actuator": "mixing_pump", "duration_ms": 15000}`).
- `CALIBRATE_SENSOR`: Commits calibrated slope and offset to ESP32 NVS (`{"sensor": "tds", "slope": 1.1245, "offset": 0.0421, "baseline_offset": 142.0}`).

### 4.2 Command ACK Payload Schema (`desanomia/gh1/ack` - QoS 1)
```json
{
  "cmd_id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
  "status": "ACCEPTED",
  "fsm_state": "FILLING_WATER",
  "reason": null,
  "timestamp": 1791625201
}
```

*Rejected ACK Example:*
```json
{
  "cmd_id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
  "status": "REJECTED",
  "fsm_state": "IDLE",
  "reason": "INTERLOCK_IL03_DRUM2_NOT_EMPTY",
  "timestamp": 1791625201
}
```

*Already Executed ACK Example (Idempotency Discard, D-045):*
```json
{
  "cmd_id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
  "status": "ALREADY_EXECUTED",
  "fsm_state": "FILLING_WATER",
  "reason": null,
  "timestamp": 1791625202
}
```

### 4.3 Consolidated Telemetry Stream (`desanomia/gh1/telemetry` - QoS 0)
Published every 5.0 seconds (accelerated to 1.0 second during `MEASURING_TDS`, `GATE_EVALUATE`, and calibration):

```json
{
  "timestamp": 1791625205,
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

### 4.4 Batch Lifecycle Event Journal (`desanomia/gh1/events` - QoS 1)
Emitted upon every discrete FSM transition, gate result, top-up injection, or fault trip:

```json
{
  "event_id": 48102,
  "batch_id": 1042,
  "tank_pair_id": 1,
  "ts": 1791625260,
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

### 4.5 Liveness Heartbeat & Last Will and Testament (`desanomia/gh1/status` - QoS 1, retain=true)
- **Online Boot Heartbeat:**
  ```json
  {
    "online": true,
    "firmware_version": "1.0.0-prod",
    "mac": "CC:7B:5C:80:12:34",
    "ip": "192.168.10.20",
    "ts": 1791625000
  }
  ```
- **Last Will and Testament (LWT, broker-dispatched upon connection loss):**
  ```json
  {
    "online": false,
    "reason": "lwt",
    "ts": 1791625020
  }
  ```

---

## 5. Standardized Error Response Contract

All REST HTTP 4xx and 5xx responses strictly adhere to the unified JSON error envelope:

```json
{
  "error": {
    "code": "INTERLOCK_REJECTED",
    "message": "Distribution pump locked OFF: mean TDS (1180 ppm) outside allowable gate band 1200-1300 ppm",
    "detail": {
      "interlock": "TDS_GATE",
      "measured_tds": 1180.4,
      "gate_band": [1200, 1300],
      "recipe_id": "REC-GEN-01"
    }
  }
}
```

### Error Code Reference Table

| HTTP Status | Canonical Error Code | Operational Meaning & Typical Cause |
| :---: | :--- | :--- |
| **`400`** | `BAD_REQUEST` | Malformed JSON payload or invalid date/parameter format. |
| **`401`** | `UNAUTHENTICATED` | Session cookie expired, missing, or invalid. |
| **`403`** | `FORBIDDEN` | Insufficient role (e.g. Viewer attempting batch initiation). |
| **`404`** | `NOT_FOUND` | Referenced entity ID (`batch_id`, `recipe_id`, `schedule_id`) does not exist. |
| **`409`** | `INTERLOCK_REJECTED` | Hardware safety interlock rejected command (e.g. Drum 2 $> 5.0\text{ L}$ on start). |
| **`409`** | `INVALID_STATE` | Operation invalid in active FSM state (e.g. manual relay jog during active batch). |
| **`409`** | `DEVICE_OFFLINE` | ESP32-S3 microcontroller is offline; MQTT command cannot be dispatched. |
| **`422`** | `VALIDATION_ERROR` | Pydantic schema validation failure (e.g. `target_tds` out of allowable bounds). |
| **`429`** | `RATE_LIMITED` | Rate limit exceeded (e.g. $> 5\text{ attempts/min}$ on login endpoint). |
| **`500`** | `INTERNAL` | Unhandled backend exception. Traces logged internally, masked from response. |
| **`504`** | `COMMAND_TIMEOUT` | ESP32 did not acknowledge MQTT command within $3.0\text{ seconds}$. |

---

## 6. Audit Logging & State Mutation Invariants

1. **Zero Secret Leakage:** HTTP responses, logs, and WebSockets never leak Argon2id password hashes, session tokens, or raw database connection strings.
2. **Immutable Audit Trail:** Every state-changing mutation endpoint (`POST`, `PUT`, `DELETE`) immutably appends a record to the PostgreSQL `audit_logs` table:
   - Captures `user_id`, `action`, `entity_type`, `entity_id`, `payload_json`, and `client_ip`.
   - Computes SHA-256 cryptographic hash chaining (`prev_hash` $\to$ `row_hash`), protected by database append-only triggers (`TR-16`, `D-039`).
3. **Pessimistic UI Gating:** Disabled buttons on the UI are always mirrored by backend role checks (`Depends(require_role)`). UI hiding is purely cosmetic.
