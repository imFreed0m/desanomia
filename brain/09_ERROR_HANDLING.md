# 09 Error Handling

> **System:** DESANOMIA Greenhouse Automated Fertigation System  
> **Platform:** Beelink EQ12 Mini PC (Intel N100) + ESP32-S3 N16R8 Edge Microcontroller  
> **Authority:** Aligned with [00_MASTER_RULES.md](file:///home/maria_zahra/Documents/projects/greenhouse/desanomia/brain/00_MASTER_RULES.md), [01_PRD.md](file:///home/maria_zahra/Documents/projects/greenhouse/desanomia/brain/01_PRD.md), [02_APPFLOW.md](file:///home/maria_zahra/Documents/projects/greenhouse/desanomia/brain/02_APPFLOW.md), [04_TRD.md](file:///home/maria_zahra/Documents/projects/greenhouse/desanomia/brain/04_TRD.md), [05_ARCHITECTURE.md](file:///home/maria_zahra/Documents/projects/greenhouse/desanomia/brain/05_ARCHITECTURE.md), [06_DATA_MODEL.md](file:///home/maria_zahra/Documents/projects/greenhouse/desanomia/brain/06_DATA_MODEL.md), [07_DATA_SOURCES.md](file:///home/maria_zahra/Documents/projects/greenhouse/desanomia/brain/07_DATA_SOURCES.md), [08_SECURITY.md](file:///home/maria_zahra/Documents/projects/greenhouse/desanomia/brain/08_SECURITY.md), [18_DECISIONS.md](file:///home/maria_zahra/Documents/projects/greenhouse/desanomia/brain/18_DECISIONS.md), and [SPEC.md](file:///home/maria_zahra/Documents/projects/greenhouse/desanomia/docs/SPEC.md). [SPEC]

---

## 1. Error Philosophy & Primacy of Hardware Safety

Desanomia operates in a physical greenhouse environment where errors have tangible agronomic and equipment impacts. The error handling architecture is built on three core tenets:

1. **The Process Fails Safe in Firmware First:**  
   Safety interlocks operate autonomously on bare-metal microcontroller firmware (ESP32-S3 Core 1). All actuator relays are optoisolated, **Active LOW**, wired to Normally Open (NO) power contacts. A microcontroller crash, power interruption, communication failure, or safety interlock trip immediately drops relay coils to the un-energized open state, arresting fluid motion with zero reliance on edge server software, Python interpreters, or network routers.
2. **The Backend Reports Honestly Without Guessing:**  
   The FastAPI edge backend never masks physical errors, synthesizes missing sensor values, or assumes physical state. Inbound errors from MQTT telemetry or command timeouts are surfaced verbatim through typed error envelopes with rich contextual metadata.
3. **The UI Never Presents Phantom Certainty:**  
   The user interface displays operational reality. When communication is stale ($> 12\text{ s}$), the UI dims cards and displays a yellow badge; when offline ($> 20\text{ s}$), it presents an intrusive red warning banner and locks mutation controls. Mutating buttons employ pessimistic UI locking (instant disable on tap) to prevent accidental double-dispatch.

```mermaid
sequenceDiagram
    autonumber
    participant Sensor as Hardware Sensor (TDS / Radar / E-Stop)
    participant Core1 as ESP32-S3 Core 1 (20 Hz FSM / Interlocks)
    participant Core0 as ESP32-S3 Core 0 (MQTT & PSRAM Spooler)
    participant Mosq as Eclipse Mosquitto (OT LAN 1883)
    participant Backend as FastAPI Backend (aiomqtt / SQLAlchemy)
    participant Kiosk as HMI Touch Kiosk (React 18 SPA)
    participant TG as Outbound Telegram Bot

    Sensor->>Core1: Anomaly Detected (e.g. TDS = 1380 ppm > Target + 50)
    Note over Core1: Synchronous Interlock Evaluation (IL-01)
    Core1->>Core1: 1. De-energize Relays (GPIO 4, 5, 6, 7 HIGH)<br/>2. Latch FAULT_PPM_OUT_OF_RANGE in NVS<br/>3. Turn ON DC 12V Pilot Lamp & Buzzer
    Core1->>Core0: Post Fault Event via FreeRTOS Queue
    Core0->>Mosq: Publish QoS 1 to desanomia/gh1/events
    Mosq->>Backend: Deliver Event Frame
    par Backend Processing
        Backend->>Backend: Insert into faults & audit_logs
        Backend->>Kiosk: Broadcast Fault Frame via 1 Hz WebSocket
        Backend->>TG: Queue Critical Alert (alert_queue)
    end
    Note over Kiosk: Screen-Locking Fault Modal Displayed<br/>Reset Button Disabled (Volume > 5.0 L)
    TG-->>TG: Deliver Telegram Push with [Konfirmasi Drain] Callback
```

---

## 2. Multi-Tier Fault Taxonomy & Error Code Hierarchy

Desanomia organizes all system anomalies into five distinct operational tiers:

```mermaid
graph TD
    classDef t1 fill:#450a0a,stroke:#ef4444,stroke-width:2px,color:#fff;
    classDef t2 fill:#78350f,stroke:#f59e0b,stroke-width:2px,color:#fff;
    classDef t3 fill:#1e293b,stroke:#3b82f6,stroke-width:2px,color:#fff;
    classDef t4 fill:#312e81,stroke:#6366f1,stroke-width:2px,color:#fff;
    classDef t5 fill:#042f2e,stroke:#14b8a6,stroke-width:2px,color:#fff;

    Root["Desanomia System Error Hierarchy"]
    Root --> T1["Tier 1: Firmware Hardware Safety Faults\n(Latched in NVS / Failsafe Relays OFF)"]:::t1
    Root --> T2["Tier 2: Operational Process & Agronomic Warnings\n(Inspection States / Agronomic Gating)"]:::t2
    Root --> T3["Tier 3: Backend REST & WebSocket API Errors\n(Standardized Envelope / HTTP Status Codes)"]:::t3
    Root --> T4["Tier 4: Communication & Telemetry Timeouts\n(LWT / Heartbeat Supervision / Stale Badges)"]:::t4
    Root --> T5["Tier 5: Database & Infrastructure Failures\n(RAM Buffering / Dual Backup / Hash Integrity)"]:::t5
```

### 2.1 Tier 1: Firmware Hardware Safety Faults (Latched in NVS)
Firmware faults are raised synchronously by Core 1 when one of the 7 safety interlocks (`IL-01` to `IL-07`) is violated. They immediately force all relays to the un-energized safe state, latch into ESP32 NVS, trigger local DC 12V panel alarms (Pilot Lamp GPIO 3, Buzzer GPIO 2), and require **Gated Fault Reset** to clear.

| Canonical Fault Code | Interlock ID | Trigger Condition | Immediate Firmware Reaction | Recovery Precondition |
| :--- | :---: | :--- | :--- | :--- |
| `FAULT_PPM_OUT_OF_RANGE` | `IL-01` | Post-mixing mean TDS outside $[\text{Target} \pm 50\text{ ppm}]$ after top-up, or initial TDS $> \text{Target} + 50\text{ ppm}$. | Distribution pump locked OFF; mixer and dosing de-energized; latched in NVS. | Manual gravity drain of Drum 2 to $\le 5.0\text{ L}$ via waste ditch valve (`D-012`). |
| `FAULT_DRY_RUN` | `IL-02` | Drum 2 level $< 5.0\text{ L}$ while distribution pump is active. | Distribution pump instantly de-energized in $< 500\text{ ms}$; batch aborted. | Inspect plumbing; manual reset if batch was legitimately depleted (`D-003`). |
| `FAULT_BATCH_REJECTED` | `IL-03` | `START_BATCH` command received while Drum 2 level $> 5.0\text{ L}$. | Command rejected over MQTT with QoS 1 ACK status `REJECTED`; FSM remains `IDLE`. | Manual drain of residual fluid in Drum 2 to $\le 5.0\text{ L}$ before re-triggering. |
| `FAULT_NO_WATER_SUPPLY` | `IL-04` | Water fill active, but radar level rise $< 1.0\text{ L}$ within 90 seconds. | Fill solenoid de-energized; fill timer paused; alarm sounded. | Verify municipal/well water pump; operator clicks `[Lanjutkan Pengisian]` (`TR-19`). |
| `FAULT_FILL_TIMEOUT` | `IL-04` | Total continuous filling duration exceeds 20 minutes ($1200\text{ s}$). | Fill solenoid de-energized; fill timer halted; alarm sounded. | Verify source flow rate; operator clicks `[Lanjutkan Pengisian]` without draining (`TR-19`). |
| `FAULT_TDS_INVALID` | `IL-05` | Clean water TDS reading $< 50\text{ ppm}$ (probe disconnected) or $> 2000\text{ ppm}$ (short circuit). | Batch aborted; fill solenoid closed; relays de-energized. | Inspect BNC connector, cable continuity, and probe submersion; run calibration wizard (`D-036`). |
| `FAULT_BASE_TDS_HIGH` | `IL-05` | Raw water baseline TDS $\ge 350\text{ ppm}$ during `CHECK_BASE` state. | Batch aborted; fill solenoid closed; relays de-energized. | Inspect raw water source filtration; flush source line; drain contaminated Drum 2. |
| `FAULT_RADAR_OFFLINE` | `IL-06` | FMCW radar UART1 silent or frame corrupted for $> 3.0\text{ seconds}$. | All active relays de-energized immediately; FSM halted. | Check UART1 wiring (GPIO 17/18), 5V power supply to radar, and cable integrity. |
| `FAULT_ESTOP` | `IL-07` | Physical NC mushroom switch opened (`hw_estop_pressed == true`) or software E-stop triggered. | All relays de-energized in 0 ms (coil power cut) and $< 5\text{ ms}$ (GPIO 21 ISR); panel alarms activated. | Twist-release physical mushroom switch (`hw_estop_pressed: false`) and drain Drum 2 to $\le 5.0\text{ L}$ (`D-019`). |

---

### 2.2 Tier 2: Operational Process & Agronomic Warnings
Process warnings represent agricultural anomalies, hydraulic conflicts, or scheduled deferrals that do not instantly trip emergency relay cutoffs but alter operational state or require gated human intervention.

| Warning Code | Trigger Threshold / Condition | Operational System Reaction | Operator Notification & Action |
| :--- | :--- | :--- | :--- |
| `STARVATION_SUSPECTED` | Post-dosing TDS deficit $> 250\text{ ppm}$ below target ($< \text{Target} - 250\text{ ppm}$). | Top-up dosing is skipped to prevent dry pump wear; FSM halts at `GATE_EVALUATE`. | Warning toast + Telegram alert: "Konsentrat Habis / Terbakar". Operator checks Drum 1 level and confirms refill (`D-001`, `D-022`). |
| `LOW_STOCK_CONCENTRATE` | Concentrate Drum 1 calculated virtual stock $\le 3000\text{ mL}$ ($3.0\text{ L}$). | System permits current batch to finish, but flags amber status on tank card. | Floating amber toast + persistent notification drawer: "Stok Pupuk Menipis: Sisa < 3.0 L". Operator pre-mixes fertilizer (`D-025`). |
| `OUT_OF_STOCK_CONCENTRATE` | Concentrate Drum 1 calculated virtual stock $< 1500\text{ mL}$ ($1.5\text{ L}$). | Backend locks batch initiation (`POST /api/v1/batches` returns 409). | High-friction modal: "Stok Pupuk Habis — Isi Ulang Drum 1". Mandates Refill Confirmation Gate resetting stock to 20.0 L (`D-025`). |
| `SCHEDULE_CONFLICT_IMMINENT` | Manual batch initiated while an automated schedule is imminent ($< 15\text{ minutes}$). | Batch setup dialog intercepts submission and displays postponement warning. | Operator confirms whether to preempt schedule or cancel manual run (`D-024`). |
| `SAME_DAY_DOUBLE_DISTRIBUTION` | Second fertigation batch initiated on the same calendar day. | Interlocked by default; requires Hard Confirmation Modal with agronomic hazard warnings. | Operator must check checkbox acknowledging root asphyxiation / salinity risk before override (`D-039`). |
| `BATCH_PAUSED_INSPECTION` | Cold-boot / mid-batch recovery after power outage with Drum 2 level $> 5.0\text{ L}$. | ESP32 initializes in unpowered paused mode; backend calculates dynamic deficit. | Screen-locking modal showing measured volume, PPM, and deficit mL with 30-min auto-resume (`D-013`). |

---

### 2.3 Tier 3: Edge Backend REST & WebSocket Error Envelope
All HTTP 4xx and 5xx API errors strictly adhere to the unified JSON error envelope:

```json
{
  "error": {
    "code": "INTERLOCK_REJECTED",
    "message": "Distribution pump locked OFF: mean TDS (1180 ppm) outside allowable gate band 1200-1300 ppm",
    "detail": {
      "interlock": "TDS_GATE",
      "measured_tds": 1180.4,
      "gate_band": [1200, 1300],
      "recipe_id": "REC-GEN-01",
      "timestamp": "2026-10-10T16:50:00Z"
    }
  }
}
```

#### Canonical HTTP Status Codes & Error Mappings
| HTTP Status | Error Code (`error.code`) | Semantics & Common Trigger Scenarios |
| :---: | :--- | :--- |
| **`400 Bad Request`** | `BAD_REQUEST` | Malformed JSON body, invalid query parameter format, or illegal date filter. |
| **`401 Unauthorized`** | `UNAUTHENTICATED` | Missing session cookie, expired token, or invalid Argon2id credentials. |
| **`403 Forbidden`** | `FORBIDDEN` | Role authorization failure (e.g., Viewer on Gazebo TV attempting batch control). |
| **`404 Not Found`** | `NOT_FOUND` | Referenced entity ID (`batch_id`, `recipe_id`, `schedule_id`) does not exist. |
| **`409 Conflict`** | `INTERLOCK_REJECTED` | Hardware interlock rejects command (e.g. Drum 2 $> 5.0\text{ L}$ on `START_BATCH`). |
| **`409 Conflict`** | `INVALID_STATE` | Command incompatible with active FSM state (e.g. manual actuator jog during active batch). |
| **`409 Conflict`** | `DEVICE_OFFLINE` | ESP32-S3 microcontroller is offline; command cannot be dispatched over MQTT. |
| **`422 Unprocessable`** | `VALIDATION_ERROR` | Pydantic v2 schema validation failure (e.g. `tds_target` outside bounds 500–1800 ppm). |
| **`429 Too Many Req`** | `RATE_LIMITED` | Rate limit exceeded (e.g. $> 5\text{ attempts/min}$ on `/api/v1/auth/login`). |
| **`500 Internal Error`**| `INTERNAL` | Unhandled backend server exception. Internal stack traces are logged but scrubbed from response. |
| **`504 Gateway Timeout`**| `COMMAND_TIMEOUT` | MQTT QoS 1 command ACK not received from ESP32 within $3.0\text{ seconds}$. |

---

### 2.4 Tier 4: Communication & Telemetry Liveness Timeouts
Microcontroller communication is supervised at the edge host backend via MQTT keep-alive, LWT (Last Will and Testament), and monotonic timestamp tracking:

```mermaid
stateDiagram-v2
    [*] --> ONLINE: Telemetry Received (Every 5s / 1s)
    ONLINE --> STALE: Silent > 12.0s
    STALE --> ONLINE: Fresh Telemetry Frame Arrives
    STALE --> OFFLINE: Silent > 20.0s OR LWT Triggered
    OFFLINE --> ONLINE: Reconnected & Initial Status Published
    OFFLINE --> [*]
```

- **`TELEMETRY_ONLINE` ($< 12.0\text{ s}$):** Green status badge. Full operational control enabled.
- **`TELEMETRY_STALE` ($> 12.0\text{ s}$):** Yellow status badge. Real-time telemetry cards visually dim. Mutation buttons display a confirmation spinner while waiting for fresher data.
- **`TELEMETRY_OFFLINE` ($> 20.0\text{ s}$ or MQTT LWT):** Red status banner across header. All mutation controls are hard-locked (`DEVICE_OFFLINE`). Critical alert dispatched to Telegram bot. FSM continues running autonomously in ESP32 firmware.
- **`COMMAND_TIMEOUT` ($3.0\text{ s}$):** When a state-changing command is published over `desanomia/gh1/cmd`, backend waits up to 3.0 seconds for a matching `cmd_id` on `desanomia/gh1/ack`. If timeout expires, backend releases optimistic UI lock, returns HTTP 504 `COMMAND_TIMEOUT`, and does not automatically re-dispatch to avoid double-actuation.

---

### 2.5 Tier 5: Database & Infrastructure Failures
- **`DB_WRITE_FAILURE`:** PostgreSQL 16 write failure or connection pool exhaustion. FastAPI buffers incoming telemetry in an in-memory RAM queue (5-second bulk write buffer, capacity 5000 frames) and retries asynchronously. Real-time WebSocket broadcasting and ESP32 physical execution continue unaffected.
- **`DB_PARTITION_MISSING`:** Monthly range partition for the upcoming month is missing. Checked daily by background maintenance cron; alerts administrator via Telegram.
- **`AUDIT_CHAIN_INTEGRITY_VIOLATION`:** SHA-256 hash mismatch or sequence gap detected in `audit_logs`. Triggers immediate `TAMPER_EVIDENT_BREACH` alert via Telegram and sets persistent red security banner on the dashboard (`TR-16`).

---

## 3. Gated Fault Reset & Physical Clearing Protocols (TR-10, D-012, D-019)

Safety faults latched in ESP32 NVS cannot be cleared by simply tapping a button on the UI. They enforce a **Dual-Condition Physical Clearance Protocol** grounded in physical reality.

```mermaid
flowchart TD
    FaultState["Fault Latched in NVS\n(Buzzer Active / Relays Open)"] --> Inspection["Physical Operator Inspection in Panel Room"]
    
    Inspection --> CheckEStop{"Is Physical NC E-Stop Mushroom Pressed?"}
    CheckEStop -- Yes --> TwistEStop["Operator Twists Mushroom Switch to Release\n(Telemetry updates: hw_estop_pressed = false)"]
    CheckEStop -- No --> CheckFluid{"Is Drum 2 Level > 5.0 L?"}
    TwistEStop --> CheckFluid
    
    CheckFluid -- Yes --> OpenDrain["Open Manual Gravity Drain Valve at Drum 2 Base\n(Flush contaminated fluid directly to waste ditch)"]
    OpenDrain --> RadarCheck["Radar Confirms Fluid Level <= 5.0 L"]
    CheckFluid -- No --> RadarCheck
    
    RadarCheck --> UIAvailable["UI 'Reset Fault' Button Becomes Enabled\n(Disabled warning tooltips disappear)"]
    UIAvailable --> OperatorClick["Operator Taps 'Reset Fault' on HMI Kiosk / Web"]
    OperatorClick --> MQTTReset["Backend Dispatches RESET_FAULT Command (QoS 1)"]
    MQTTReset --> FWValidate{"ESP32 Firmware Core 1 Validates:\nhw_estop_pressed == false AND volume <= 5.0 L"}
    
    FWValidate -- Pass --> FMSIdle["Clear NVS Fault Latch\nDe-energize DC 12V Buzzer & Lamp\nTransition FSM to IDLE\nLog FAULT_CLEARED to audit_logs"]
    FWValidate -- Fail --> RejectCmd["Reject Command with 409 INTERLOCK_REJECTED\nKeep Relays Safe and Fault Latched"]
```

### 3.1 Firmware Validation Rules
The ESP32 FreeRTOS firmware evaluates both conditions atomically upon receiving a `RESET_FAULT` command:
1. `hw_estop_pressed == false`: Physical NC mushroom contacts on GPIO 21 must be closed.
2. `drum2_volume <= 5.0 L`: FMCW radar sensor must confirm volume is below the dry sump threshold ($5.0\text{ L}$).

If either condition fails, the firmware immediately returns an ACK packet with status `REJECTED` and the specific interlock reason code.

### 3.2 UI Instructive Feedback & Dynamic Badges
The UI `Reset Fault` button dynamically reflects physical hardware state:
- **Locked by Hardware E-Stop:** Button is disabled with an amber warning badge:  
  `Tombol E-Stop Fisik Masih Tertekan — Putar untuk Melepas`
- **Locked by Contaminated Drum 2 Fluid:** Button is disabled with a red warning badge:  
  `Kuras Drum Distribusi ke Parit hingga ≤ 5.0 L (Terukur: 138.4 L)`
- **Both Conditions Clear:** Button enables with high-contrast emerald styling:  
  `[Reset Fault]` (1-tap execution on Kiosk, logging user ID and clearance volume to `audit_logs`).

---

## 4. Mid-Batch Outage Recovery & Dynamic Deficit Dosing (D-013, TR-08)

If edge host or greenhouse utility AC power drops while a batch is in progress, the system recovers without discarding viable fertilizer solution.

```mermaid
flowchart TD
    PowerRestored["Mains Power Restored\nESP32 Boots & Cold-Starts FreeRTOS"] --> CheckNVS{"Check NVS Journal:\nWas Active Batch Running?"}
    
    CheckNVS -- No --> NormalBoot["Enter IDLE State Normally"]
    CheckNVS -- Yes --> CheckLevel{"Check Radar Sensor:\nDrum 2 Level > 5.0 L?"}
    
    CheckLevel -- No (<= 5.0 L) --> Depleted["Assume Batch Was Fully Distributed\nEnter IDLE & Log Outage Truncation"]
    CheckLevel -- Yes (> 5.0 L) --> PausedMode["Enter BATCH_PAUSED_INSPECTION Mode\nRelays Remain OFF\nStart 30-Minute Auto-Resume Timer"]
    
    PausedMode --> BackendCalc["Backend Ingests Volume & Measures TDS\nCalculates Dynamic Deficit Concentrate mL"]
    BackendCalc --> UIModal["Display Intrusive Screen-Locking Modal on Kiosk\nSend Critical Alert to Telegram with Action Buttons"]
    
    UIModal --> Decision{"Operator Action Within 30 Minutes?"}
    
    Decision -- "[Konfirmasi & Lanjutkan]" --> DeficitDose["Execute Calculated Deficit Concentrate Dose (mL)\nMix 120s -> Stabilize 15s -> Gate Evaluate"]
    Decision -- "[Kuras Drum & Batalkan]" --> ManualAbort["Operator Drains Drum 2 to <= 5.0 L\nAborts Batch & Clears Fault"]
    Decision -- No Response (30 min timeout) --> AutoResume["Verify All 7 Interlocks Pass\nAuto-Execute Deficit Dose & Resume Batch"]
```

### 4.1 Dynamic Deficit Calculation Formula
When resuming an interrupted batch with fluid in Drum 2, the system calculates the precise deficit volume of concentrate needed to bring the existing water volume to the target recipe PPM:

$$V_{\text{deficit\_mL}} = \frac{(\text{TDS}_{\text{target}} - \text{TDS}_{\text{measured}}) \times V_{\text{current\_L}}}{k_{\text{dose}}}$$

Where:
- $\text{TDS}_{\text{target}}$: Target PPM defined in active recipe preset (e.g. $1250\text{ ppm}$ for Generatif).
- $\text{TDS}_{\text{measured}}$: Average stable TDS reading measured after a 30-second settling window.
- $V_{\text{current\_L}}$: Current volume measured by FMCW radar sensor in Drum 2 (e.g. $140.0\text{ L}$).
- $k_{\text{dose}}$: Empirical dosing calibration coefficient ($1.07\text{ ppm}\cdot\text{L}/\text{mL}$, verified in `DOSE_TEST_RESULT.md`).

### 4.2 Deficit Recovery Constraints
- **Maximum Recovery Quota:** $V_{\text{deficit\_mL}}$ is strictly capped at **300 mL maximum**. If the calculated deficit exceeds 300 mL, the system flags `STARVATION_SUSPECTED` and halts.
- **Catastrophic Salt Spike:** If $\text{TDS}_{\text{measured}} > \text{TDS}_{\text{target}} + 500\text{ ppm}$ (e.g. $> 1750\text{ ppm}$), dynamic recovery is prohibited. The modal locks to `[Kuras Drum]` only.

---

## 5. In-Flight Hydraulic Fill Recovery (IL-04, TR-19)

Unlike fertilizer-dosed water, raw municipal/well water in Drum 2 is uncontaminated. Premature drainage during water filling failures wastes resources.

### 5.1 Dual-Stage Fill Timeout Separation
1. **Early Rise Timeout (90 seconds):** If the fill solenoid is open but the radar level does not increase by $\ge 1.0\text{ L}$ within 90 seconds, the system flags `FAULT_NO_WATER_SUPPLY` (supply pump tripped, source valve closed, or line airlock).
2. **Total Fill Timeout (20 minutes):** If total continuous water filling exceeds 20 minutes ($1200\text{ s}$), the system flags `FAULT_FILL_TIMEOUT` (low municipal supply pressure).

### 5.2 Recovery Without Tank Drainage
- In either fill timeout scenario, the ESP32 de-energizes the fill solenoid and halts the fill timer.
- **No Drainage Required:** The operator inspects source water supply valves or pumps.
- **`RESUME_FILL` Command:** The operator clicks `[Lanjutkan Pengisian]` in the UI or Telegram callback. The fill solenoid re-opens, and the timer resumes accumulating from the existing water level until $140.0\text{ L}$ is reached.

---

## 6. Operational Alert Escalation & Offline Queue Management (D-025, TR-15, TR-21, TR-22)

Alerts follow a 5W1H operational framework mapped across physical alarms, HMI touch audio, in-app notifications, and remote Telegram bots.

### 6.1 4-Tier Alert Severity Model

| Severity Level | Local Panel Alarms (DC 12V) | HMI Kiosk Audio Chime | In-App Hub & Drawer | Outbound Telegram Bot |
| :--- | :--- | :--- | :--- | :--- |
| **`CRITICAL`** | Red Pilot Lamp ON (GPIO 3)<br>Piezo Buzzer ON (GPIO 2) | Urgent double glass chime (`ping-ping.mp3`) | Screen-locking modal or sticky top toast with action button | High-priority push message with interactive inline callback buttons |
| **`WARNING`** | Pilot Lamp OFF<br>Piezo Buzzer OFF | Subtle single glass ping (`ping.mp3`) | Slide-out drawer + floating toast with action button | Standard Telegram message |
| **`SUCCESS`** | Pilot Lamp OFF<br>Piezo Buzzer OFF | Silent | Floating auto-dismiss toast (5s) | Standard Telegram notification |
| **`INFO`** | Pilot Lamp OFF<br>Piezo Buzzer OFF | Silent | Slide-out drawer history only | Muted / Silent push |

### 6.2 Offline Telegram Queue (`alert_queue`) (TR-22)
When 4G cellular connectivity drops (Orbit Star H2 down), outbound alerts are persisted to PostgreSQL:

```sql
-- Schema representation from 06_DATA_MODEL.md
CREATE TABLE alert_queue (
    id BIGSERIAL PRIMARY KEY,
    severity VARCHAR(16) NOT NULL,
    alert_code VARCHAR(64) NOT NULL,
    title VARCHAR(128) NOT NULL,
    message TEXT NOT NULL,
    payload_json JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    dispatched_at TIMESTAMPTZ,
    retry_count INT NOT NULL DEFAULT 0,
    status VARCHAR(16) NOT NULL DEFAULT 'PENDING'
);
```

- **Chronological Drain:** A background task polls `alert_queue`. Upon internet restoration, it drains pending records in exact chronological order, embedding the original occurrence timestamp in the message body:  
  `[TERTUNDA: Terjadi pada 14:12 WIB] ⚠️ Peringatan: Suplai Air Terhenti.`
- **Deduplication Window:** Identical alert codes generated within 10 minutes are consolidated into a single push to prevent notification spamming.

### 6.3 Telegram Interactive Callback Handlers
Critical alert messages embed inline action buttons for 1-tap mobile authorization:
- `[Siram Sekarang]`: Dispatches an immediate batch trigger.
- `[Tunda 1 Jam]`: Defers an imminent schedule by 60 minutes.
- `[Konfirmasi Pause Recovery]`: Authorizes dynamic deficit dosing after power recovery.

---

## 7. Frontend Error Boundaries, Pessimistic UX & Network Recovery

The React 18/19 Single Page Application runs 24/7 on the Beelink EQ12 local touchscreen via Chromium and the Cage Wayland compositor.

### 7.1 Kiosk Root ErrorBoundary (`KioskErrorBoundary.tsx`)
Unhandled JavaScript exceptions or React component render failures are captured by a root Error Boundary to prevent a blank white screen or compositor crash:

```tsx
import React, { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class KioskErrorBoundary extends Component<Props, State> {
  public state: State = { hasError: false, error: null };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Kiosk Dashboard Uncaught Error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 text-slate-100 p-8 font-sans">
          <div className="max-w-lg w-full bg-slate-900 border border-red-500/40 rounded-2xl p-8 shadow-2xl text-center">
            <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/20">
              <span className="text-3xl">⚠️</span>
            </div>
            <h1 className="text-2xl font-bold text-red-400 mb-2">Terjadi Kesalahan Antarmuka</h1>
            <p className="text-slate-400 text-sm mb-6 leading-relaxed">
              Sistem kontrol fisik ESP32 tetap berjalan mandiri di latar belakang. Silakan muat ulang antarmuka kiosk.
            </p>
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-left mb-6 overflow-auto max-h-32 text-xs font-mono text-red-300/80">
              {this.state.error?.message || "Unknown rendering exception"}
            </div>
            <button
              onClick={() => window.location.reload()}
              className="w-full min-h-[56px] py-3 px-6 bg-slate-800 hover:bg-slate-700 active:scale-95 text-white font-semibold rounded-xl border border-slate-700 transition-all text-base"
            >
              Muat Ulang Tampilan Kiosk (Reload)
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
```

### 7.2 Pessimistic UI Mutation Hooks (`usePessimisticMutation`)
To prevent accidental double-clicks or duplicate commands from being published over MQTT:
1. When a user taps a mutation button (`Mulai Batch`, `Pause`, `Batal`, `Reset Fault`, Manual Relay Jog), the button immediately enters a disabled `loading` state.
2. The button remains disabled until either:
   - A correlated MQTT ACK frame arrives via WebSocket confirming execution.
   - The $3.0\text{ s}$ command timeout expires, triggering an error toast and re-enabling the button.

### 7.3 WebSocket Reconnect Backoff & Stale Indicators
The dashboard client WebSocket automatically reconnects upon disconnection using exponential backoff:
- Intervals: $1\text{ s} \to 2\text{ s} \to 4\text{ s} \to 8\text{ s} \to \text{max } 15\text{ s}$.
- While disconnected, sensor cards dim by 40% opacity, display tabular figures in amber, and mount an unobtrusive banner: `Mencoba Menyambung Ulang ke Server...`.

---

## 8. Backend Error Architecture & Database Circuit Breakers

### 8.1 FastAPI Typed Exception Hierarchy (`backend/core/errors.py`)

```python
from fastapi import Request, status
from fastapi.responses import JSONResponse

class DesanomiaException(Exception):
    """Base exception for all domain-specific edge errors."""
    def __init__(self, code: str, message: str, status_code: int = 400, detail: dict | None = None):
        self.code = code
        self.message = message
        self.status_code = status_code
        self.detail = detail or {}
        super().__init__(message)

class InterlockRejectedError(DesanomiaException):
    def __init__(self, interlock: str, message: str, detail: dict | None = None):
        super().__init__(
            code="INTERLOCK_REJECTED",
            message=message,
            status_code=status.HTTP_409_CONFLICT,
            detail={"interlock": interlock, **(detail or {})},
        )

class InvalidStateError(DesanomiaException):
    def __init__(self, current_state: str, attempted_action: str):
        super().__init__(
            code="INVALID_STATE",
            message=f"Action '{attempted_action}' is invalid in current FSM state '{current_state}'",
            status_code=status.HTTP_409_CONFLICT,
            detail={"current_state": current_state, "action": attempted_action},
        )

class DeviceOfflineError(DesanomiaException):
    def __init__(self, last_seen_seconds: float):
        super().__init__(
            code="DEVICE_OFFLINE",
            message=f"Microcontroller is offline (last seen {last_seen_seconds:.1f}s ago)",
            status_code=status.HTTP_409_CONFLICT,
            detail={"last_seen_seconds": last_seen_seconds},
        )

class CommandTimeoutError(DesanomiaException):
    def __init__(self, cmd_id: str, timeout_seconds: float = 3.0):
        super().__init__(
            code="COMMAND_TIMEOUT",
            message=f"Command '{cmd_id}' timed out after {timeout_seconds}s without ACK",
            status_code=status.HTTP_504_GATEWAY_TIMEOUT,
            detail={"cmd_id": cmd_id, "timeout_seconds": timeout_seconds},
        )

async def desanomia_exception_handler(request: Request, exc: DesanomiaException):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": {
                "code": exc.code,
                "message": exc.message,
                "detail": exc.detail,
            }
        },
    )
```

### 8.2 Database Resilience & Asynchronous RAM Write Buffer (D-044)
- **High-Frequency Ingestion Protection:** Telemetry arrives at 1 Hz during active batches. Direct per-second disk writes degrade NVMe SSD endurance.
- **5-Second Bulk RAM Buffer:** FastAPI aggregates sensor frames in an in-memory queue and flushes bulk records every 5 seconds via SQLAlchemy async sessions.
- **Circuit Breaker on DB Outage:** If PostgreSQL becomes unresponsive, the buffer expands up to 5000 frames (~80 minutes of telemetry) in RAM before dropping oldest frames, maintaining WebSocket telemetry streaming and alerting operators without crashing the backend process.

---

## 9. Comprehensive 15-Scenario System Failure & Resilience Playbook

The master reference playbook detailing 15 concrete failure modes across firmware, backend, database, network, and physical hardware:

| # | Trigger Event | Primary Detection Node | Immediate Firmware Reaction | Backend Reaction | UI / Kiosk UX | Operator Action & Recovery |
| :-: | :--- | :--- | :--- | :--- | :--- | :--- |
| **1** | **TDS Out of Range at Gate** | ESP32 Core 1 (`GATE_EVALUATE`) | De-energizes distribution pump; latches `FAULT_PPM_OUT_OF_RANGE` in NVS. | Records fault in DB; dispatches Critical alert to Telegram. | Intrusive red modal; `Reset Fault` button disabled (`volume > 5.0 L`). | Open manual gravity drain valve; flush Drum 2 to ditch $\le 5.0\text{ L}$; click `Reset Fault` (`D-012`). |
| **2** | **Dry-Run During Distribution** | ESP32 Core 1 (`IL-02`) | Instantly de-energizes distribution pump in $< 500\text{ ms}$; latches `FAULT_DRY_RUN`. | Records fault in DB; dispatches Critical alert. | Red dry-run banner; highlights tank card. | Verify dripper line discharge; click `Reset Fault` to return to `IDLE` (`D-003`). |
| **3** | **Pre-Batch Drum 2 Not Empty** | ESP32 Core 1 (`IL-03`) | Rejects `START_BATCH` command; publishes QoS 1 ACK status `REJECTED`. | Maps to 409 `INTERLOCK_REJECTED`. | Toast: "Drum 2 Belum Kosong (Terukur: X L). Kuras drum terlebih dahulu". | Drain residual liquid from Drum 2 via gravity valve until $\le 5.0\text{ L}$; re-trigger batch. |
| **4** | **Water Supply Failure (Early)** | ESP32 Core 1 (`IL-04`) | Closes fill solenoid in 90s; enters `PAUSED_FILL_NO_WATER`; sounds buzzer. | Records warning; sends Telegram notification. | Amber toast: "Air Masuk Terhenti (< 1.0 L / 90s)". | Inspect source water pump and piping valves; tap `[Lanjutkan Pengisian]` (`TR-19`). |
| **5** | **Fill Timeout Exceeded (> 20m)** | ESP32 Core 1 (`IL-04`) | Closes fill solenoid at 20 min; pauses fill timer. | Records warning; sends Telegram notification. | Amber modal: "Waktu Pengisian Maksimum 20 Menit Terlampaui". | Inspect municipal line pressure; tap `[Lanjutkan Pengisian]` without draining (`TR-19`). |
| **6** | **TDS Probe Disconnected/Short** | ESP32 Core 1 (`IL-05`) | Aborts batch; shuts fill solenoid; latches `FAULT_TDS_INVALID`. | Records fault; sends Critical Telegram alert. | Red modal: "Sensor TDS Tidak Valid (< 50 atau > 2000 ppm)". | Inspect BNC connector, probe cable, and liquid immersion; run calibration wizard (`D-036`). |
| **7** | **High Raw Water Baseline TDS** | ESP32 Core 1 (`IL-05`) | Aborts batch at `CHECK_BASE`; closes solenoid; latches `FAULT_BASE_TDS_HIGH`. | Records fault; sends Critical Telegram alert. | Red modal: "Air Baku Tercemar (TDS >= 350 ppm)". | Inspect raw source filtration; flush water lines; drain Drum 2 to ditch. |
| **8** | **FMCW Radar UART Silence (> 3s)**| ESP32 Core 1 (`IL-06`) | Cuts all active relays immediately; latches `FAULT_RADAR_OFFLINE`. | Records fault; sends Critical Telegram alert. | Red banner: "Sensor Radar Level Terputus". | Inspect UART1 wiring (GPIO 17/18) and 5V power supply to radar board. |
| **9** | **Physical E-Stop Mushroom Tripped**| ESP32 GPIO 21 ISR (`IL-07`) | De-energizes all relays in 0 ms (coil power) and $< 5\text{ ms}$ (software); turns on pilot lamp & buzzer. | Records fault; broadcasts E-Stop event to all clients. | Full-screen red hazard overlay: "DARURAT DIAKTIFKAN". | Twist-release mushroom button (`hw_estop_pressed = false`); drain Drum 2 if dirty; click `Reset Fault`. |
| **10**| **Mid-Batch Power Outage Recovery** | ESP32 Core 1 Cold Boot | Detects active batch in NVS with level $> 5.0\text{ L}$; boots into `BATCH_PAUSED_INSPECTION`. | Calculates deficit concentrate mL; starts 30-min auto-resume timer. | Screen-locking modal showing measured volume, PPM, and deficit mL. | Tap `[Konfirmasi & Lanjutkan]` to dose deficit, or let 30-min timer auto-resume (`D-013`). |
| **11**| **Concentrate Drum 1 Starvation** | ESP32 Core 1 / Backend | Skips top-up dose; raises `STARVATION_SUSPECTED`; halts at `GATE_EVALUATE`. | Flags virtual stock depletion; sends Critical alert. | Amber modal: "Konsentrat Habis / Terbakar. Top-Up Dibatalkan". | Inspect Drum 1; prepare 20 L concentrate; confirm Refill Gate resetting stock (`D-022`, `D-025`). |
| **12**| **ESP32 Telemetry Silence / Offline**| Backend aiomqtt Ingest | Continues running batch autonomously on ESP32 Core 1. | Marks device `STALE` at 12s, `OFFLINE` at 20s; dispatches Telegram alert. | Yellow badge at 12s; red offline banner at 20s with controls locked. | Inspect W5500 Ethernet cable, industrial switch power, and OT LAN IP `192.168.10.20`. |
| **13**| **Edge Server Reboot Mid-Batch** | ESP32 Core 0 Spooler | FSM finishes batch autonomously; spools events into 500-slot PSRAM buffer. | Backend reboots; re-subscribes to MQTT; ingests backlog from PSRAM. | Kiosk Chromium reloads; resumes live telemetry snapshot in $< 500\text{ ms}$. | Zero operator action needed; agricultural process runs uninterrupted (`D-014`). |
| **14**| **4G Cellular Internet Outage** | Backend Telegram Worker | Unaffected (OT fieldbus is air-gapped on `ETH0`). | Persists alerts into PostgreSQL `alert_queue` with monotonic sequence. | Kiosk operates 100% locally via loopback `127.0.0.1:8080`. | Inspect Orbit Star H2 4G modem; alerts flush automatically upon internet recovery (`TR-22`). |
| **15**| **Audit Log Hash Chain Corruption**| Nightly Audit Verification Cron| Unaffected (physical fertigation runs normally). | Flags `TAMPER_EVIDENT_BREACH`; dispatches Critical alert to Telegram. | Red security notification banner on Kiosk top header. | Run `python -m backend.cli verify-audit-chain` to inspect sequence gaps and restore backup. |
