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
        WSHub["WebSocket Broadcast Hub\n(/api/v1/ws/telemetry)\nEvent-Driven Push + Hydration"]:::backend
        DB[("PostgreSQL 16\nAppend-only Audit Logs")]:::backend
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
    WSHub -.->|Event Push| Kiosk
    WSHub -.->|Event Push| GazeboTV
    WSHub -.->|Event Push| MobilePWA

    REST -->|QoS 1 cmd| Mosq
    Mosq -->|QoS 1 ack / QoS 0 telemetry| REST
    Mosq <-->|Isolated Fieldbus| ESP32
```

### 1.1 Base Conventions
- **Base Path:** `/api/v1`.
- **Resource Naming:** Lowercase, kebab-case, nouns (e.g. `/api/v1/batches`, `/api/v1/tank-pairs`, `/api/v1/recipe-presets`).
- **Data Format:** Strictly JSON (`application/json`) with UTF-8 encoding.
- **Date & Time:** ISO 8601 strings in UTC (`YYYY-MM-DDTHH:MM:SSZ`).
- **Identifiers:** Internal entity IDs are integers (`BIGSERIAL`), while external asynchronous command identifiers are UUIDv4 strings (`cmd_id`). Clients may provide an `Idempotency-Key` header (UUIDv4); if omitted, the backend generates a UUIDv4.

### 1.2 Authentication & Display Tier Sessions (D-026, TR-13, TR-14)
- **Primary HMI Kiosk (15.6" Touchscreen):** Persistent local loopback `Operator` session (`127.0.0.1:8080`) with zero idle timeout. Administrative operations trigger a step-up elevation modal granting a 15-minute temporary Admin elevation (`is_elevated = true`). Elevation is restricted strictly to local loopback (`127.0.0.1:8080`) and records `elevated_by` (admin user ID) in `audit_logs`.
- **Secondary Gazebo Display (Xiaomi TV A 43"):** Auto-authenticated read-only `Viewer` session via Nginx IP allowlist (`192.168.1.50`) with server-side bearer token injection in upstream headers (the browser URL never exposes `?token=`). Mutation endpoints return `HTTP 403 Forbidden`.
- **Remote Mobile PWA:** Sliding 8-hour idle timeout, 7-day maximum lifetime, secured by `HttpOnly`, `SameSite=Lax`, `Secure` cookies over Tailscale VPN / TLS port 443.
- **CSRF Defense:** State-changing requests (`POST`, `PUT`, `DELETE`) require a custom header: `X-Requested-With: XMLHttpRequest` or valid CSRF token.
- **WebSocket Upgrade Protection:** WebSocket handshake strictly validates the `Origin` header against allowed greenhouse host origins to prevent Cross-Site WebSocket Hijacking (CSWSH).

### 1.3 Command-Query Separation (CQS) & Asynchronous Execution Flow
To prevent HTTP gateway timeouts caused by physical FreeRTOS task scheduling or network latency, hardware mutation endpoints enforce **Command-Query Separation**:
1. Client issues a command request (e.g. `POST /api/v1/batches`), optionally supplying an `Idempotency-Key: <uuid>` header.
2. Backend validates schemas, checks RBAC, performs telemetry-based pre-checks (fast-rejecting with HTTP 409 if known invalid, e.g. Drum 2 $> 8.0\text{ L}$ on start), and publishes QoS 1 MQTT to `desanomia/gh1/cmd` with a 30s TTL.
   - **Safety-Critical Publishing Precedence:** For `ESTOP` and `ABORT_BATCH`, the backend publishes to MQTT immediately before recording the `audit_log` row asynchronously to guarantee database latency never delays a physical stop.
   - For routine commands, the `audit_log` row is written synchronously before publishing.
   - Backend immediately returns **`202 Accepted`**:
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
   - **Timeout (3.0s):** If no ACK arrives within 3.0 seconds, backend broadcasts `TIMEOUT` (defined strictly as **Unknown, Check State** — never assumed failed; UI locks mutation retries to prevent duplicate jogs, warns operator, and reconciles state).
6. **Command Status Reconciliation:** If the WebSocket drops during dispatch, the client polls `GET /api/v1/commands/{cmd_id}` to reconcile final execution status without re-dispatching duplicate mutations.

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
| `POST /auth/elevate` | `O` | `200 OK` | Kiosk step-up authentication. Validates Admin password or 6-digit Argon2id Kiosk PIN, grants 15-min temporary elevation. Restricted strictly to loopback listener (`127.0.0.1:8080`), records `elevated_by` in `audit_logs` (`D-050`). |
| `POST /auth/elevate/demote` | `O` | `204 No Content`| Operator manually revokes active Kiosk Admin elevation. |
| **System State, Safety & Health (`/system`, `/health`)** | | | |
| `GET /health` | None | `200 OK` | Public health probe: returns minimal `{ "status": "ok" \| "degraded" }` checking backend, PostgreSQL 16, Mosquitto broker, and ESP32 telemetry age (> 15 s = offline). |
| `GET /health/detail` | `V` | `200 OK` | Detailed health diagnostics: subsystem latencies, broker connection state, and telemetry age. |
| `GET /state` | `V` | `200 OK` | Consolidated system snapshot: FSM state, active batch, active fault, tank volumes, relays. |
| `POST /system/estop` | `O` | `202 Accepted`| Software emergency stop trigger. De-energizes all relays immediately (< 5 ms on ESP32), trips `FAULT_ESTOP`, bypasses 30s TTL, publishes to MQTT before async audit logging. |
| `POST /system/backup` | `A` | `202 Accepted`| Triggers manual local `pg_dump` snapshot and off-device Tailscale rsync (`D-044`). |
| **Batches & Fertigation Operations (`/batches`)** | | | |
| `POST /batches` | `O` | `202 Accepted`| Creates and starts batch immediately (`start-now` only). Consolidates recipe and tank pair. Validates `tank_pair_id == 1` in Phase 1. Publishes `START_BATCH`. |
| `GET /batches` | `V` | `200 OK` | Offset-paginated batch history. Filters: `status`, `recipe_id`, `tank_id`, `from`, `to`. |
| `GET /batches/{id}` | `V` | `200 OK` | Full batch detail: recipe target snapshot, top-up metrics, measured TDS, volume, duration. |
| `GET /batches/{id}/events` | `V` | `200 OK` | Chronological audit timeline of discrete transitions from `batch_events`. |
| `POST /batches/{id}/pause` | `O` | `202 Accepted`| Dispatches `PAUSE_BATCH` to ESP32 during active `DISTRIBUTING` state. |
| `POST /batches/{id}/resume` | `O` | `202 Accepted`| Resumes paused distribution (`RESUME_BATCH`) when FSM is in `PAUSED` state back to `DISTRIBUTING`. |
| `POST /batches/{id}/resume-deficit` | `O` | `202 Accepted`| Authorizes calculated deficit dosing (`RESUME_DEFICIT_BATCH`) during mid-batch outage recovery inspection (`BATCH_PAUSED_INSPECTION`, `D-013`). |
| `POST /batches/{id}/abort` | `O` | `202 Accepted`| Aborts running batch (`ABORT_BATCH`), de-energizes all relays immediately, exempt from 30s TTL, publishes before async audit logging. Body `{ "confirm": true }`. |
| **Faults & Safety Gating (`/faults`)** | | | |
| `GET /faults` | `V` | `200 OK` | Active latched faults and historical clearance log. |
| `POST /faults/reset` | `O` | `202 Accepted`| Dispatches `RESET_FAULT`. **Firmware Gated:** Rejects if Drum 2 $> 8.0\text{ L}$ (for IL-01) or E-Stop open (`D-048`). |
| `POST /faults/resume-fill` | `O` | `202 Accepted`| Dispatches `RESUME_FILL` to clear `FAULT_NO_WATER_SUPPLY` or `FAULT_FILL_TIMEOUT` under `IL-04` without tank drain. |
| **Actuators & Manual Controls (`/actuators`)** | | | |
| `POST /actuators/{name}` | `O` | `202 Accepted`| Manual relay jog/toggle (`name` typed as `fill_valve`, `dosing_pump`, `mixing_pump`, `dist_pump`). **Gated:** Rejects (409) if FSM is NOT `IDLE`. Firmware caps `duration_ms`. |
| **Command Status Reconciliation (`/commands`)** | | | |
| `GET /commands/{cmd_id}` | `V` | `200 OK` | Fetches execution resolution of an asynchronous command (`QUEUED`, `ACCEPTED`, `REJECTED`, `TIMEOUT`) for UI reconciliation on WebSocket drop. |
| **Tanks & Concentrate Stock (`/tanks`)** | | | |
| `GET /tanks` | `V` | `200 OK` | Returns 5 tank pairs (Pair 1 active, Pairs 2–5 standby), volumes, and virtual stock levels. |
| `POST /tanks/{id}/refill-confirm`| `O` | `200 OK` | Refill Confirmation Gate: resets Drum 1 virtual stock to 20.0 L, logs to `audit_logs`. |
| **Sensor Calibration (`/sensors`)** | | | |
| `GET /sensors/calibration` | `V` | `200 OK` | Active TDS probe and radar calibration coefficients from NVS (`calib_tds`). |
| `POST /sensors/calibrate/tds` | `A` | `202 Accepted`| Submits reference buffer EC (`buffer_ec_us_cm`, default 1413.0 µS/cm) and stabilized raw ADC voltage. Backend computes $K_{\text{cell}}$ and commits to ESP32 NVS (`D-036`). |
| **Named Recipe Presets Library (`/recipes`)** | | | |
| `GET /recipes` | `V` | `200 OK` | Returns active and archived recipe presets (Vegetatif: 1100, Generatif: 1250, Panen: 1050). |
| `POST /recipes` | `A` | `201 Created` | Creates named recipe preset with target TDS (500–1800 ppm). Tolerance band is fixed at ±50 ppm (`IL-01`). |
| `PUT /recipes/{id}` | `A` | `200 OK` | Modifies target TDS of an existing preset (`D-037`). |
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
    tank_pair_id: Literal[1] = Field(default=1, description="Tank pair (strictly 1 in Phase 1; pairs 2-5 return 422 until plumbed)")

class CommandAcceptedResponse(BaseModel):
    cmd_id: str = Field(..., description="UUIDv4 tracking identifier (echoed from Idempotency-Key or server-generated)")
    status: Literal["QUEUED"] = "QUEUED"
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# GET /api/v1/commands/{cmd_id}
class CommandStatusResponse(BaseModel):
    cmd_id: str = Field(..., description="UUIDv4 tracking identifier")
    status: Literal["QUEUED", "ACCEPTED", "REJECTED", "TIMEOUT"]
    fsm_state: str | None = Field(default=None, description="ESP32 FSM state reported in ACK")
    reason: str | None = Field(default=None, description="Rejection reason if status == REJECTED")
    timestamp: datetime = Field(..., description="Resolution or polling timestamp")
```

