# 00 Master Rules

Entry point for every agent session on Desanomia. Read this file, `05_ARCHITECTURE.md`, and `18_DECISIONS.md` at every session start, then read only the domain files your specific task touches.

Tags used across `brain/`:
- `[SPEC]`: Empirical constants and core parameters verified against greenhouse field test data.
- `[PROPOSED]`: Architecture or implementation pattern drafted in `brain/`, awaiting live hardware validation.
- `[VERIFY]`: Inferred from context, requires empirical verification before being marked frozen.

---

## 1. Project

Desanomia is a precision web application and IoT edge control system for a semi-automatic greenhouse fertigation system (Greenhouse Utama / DESANOMI) serving **980 planting points** across **6 raised beds (B1–B6)**.

The edge stack runs on an on-site **Beelink EQ12 Mini PC (Intel N100)** hosting Docker Compose services:
- **Broker:** Eclipse Mosquitto (MQTT)
- **Backend:** FastAPI (Python 3.12, async, aiomqtt, WebSockets)
- **Database:** PostgreSQL (with SQLAlchemy 2.0 & Alembic)
- **Frontend Dashboard:** React + Vite + TypeScript + Tailwind CSS (served as a static offline bundle via Nginx)
- **Microcontroller:** ESP32-S3 N16R8 running FreeRTOS firmware, autonomously executing the batch FSM and local safety interlocks.

**Phase 1 Scope:** Automated batch fertigation only. Environmental monitoring, crop tracking, and complex greenhouse automation are explicitly out of scope.

---

## 2. Read Order

