# 01 PRD

## Problem

Fertigation for the 980-point greenhouse is mixed and distributed by hand, so concentration varies between batches and nobody has a record of what was delivered. Desanomia automates batch preparation and distribution with a measured safety gate, and gives operators one place to monitor, command, and review batches. [SPEC]

## Physical system [SPEC]

- **Cultivation Layout:** 980 planting points across 6 elevated raised beds (B1–B6) organized into 2 administrative logical zones (Zone 1: B1–B3, Zone 2: B4–B6). Distribution delivers to all 6 beds simultaneously via a single distribution pump (zero per-zone manifold switching in Phase 1).
- **Tanks & Sensing (5-Pair Architectural Roadmap):**
  - Architecture accommodates 5 pairs of tanks: 5 Concentrate Drums (K1–K5, 20 L each) and 5 Distribution Drums (D1–D5, 140 L each).
  - Phase 1 Implementation: Pair 1 is actively plumbed and sensored (Concentrate Drum 1: 20 L fertilizer stock container, manually dissolved; Distribution Drum 2: 140 L mixed solution and fertigation reservoir equipped with an analog TDS/EC probe and 60 GHz radar tank level sensor). Pairs 2–5 are maintained in UI and scheduler as Standby/Unassigned pairs.
- **Actuators (4 Relays):** Clean Water Fill Solenoid Valve (AC 220V), Peristaltic Dosing Pump (DC 12V), Submersible Mixing Pump (AC 220V), and High-Pressure Distribution Pump (AC 220V).
- **Emergency Hardware:** Hardwired normally-closed (NC) twist-to-reset mushroom emergency stop switch cutting relay power directly.
- **Edge Hardware Stack & Display Architecture:**
  - **Edge Gateway & Server:** On-site Beelink EQ12 Mini PC (Intel N100, 16GB DDR5, 500GB NVMe SSD, Dual 2.5GbE LAN) running Docker Compose services (FastAPI, PostgreSQL, Mosquitto, Nginx offline static UI), auto-booting on AC power restore.
  - **Microcontroller:** ESP32-S3 N16R8 running FreeRTOS firmware handling FSM, interlocks, and sensor conditioning.
  - **Primary HMI Touchscreen (Greenhouse Panel Room):** UPERFECT BE156PF 15.6" FHD (1920×1080) IPS, 10-point capacitive touch, mounted on Standing Monitor Kiosk 90 cm, powered by UGREEN Mini GaN 30W via USB-C, connected directly to Beelink EQ12 (HDMI + USB-C touch data), 100% offline operator terminal with 1-tap E-Stop.
  - **Secondary Display Gazebo (Gazebo Monitoring):** Xiaomi TV A 43" FHD 2026 (Google TV™), 1920×1080, VESA 200×200 wall bracket, wired LAN RJ45 to Orbit Star H2 modem in Gazebo DMZ, running Fully Kiosk Browser 24/7 passive read-only telemetry mirror.
  - **Mobile Client:** Smartphone browser / PWA (responsive web app) for authenticated mobile operator/admin monitoring and control via local WiFi or Tailscale VPN.

## Users and roles [SPEC]

Admin: full access including user management. Operator: control batches, schedules, manual actuators. Viewer: read-only.

## Goals

1. Run a full batch (fill, dose, mix, stabilize, measure, gate, distribute, including single-pass top-up recovery if under-dosed) with one protected start action. [SPEC]
2. Never distribute a batch outside the recipe gate band [Target − 50 ppm, Target + 50 ppm] (1200 to 1300 ppm for the default 1250 ppm recipe, 140.0 L batch). [SPEC]
3. Show live process state, TDS, and Drum 2 level on the Primary HMI Touchscreen kiosk without internet.
4. Keep a complete batch history: events, TDS trace, gate result, who started it.
5. Alert via Telegram on faults and gate failures.
6. Allow scheduled batches and manual actuator control within firmware interlocks.

## Functional requirements