#### 2. Detailed Batch Historical Record
```python
# GET /api/v1/batches/{id}
class BatchDetailResponse(BaseModel):
    id: int
    tank_pair_id: int
    recipe_name: str
    target_tds_ppm: int
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

#### 4. Kiosk Admin Step-Up Elevation Request
```python
# POST /api/v1/auth/elevate
class AdminElevationRequest(BaseModel):
    pin: str | None = Field(default=None, min_length=6, max_length=6, pattern=r"^\d{6}$", description="6-digit Argon2id Kiosk Step-Up PIN (numpad entry on loopback)")
    password: str | None = Field(default=None, min_length=12, description="Admin password fallback")
```

#### 5. Sensor Calibration Commit
```python
# POST /api/v1/sensors/calibrate/tds
class TDSCalibrationRequest(BaseModel):
    buffer_ec_us_cm: float = Field(default=1413.0, ge=1000.0, le=2000.0, description="Reference buffer electrical conductivity in uS/cm (standard 1413 uS/cm)")
    raw_adc_voltage: float = Field(..., ge=0.1, le=3.3, description="Stabilized raw ADC voltage from 30s probe settling")
    raw_water_baseline_ppm: float = Field(..., ge=50.0, le=350.0, description="Greenhouse baseline clean water PPM offset")
    # Note: K_cell is calculated deterministically by the backend from buffer_ec_us_cm and raw_adc_voltage (not client-supplied)