1. **Mandatory at session start:**
   - [00_MASTER_RULES.md](file:///home/maria_zahra/Documents/projects/greenhouse/desanomia/brain/00_MASTER_RULES.md) (system rules and invariants)
   - [05_ARCHITECTURE.md](file:///home/maria_zahra/Documents/projects/greenhouse/desanomia/brain/05_ARCHITECTURE.md) (system boundaries and component integration)
   - [18_DECISIONS.md](file:///home/maria_zahra/Documents/projects/greenhouse/desanomia/brain/18_DECISIONS.md) (architectural decisions and trade-offs)
2. **On-demand by task domain:**
   - **Data & Telemetry:** [06_DATA_MODEL.md](file:///home/maria_zahra/Documents/projects/greenhouse/desanomia/brain/06_DATA_MODEL.md), [07_DATA_SOURCES.md](file:///home/maria_zahra/Documents/projects/greenhouse/desanomia/brain/07_DATA_SOURCES.md)
   - **Backend API:** [11_API_CONTRACT.md](file:///home/maria_zahra/Documents/projects/greenhouse/desanomia/brain/11_API_CONTRACT.md)
   - **Firmware (ESP32):** [10_FIRMWARE_SPEC.md](file:///home/maria_zahra/Documents/projects/greenhouse/desanomia/brain/10_FIRMWARE_SPEC.md)
   - **Frontend UI/UX:** [02_APPFLOW.md](file:///home/maria_zahra/Documents/projects/greenhouse/desanomia/brain/02_APPFLOW.md), [03_UI_UX_BRIEF.md](file:///home/maria_zahra/Documents/projects/greenhouse/desanomia/brain/03_UI_UX_BRIEF.md), [12_UI_SPEC.md](file:///home/maria_zahra/Documents/projects/greenhouse/desanomia/brain/12_UI_SPEC.md)
   - **Safety, Auth & Errors:** [08_SECURITY.md](file:///home/maria_zahra/Documents/projects/greenhouse/desanomia/brain/08_SECURITY.md), [09_ERROR_HANDLING.md](file:///home/maria_zahra/Documents/projects/greenhouse/desanomia/brain/09_ERROR_HANDLING.md), [13_TESTING.md](file:///home/maria_zahra/Documents/projects/greenhouse/desanomia/brain/13_TESTING.md)
   - **DevOps, Deployment & Operations:** [14_GITHUB_ACTIONS.md](file:///home/maria_zahra/Documents/projects/greenhouse/desanomia/brain/14_GITHUB_ACTIONS.md), [15_DEPLOYMENT.md](file:///home/maria_zahra/Documents/projects/greenhouse/desanomia/brain/15_DEPLOYMENT.md), [16_PRODUCTION_CHECKLIST.md](file:///home/maria_zahra/Documents/projects/greenhouse/desanomia/brain/16_PRODUCTION_CHECKLIST.md)
   - **Task Selection & Logging:** [17_MICROTASKS.md](file:///home/maria_zahra/Documents/projects/greenhouse/desanomia/brain/17_MICROTASKS.md), [18_DECISIONS.md](file:///home/maria_zahra/Documents/projects/greenhouse/desanomia/brain/18_DECISIONS.md), [19_CHANGELOG.md](file:///home/maria_zahra/Documents/projects/greenhouse/desanomia/brain/19_CHANGELOG.md), [20_GLOSSARY.md](file:///home/maria_zahra/Documents/projects/greenhouse/desanomia/brain/20_GLOSSARY.md)

---

## 3. Hard Rules

1. **`brain/` is the Single Source of Truth:** All project requirements, specifications, and architecture live inside `brain/`. External documents (e.g. `docs/`) serve purely as historical inputs and references. If an invariant changes, it must be updated in `brain/` and logged in [18_DECISIONS.md](file:///home/maria_zahra/Documents/projects/greenhouse/desanomia/brain/18_DECISIONS.md).
2. **Seven Firmware-Enforced Safety Interlocks:** Safety interlocks run autonomously on the ESP32 firmware and cannot be bypassed in AUTO or MANUAL mode. Backend, network, and UI must never reimplement, relax, or offer an override for these interlocks:
   1. *TDS Gate:* Distribution pump locked OFF if mean TDS is outside `[TDS_target − 50 ppm, TDS_target + 50 ppm]` (`FAULT_PPM_OUT_OF_RANGE`). For the default Generatif recipe (target 1250 ppm) this evaluates to 1200–1300 ppm; for Vegetatif (1100 ppm) it is 1050–1150 ppm; for Panen (1050 ppm) it is 1000–1100 ppm.
   2. *Radar Dry-Run Cutoff:* Distribution pump instantly shut off if Drum 2 level $< 6.0\text{ L}$ while commanded active (debounced over 2 frames, $\le 200\text{ ms}$) (`FAULT_DRY_RUN`). Normal distribution completes cleanly when level reaches $\le 8.0\text{ L}$ (`BATCH_DEPLETED`).
   3. *Batch Depletion Guard:* New batch command rejected if Drum 2 level $> 8.0\text{ L}$ (`FAULT_BATCH_REJECTED`).
   4. *Dual-Stage Fill Guard:* Solenoid closed if early rise < 1.0 L in 90 s (`FAULT_NO_WATER_SUPPLY`) or total fill > 20 min (`FAULT_FILL_TIMEOUT`).
   5. *Water Baseline & Plausibility:* Batch aborted if clean water TDS < 50 ppm (sensor disconnected) or > 2000 ppm (shorted/saturated), or baseline >= 350 ppm (`FAULT_TDS_INVALID` / `FAULT_BASE_TDS_HIGH`).
   6. *Radar Liveness Watchdog:* Actuators shut off if UART communication silent > 3 s (`FAULT_RADAR_OFFLINE`). Latched fault; de-latched via `RESET_FAULT` once valid frames resume stably for $\ge 3.0\text{ s}$ without requiring tank drain (`D-048`).
   7. *Emergency Stop Guard:* All relays de-energized immediately on hardware E-stop button trip or software E-stop trigger (`FAULT_ESTOP`). Mechanical coil cut in 0 ms; `emergency_stop_isr` forces GPIO pins HIGH in $< 1\text{ }\mu\text{s}$ (`IRAM_ATTR`). Tiered reset permits operator to choose 'Re-verify TDS & Resume' or 'Abort & Drain' to $\le 8.0\text{ L}$ (`D-019`, `D-048`).
3. **Semi-Closed Loop Dosing with One-Way TDS Gate:** Dosing follows open-loop feedforward calculation. If the post-mixing mean TDS reads in `[TDS_target − 250 ppm, TDS_target − 50 ppm)`, exactly **one single-pass top-up recovery** is permitted (calculated deficit capped at **300 mL maximum**). If mean TDS is `< TDS_target − 250 ppm`, `STARVATION_SUSPECTED` is raised instead of a top-up. After top-up dosing, the system re-mixes (120 s), settles (15 s), and re-evaluates. If TDS remains outside `[TDS_target − 50 ppm, TDS_target + 50 ppm]` or if initial TDS exceeds `TDS_target + 50 ppm`, distribution is locked OFF and a latched fault is declared. Continuous closed-loop hunting, PID control, or multiple top-up iterations are strictly forbidden.
4. **Target TDS and Gate Band:** Default Target TDS is **1250 ppm** (Generatif) with a dynamic gate band of `[Target − 50 ppm, Target + 50 ppm]` (**1200 to 1300 ppm** for the default recipe) for a standard **140.0 L** clean water batch in Distribution Drum (Drum 2). Parameters must be loaded from a single unified configuration source—never hardcoded across multiple files.
5. **Simultaneous Distribution:** Distribution pumps directly to all 6 beds (B1–B6, 980 drippers) simultaneously through a single distribution pump. Per-zone valve logic and manifold switching are prohibited in Phase 1.
6. **Strict Non-Goals for Phase 1:** The following remain strictly unbuilt:
   - Per-zone valve controls / manifold switching.
   - Continuous multi-pass closed-loop dosing or PID tuning.
   - Multi-greenhouse tenancy.
   - Crop / plant management (varieties, schedules, harvesting).
   - Environmental monitoring (temperature, humidity, light, soil sensors, external weather APIs).
   - Native mobile applications (iOS/Android).
   - E-commerce or harvest inventory.
   - AI/ML predictive dosing.
7. **Control-Room Kiosk & Offline Resilience:** The primary operator terminal operates 100% locally on the Beelink EQ12 Mini PC via HDMI and local LAN without internet dependency.
   - Frontend bundle must be completely offline-capable (Vite static build served locally; no CDNs, remote Google fonts, or external runtime requests).
   - *Dual E-Stop UX:* Local Kiosk provides an instant 1-tap emergency stop button (min 56 × 56 px) with zero confirmation modal. Remote/mobile web views enforce a confirmation dialog (`aria-modal="true"`) to prevent accidental triggering. A physical NC twist-to-reset mushroom button provides independent hardware failsafe.
   - *Pessimistic UI:* Zero double-dispatch. Hardware mutation buttons disable immediately upon click until status is acknowledged.
   - *Gated Fault Reset:* The `Reset Fault` button is disabled in the UI while radar reads Drum 2 level $> 8.0\text{ L}$ for chemical contamination faults (`IL-01`). Draining failed batches must occur exclusively via the manual gravity drain valve directly to the waste ditch.
8. **No Invention of Safety or Control Logic:** Never invent interlock parameters, FSM states/transitions, or dosing conversion formulas. If a requirement is unclear or absent, halt and resolve it through deliberate engineering decisions.
9. **Language & Canonical Nomenclature:**
   - Technical artifacts, code, schemas, comments, and commit messages must be in English.
   - Operator UI labels follow standard Indonesian greenhouse operational terminology (e.g. `Mulai Batch`, `Reset Fault`, `Darurat`).
   - Standard hardware naming: **Concentrate Drum (Drum 1)** for the 20 L fertilizer stock container, and **Distribution Drum (Drum 2)** for the 140 L mixing and irrigation tank.
10. **Zero Secrets in Source Control:** No passwords, MQTT credentials, or API keys committed to git. All credentials managed via `.env` files (ignored by `.gitignore`) and CI secrets.

---

## 4. Workflow

- Work strictly on one microtask at a time selected from [17_MICROTASKS.md](file:///home/maria_zahra/Documents/projects/greenhouse/desanomia/brain/17_MICROTASKS.md).
- Follow Test-Driven Development (TDD): write the failing test first for FSM transitions, safety gates, authentication, and command handling.
- Record any significant design trade-offs in [18_DECISIONS.md](file:///home/maria_zahra/Documents/projects/greenhouse/desanomia/brain/18_DECISIONS.md).
- Maintain [20_GLOSSARY.md](file:///home/maria_zahra/Documents/projects/greenhouse/desanomia/brain/20_GLOSSARY.md) whenever new domain terms or hardware boundaries are established.

---

## 5. Definition of Done

A task is complete only when:
1. All acceptance criteria in [17_MICROTASKS.md](file:///home/maria_zahra/Documents/projects/greenhouse/desanomia/brain/17_MICROTASKS.md) are satisfied.
2. All unit and integration tests are green.
3. Linting and type checks pass with zero warnings or errors.
4. No unresolved `[VERIFY]` tags remain in touched files without an explicit entry in [18_DECISIONS.md](file:///home/maria_zahra/Documents/projects/greenhouse/desanomia/brain/18_DECISIONS.md).
5. None of the 7 firmware-enforced safety interlocks are weakened or bypassed.
6. [19_CHANGELOG.md](file:///home/maria_zahra/Documents/projects/greenhouse/desanomia/brain/19_CHANGELOG.md) is updated with the changes made.