> **Traceability & UI Mapping:** All 30 functional requirements (`FR-01` to `FR-30`) map directly to Technical Requirements (`TR-01` to `TR-30` in [04_TRD.md](file:///home/maria_zahra/Documents/projects/greenhouse/desanomia/brain/04_TRD.md)), UI functional items (`FE-01` to `FE-18` in [docs/SPEC.md](file:///home/maria_zahra/Documents/projects/greenhouse/desanomia/docs/SPEC.md)), and component registry items (`UI-01` to `UI-18` in [12_UI_SPEC.md](file:///home/maria_zahra/Documents/projects/greenhouse/desanomia/brain/12_UI_SPEC.md)). [SPEC, FR numbering PROPOSED]

### Quick-Reference Summary Matrix

| ID | Functional Requirement | Domain / Subsystem | Role Access | Key Mechanism & Behavior Summary |
| :--- | :--- | :--- | :--- | :--- |
| **FR-01** | Start Batch | Batch Automation | `Operator+` | Single protected start action; confirmation required; pre-flight gated |
| **FR-02** | 12-State FSM Lifecycle | Batch Automation | `Viewer+` | Live progression across 12 deterministic states (`IDLE` to `BATCH_DEPLETED`) |
| **FR-03** | Live TDS Gauge | Sensing & Telemetry | `Viewer+` | Real-time analog TDS/EC reading with color-coded recipe gate bands |
| **FR-04** | Drum 2 Level & Volume | Sensing & Telemetry | `Viewer+` | 60 GHz radar tank level in mm, volume in liters, and fill percentage |
| **FR-05** | Actuator Status Panel | Sensing & Telemetry | `Viewer+` | Real-time ON/OFF state indicators for all 4 physical relays |
| **FR-06** | Batch Event Timeline | Event & History | `Viewer+` | Chronological transition log and milestones for current/latest batch |
| **FR-07** | Batch History Table | Event & History | `Viewer+` | Paginated records with final TDS, volume, duration, status, and detail view |
| **FR-08** | TDS History Chart | Event & History | `Viewer+` | Interactive Apache ECharts time-series telemetry per batch |
| **FR-09** | ESP32 Connectivity Indicator | Sensing & Telemetry | `Viewer+` | Online/Offline status badge with last-seen heartbeat timestamp |
| **FR-10** | Reset Fault (Gated Recovery) | Safety & Faults | `Operator+` | Clears latched faults; locked while Drum 2 level > 8.0 L (manual drain gate) |
| **FR-11** | Manual Actuator Control | Safety & Control | `Operator+` | Fine-grained dosing (+10 mL) and mixer timing; 7 safety interlocks |
| **FR-12** | Schedule Management | Scheduling | `Operator+` | Full CRUD for autonomous fertigation schedules |
| **FR-13** | Session Authentication & Login | Security & Auth | `All Roles` | Session login with role verification and kiosk touch PIN numpad |
| **FR-14** | User Management | Security & Auth | `Admin only` | Administrative CRUD for user accounts and role assignments |
| **FR-15** | Telegram Alerts | Alerts & Comms | `System` | Immediate push alerts for faults, gate failures, and completions |
| **FR-16** | Command Audit Trail | Security & Audit | `Admin` | Immutable cryptographic audit log of all operator and system actions |
| **FR-17** | Emergency Stop (Dual E-Stop UX) | Safety & Control | `Operator+` | Dual UX: 1-tap local kiosk (64×64 px); confirmed remote modal |
| **FR-18** | Virtual Stock Tracking | Inventory | `Operator+` | Deducts concentrate per batch; alerts when remaining stock ≤ 2 batches |
| **FR-19** | Resume Fill Control | Batch Automation | `Operator+` | Re-opens fill valve during fill timeout without aborting/draining batch |
| **FR-20** | Unified Schedule-First Distribution | Batch Automation | `Operator+` | Single upfront modal; autonomous distribution on gate PASS |
| **FR-21** | Local Panel Alarms | Safety & Hardware | `Firmware` | Hardwired buzzer and red pilot lamp on panel door for fault transitions |
| **FR-22** | Offline Alert Store-and-Forward | Alerts & Comms | `System` | Persistent backend queue buffers Telegram alerts during outages |
| **FR-23** | Sensor Calibration Wizard | Calibration | `Operator+` | Step-by-step guided TDS calibration committing to ESP32 NVS |
| **FR-24** | Named Recipe Presets Library | Recipes | `Operator+ (edit Admin)` | Presets (*Vegetatif*, *Generatif*, *Panen*) with batch record snapshots |
| **FR-25** | Multi-Tank 5-Pair Visualization | Sensing & Telemetry | `Operator+` | 5 concentrate + 5 distribution drums with fluid animations |
| **FR-26** | Same-Day Double Distribution Lock | Safety & Agronomy | `Operator Override` | Hard confirmation dialog with root rot warnings and audit logging |
| **FR-27** | Dynamic Baseline & Preemption | Scheduling | `System` | Ad-hoc run suppresses same-day schedules and shifts recurrence |
| **FR-28** | Schedule Calendar & Conflict Invariant | Scheduling | `Viewer+` | Visual timeline preventing overlapping hydraulic irrigation slots |
| **FR-29** | In-App Notification Hub | Alerts & UI | `Operator+` | Glassmorphic drawer, 4-tier alert toasts, and HMI audio chimes |
| **FR-30** | Dual Visual Hierarchy for 12 FSM States | Visualization | `Viewer+` | Pipeline Stepper bar paired with 60 FPS fluid surface canvas waves |

---

### Detailed Functional Requirements

#### 1. Batch Automation & State Machine Lifecycle
- **FR-01: Start Batch** `[Operator+]`  
  Initiate batch sequence with mandatory confirmation dialog. Gated by pre-flight checks: disabled if FSM is not `IDLE`, Drum 2 level > 8.0 L, or ESP32 is offline.
- **FR-02: Live FSM State Across 12 Lifecycle States** `[Viewer+]`  
  Real-time tracking and visualization across all 12 discrete states: `IDLE` → `FILLING_WATER` → `CHECK_BASE` → `DOSING` → `MIXING` → `STABILIZING` → `MEASURING_TDS` → `GATE_EVALUATE` → `TOPUP_DOSING` → `RECOVERY_MIX_EVALUATE` → `DISTRIBUTING` → `BATCH_DEPLETED`.
- **FR-19: Resume Fill Control** `[Operator+]`  
  Available during `FAULT_NO_WATER_SUPPLY` or `FAULT_FILL_TIMEOUT` to re-open the water fill valve once water supply is restored, without aborting or draining the batch.
- **FR-20: Unified Schedule-First Distribution & Single Upfront Confirmation** `[Operator+]`  
  Operator selects recipe, sets timing (`'Now'` or `'Later'`), and targets tank pair in one unified dialog; batch preparation executes and, upon gate PASS, distributes **100% automatically** without secondary manual confirmation; scheduled batches execute unattended at planned time.
- **FR-30: Dual Visual Hierarchy for 12 FSM Lifecycle States** `[Viewer+]`  
  Visualizes every FSM lifecycle state across two synchronized layers: an Apple-style minimalist horizontal Pipeline Stepper bar displaying active step, completed ticks, and live timers, paired with dynamic modular fluid surface physics inside the drum canvas (`rising wave`, `rotational vortex`, `glassy calm`, `probe neon glow`, `draining wave`, `red fault pulse`, and `amber pause wave`).

#### 2. Safety Interlocks, Alarms & Fault Management
- **FR-10: Reset Fault & Gated Recovery** `[Operator+]`  
  Clears latched faults (confirmation required). Enforced by Gated Fault Reset protocol locked while Drum 2 level > 8.0 L to ensure out-of-range solution is physically drained via manual gravity valve before clearing.
- **FR-11: Manual Actuator Control** `[Operator+]`  
  Fine-grained manual dosing in +10 mL increments and timed mixer run per-second on `/manual`; strictly subject to the 7 firmware safety interlocks; disabled during active batch FSM.
- **FR-17: Emergency Stop (Dual E-Stop UX)** `[Operator+]`  
  Dual E-Stop UX: instant 1-tap (min 64×64 px without modal) on local kiosk; confirmation dialog with `aria-modal="true"` on remote web; immediately de-energizes all 4 relays via ESP32 `FAULT_ESTOP`.
- **FR-21: Local Panel Alarms** `[Firmware / System]`  
  Firmware drives physical buzzer and red pilot lamp on panel box door for immediate acoustic and visual signaling upon any `FAULT` state transition, independent of network or server connectivity.
- **FR-26: Same-Day Double Distribution Protection** `[System / Operator Override]`  
  System interlocks secondary fertigation on any day where distribution already ran; requires an explicit high-friction Hard Confirmation Dialog with root rot and EC salinity hazard warnings, logging `SAME_DAY_FORCE_OVERRIDE` in audit trail.

#### 3. Sensing, Telemetry & Cockpit Visualization
- **FR-03: Live TDS with Color-Coded Gauge** `[Viewer+]`  
  Real-time analog TDS/EC sensor readings displayed with a color-coded gauge reflecting recipe gate bands.
- **FR-04: Drum 2 Level and Volume** `[Viewer+]`  
  Real-time 60 GHz radar tank level in millimeters, calculated volume in liters, and fill percentage for Distribution Drum (Drum 2).
- **FR-05: Actuator Status Panel** `[Viewer+]`  
  Real-time ON/OFF state indicators for all 4 physical actuators (Clean Water Solenoid, Dosing Pump, Mixing Pump, Distribution Pump) with firmware command rejection reasons.
- **FR-09: ESP32 Connectivity Indicator** `[Viewer+]`  
  Microcontroller heartbeat and connection liveness status (Online/Offline) with last-seen timestamp; displays prominent visual warning on stale data.
- **FR-25: Multi-Tank 5-Pair Visualization & Management** `[Operator+]`  
  Dashboard visualizes all 5 pairs of tanks: 5 Concentrate Drums (K1–K5) and 5 Distribution Drums (D1–D5) with differentiated viscous vs. wave fluid animations; in Phase 1, Pair 1 is actively plumbed while Pairs 2–5 display distinct Standby/Unassigned status; batch setup supports selecting the target tank.

#### 4. Scheduling & Hydraulic Conflict Prevention
- **FR-12: Schedule Management** `[Operator+]`  
  Full CRUD management for autonomous fertigation schedules (days of week, target times, recipes, and target tanks).
- **FR-27: Dynamic Baseline Reference & Preemption** `[System]`  
  Invoking an ad-hoc batch `'Now'` automatically deletes/suppresses conflicting later schedules for that day to prevent over-irrigation, and dynamically sets the execution timestamp as the new baseline reference for the subsequent autonomous recurrence interval.
- **FR-28: Dashboard Schedule Calendar & Zero Conflict Invariant** `[Viewer+]`  
  Dashboard provides visual calendar/timeline of scheduled runs by tank, recipe, and time; validates and prevents overlapping irrigation slots to enforce hydraulic pipe sharing safety.

#### 5. Agronomic Recipes, Stock & Calibration
- **FR-18: Concentrate Virtual Stock Tracking** `[Operator+]`  
  Operator records initial refill of 20 L / 2 kg NPK fertilizer; system tracks remaining stock by deducting actual batch injection history after each distribution run; alerts operator when estimated remaining stock ≤ 2 batches.
- **FR-23: Guided Sensor Calibration Wizard** `[Operator+]`  
  Accessible on `/manual`; guides step-by-step TDS probe detaching, requiring Drum 2 ≤ 8.0 L drained hold, real-time ADC stability reading, 1413 µS/cm buffer immersion, baseline raw water PPM calculation, and committing calibrated slope/offset to ESP32 NVS with audit logging.
- **FR-24: Named Recipe Presets Library** `[Operator+ (edit Admin)]`  
  Accessible on `/recipes`; enables managing named crop growth phase presets such as *Vegetatif*, *Generatif*, and *Panen*, modifying default targets, and archiving presets (Admin role required for mutations, accessible via Kiosk step-up elevation); starting a batch requires 1-click preset selection from the Named Presets Library (custom ad-hoc target inputs removed per D-050 to ensure agricultural traceability); permanently snapshots preset name and target band to PostgreSQL batch records.

#### 6. Event Journaling, Historical Analytics & Auditing
- **FR-06: Batch Event Timeline** `[Viewer+]`  
  Real-time event journal logging all state transitions, timing, and system events for the current or latest batch run.
- **FR-07: Batch History Table with Detail View** `[Viewer+]`  
  Searchable, paginated table of past batches with summary metrics (final TDS, volume, duration, status, operator) and in-depth detail inspection modal.
- **FR-08: TDS History Chart** `[Viewer+]`  
  Interactive time-series telemetry chart (Apache ECharts) rendering historical TDS readings per batch.
- **FR-16: Tamper-Evident Command Audit Trail** `[Admin]`  
  Immutable cryptographic audit log capturing every operator command and automated system action with actor metadata, parameters, and timestamps.

#### 7. Access Control, Notifications & Alarms
- **FR-13: Session Authentication & Login** `[All Roles]`  
  Secure login with session authentication, cookie management, role validation, and on-screen PIN numpad for touch kiosk environments.
- **FR-14: User Management** `[Admin only]`  
  Administrative CRUD management for user accounts, credentials, and role assignments (`Admin`, `Operator`, `Viewer`).
- **FR-15: Telegram Alerts** `[System]`  
  Push notification alerts to operator Telegram group for critical faults, gate failures, and batch completions.
- **FR-22: Offline Alert Store-and-Forward** `[System]`  
  Persistent queue in backend buffers critical Telegram alerts during internet outages and flushes them in chronological order with original event timestamps upon reconnection.
- **FR-29: In-App Notification Hub & 5W1H Operational Alert Matrix** `[Operator+]`  
  Delivers notifications via an Apple-style minimalist glassmorphic interface featuring a persistent header bell with unread counter, slide-out frosted glass drawer, and floating interactive toasts with 1-tap action buttons; enforces a 4-tier severity model (`[Critical, Warning, Success, Info]`) with selective subtle UI audio chimes on HMI Kiosk for Critical/Warning and silent execution for Success/Info; concurrent with outbound Telegram alerts.

## Non-goals (Phase 1) [SPEC]

Per-zone valve control, continuous multi-pass closed-loop dosing or PID tuning, multi-greenhouse support, crop or plant management, environmental monitoring, native mobile app, e-commerce, AI/ML predictive dosing, automated pipe priming (machinery constraint).

## Success metrics [PROPOSED]

1. Zero batches distributed outside the recipe TDS gate band [Target ± 50 ppm] (1200–1300 ppm for the default recipe).
2. Emergency Stop cutoff latency: hardware NC trip de-energizes relays immediately; software E-stop executes relay cutoff on ESP32 in < 100 ms.
3. Dry-run cutoff protection: Distribution pump shutoff triggered immediately upon radar frame reading level < 6.0 L while pump is commanded active (debounced over 2 frames, response ≤ 200 ms, D-048), safely backed by the 5.0 L bottom suction sump buffer to prevent pump cavitation.
4. Zero double-dispatch on hardware commands (enforced via Pessimistic UI button disabling and unique `cmd_id`).
5. Zero critical event data loss during network outages (firmware ring buffer retains state transitions and faults during LAN disconnects; offline alert queue flushes with 100% fidelity upon internet restoration).
6. Dashboard telemetry latency < 2 s over local LAN.
7. 100% of user and system commands recorded in backend audit log.
8. Primary HMI touchscreen kiosk (15.6" UPERFECT BE156PF) loads and functions 100% offline with zero external Internet dependencies.

## Operational assumptions and policies [SPEC]

1. **Unattended Batch Scheduling:** Scheduled batches trigger autonomously without mandatory operator presence, strictly guarded by the 7 firmware safety interlocks (Distribution Drum level ≤ 8.0 L, clean water baseline within 50–350 ppm, no active faults, and ESP32 online).
2. **Concentrate Drum (Drum 1) Sensing & Starvation Detection:** Concentrate Drum (Drum 1) has no hardware level sensor and is manually prepared (2 kg fertilizer dissolved in 20 L water). Liquid depletion is detected inferentially: the system calculates dosing based on empirical injection calibration (`DOSE_TEST_RESULT.md`). If the post-dosing TDS exhibits a significant negative anomaly (e.g., measuring ~1000 ppm instead of the expected ~1250 ppm, indicating partial or empty concentrate suction), the system triggers a warning alert prompting the operator to inspect Drum 1 for concentrate starvation.
3. **Gate Failure & Recovery Protocol:** If measured TDS is outside the [Target ± 50 ppm] gate band (1200–1300 ppm for the default recipe) after single-pass top-up recovery (or if initial TDS exceeds Target + 50 ppm), the distribution pump is locked OFF and `FAULT_PPM_OUT_OF_RANGE` is latched. Recovery requires physical drainage via the manual gravity drain valve to ≤ 8.0 L before the UI unlocks the "Reset Fault" button (Gated Fault Reset protocol).