```

---

## 3. WebSocket Real-Time Telemetry Contract (`/ws/telemetry`)

The WebSocket endpoint provides full bi-directional synchronization with **event-driven** telemetry broadcasting (forwarded immediately upon every MQTT telemetry receive — 5.0 s routine, 1.0 s evaluation — and on FSM state transitions) plus instant connection hydration.

- **URL:** `/api/v1/ws/telemetry`
- **Protocol:** WSS (over TLS port 443 / Tailscale) or unencrypted WS (over Kiosk loopback `127.0.0.1:8080`).
- **Authentication:** Valid session cookie (HMI Kiosk and Mobile PWA) or upstream `Authorization: Bearer <token>` injected by Nginx reverse proxy for Gazebo TV (`?token=` in URL is prohibited for access log security).
- **Origin Validation:** Enforces strict handshake check against allowed host origins to prevent CSWSH.

### 3.1 Connection Hydration Snapshot (< 500 ms)
Immediately upon WebSocket connection acceptance, the backend flushes a complete system snapshot before commencing event forwarding:

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
Every command carries a UUIDv4 `cmd_id` (mirrored from client `Idempotency-Key` or server-generated) and strict payload typing:

- **30-Second TTL Enforcement (`D-048`):** All commands carry a UTC Unix epoch timestamp in seconds (`ts`). The ESP32 rejects incoming commands if $(\text{now}_{\text{sntp}} - \text{ts}) > 30\text{ s}$ or if clock synchronization is not yet complete (`ERROR_CLOCK_UNSYNCED`).
- **Safety TTL Exemption:** `ESTOP`, `ABORT_BATCH`, and `RESET_FAULT` commands are strictly **exempt** from the 30s TTL and clock check, ensuring immediate execution.
- **Clean Session Mandate:** ESP32 connects with `clean_session = true` to prevent the broker from queueing stale commands during offline periods.

```json
{
  "cmd_id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
  "type": "START_BATCH",
  "batch_id": 1042,
  "target_tds_ppm": 1250,
  "tank_pair_id": 1,
  "ts": 1791625200
}
```

#### Command Discriminators (`type`):
- `START_BATCH`: Initiates active preparation FSM (`batch_id`, `target_tds_ppm`, `tank_pair_id`, `ts`).
- `PAUSE_BATCH`: Dispatches safe pause to ESP32 during active `DISTRIBUTING` state (`tank_pair_id`, `ts`).
- `RESUME_BATCH`: Resumes paused distribution when FSM is in `PAUSED` state back to `DISTRIBUTING` (`tank_pair_id`, `ts`).
- `RESUME_DEFICIT_BATCH`: Acknowledges Pause Mode (`BATCH_PAUSED_INSPECTION`) to execute calculated deficit dosing (`D-013`, `batch_id`, `tank_pair_id`, `ts`).
- `RESUME_FILL`: Re-opens clean water fill valve following `FAULT_NO_WATER_SUPPLY` or `FAULT_FILL_TIMEOUT` under `IL-04` (`tank_pair_id`, `ts`).
- `ABORT_BATCH`: Aborts active batch, de-energizes all relays immediately, exempt from 30s TTL (`tank_pair_id`, `ts`).
- `RESET_FAULT`: Clears latched fault (validated against Drum 2 $\le 8.0\text{ L}$ for chemical faults, or physical switch release, `D-048`). Exempt from 30s TTL (`tank_pair_id`, `ts`).
- `ESTOP`: Software Emergency Stop trigger de-energizing all relays in $< 5\text{ ms}$. Exempt from 30s TTL (`ts`).
- `MANUAL_ACTUATOR`: Executes discrete manual bump (`{"actuator": "dosing_pump", "duration_ms": 1070}` for +10 mL, or `{"actuator": "mixing_pump", "duration_ms": 15000}`).
- `CALIBRATE_SENSOR`: Commits calibrated slope ($K_{\text{cell}}$) and offset to ESP32 NVS (`{"sensor": "tds", "slope": 1.1245, "offset": 0.0421, "baseline_offset": 142.0, "ts": 1791625200}`).

#### Firmware Numeric Bounds Re-Validation (`Core 1 Defense`):
The ESP32 autonomously validates every numeric field in incoming commands before execution:
| Parameter | Field Name | Allowable Bounds | Rejection Reason Code |
| :--- | :--- | :--- | :--- |
| Target TDS | `target_tds_ppm` | 500–1800 ppm | `PARAM_OUT_OF_BOUNDS` |
| Dosing Pump Duration | `duration_ms` | 100–15,000 ms (~140 mL max) | `PARAM_OUT_OF_BOUNDS` |
| Mixing Pump Duration | `duration_ms` | 1,000–300,000 ms (5 min max) | `PARAM_OUT_OF_BOUNDS` |
| Dist Pump Duration | `duration_ms` | 1,000–300,000 ms (5 min max) | `PARAM_OUT_OF_BOUNDS` |
| Fill Valve Duration | `duration_ms` | 1,000–300,000 ms (5 min max) | `PARAM_OUT_OF_BOUNDS` |
| Calibrated Probe Slope | `slope` ($K_{\text{cell}}$) | 0.50–2.00 | `PARAM_OUT_OF_BOUNDS` |

### 4.2 Command ACK Payload Schema (`desanomia/gh1/ack` - QoS 1)
```json
{
  "cmd_id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
  "status": "ACCEPTED",
  "fsm_state": "FILLING_WATER",
  "reason": null,
  "ts": 1791625201
}
```

*Rejected ACK Example:*
```json
{
  "cmd_id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
  "status": "REJECTED",
  "fsm_state": "IDLE",
  "reason": "INTERLOCK_IL03_DRUM2_NOT_EMPTY",
  "ts": 1791625201
}
```

*Already Executed ACK Example (Idempotency Discard, D-045):*
```json
{
  "cmd_id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
  "status": "ALREADY_EXECUTED",
  "fsm_state": "FILLING_WATER",
  "reason": null,
  "ts": 1791625202
}
```

### 4.3 Consolidated Telemetry Stream (`desanomia/gh1/telemetry` - QoS 0)
Published every 5.0 seconds (accelerated to 1.0 second during `MEASURING_TDS`, `GATE_EVALUATE`, and calibration):

```json
{
  "ts": 1791625205,
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

> **Phase 1 Baseline & Fixture Authority:**
> - `water_temp_c` reports constant 27.0 in Phase 1 as the empirical greenhouse baseline prior to in-line submersible probe integration (`07_DATA_SOURCES.md`).
> - This contract defines the authoritative wire shape. Both backend pytest (Pydantic v2 schemas) and ESP32 PlatformIO native tests parse and validate against single canonical JSON schema fixtures under `schemas/*.json` (e.g. `schemas/telemetry.json`, `schemas/command.json`, `schemas/ack.json`).

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
    "reason": "lwt"
  }
  ```
  > **LWT Timestamp Authority:** Because Mosquitto stores LWT payloads at initial MQTT `CONNECT` time, a static payload timestamp represents connection time rather than disconnection time. The backend stamps the authoritative disconnection timestamp upon receiving the retained LWT payload.

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
      "recipe_id": 2
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
| **`409`** | `INTERLOCK_REJECTED` | Fast backend pre-check rejected command against cached telemetry (e.g. Drum 2 $> 8.0\text{ L}$ on start); ESP32 ACK serves as final hardware authority (`D-048`). |
| **`409`** | `INVALID_STATE` | Operation invalid in active FSM state (e.g. manual relay jog during active batch). |
| **`409`** | `DEVICE_OFFLINE` | ESP32-S3 microcontroller is offline (telemetry age $> 15\text{ s}$); MQTT command cannot be dispatched. |
| **`422`** | `VALIDATION_ERROR` | Pydantic schema validation failure (e.g. `target_tds` out of allowable bounds, or `tank_pair_id != 1` in Phase 1). |
| **`429`** | `RATE_LIMITED` | Rate limit exceeded (e.g. $> 5\text{ attempts/min}$ on login endpoint). |
| **`500`** | `INTERNAL` | Unhandled backend exception. Traces logged internally, masked from response. |

---

## 6. Audit Logging & State Mutation Invariants

1. **Zero Secret Leakage:** HTTP responses, logs, and WebSockets never leak Argon2id password hashes, session tokens, or raw database connection strings.
2. **Immutable Audit Trail:** Every state-changing mutation endpoint (`POST`, `PUT`, `DELETE`) immutably appends a record to the PostgreSQL `audit_logs` table:
   - Captures `user_id`, `action`, `entity_type`, `entity_id`, `payload_json`, and `client_ip`.
   - Protected by PostgreSQL PL/pgSQL append-only triggers (`trg_audit_logs_immutability`) against UPDATE/DELETE and verified via daily automated offsite backups (`TR-16`, `D-039`, `D-044`, `08_SECURITY.md`).
3. **Pessimistic UI Gating:** Disabled buttons on the UI are always mirrored by backend role checks (`Depends(require_role)`). UI hiding is purely cosmetic.
