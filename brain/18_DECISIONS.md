# 18 Decisions

Log every design choice. Status: Accepted (authoritative, verified against project invariants), Proposed (drafted in `brain/`, awaiting hardware validation), Open (needs an answer). Do not change an Accepted decision without explicit justification and updating affected files.

## Accepted

- **D-001 (Dosing Architecture):** Semi-closed loop dosing. Initial open-loop feedforward dose based on calibrated volume-to-time formula ($V_{mL} \times 0.107\text{ s/mL}$). If mean TDS < 1200 ppm after mixing (120 s) and settling (15 s), execute exactly one single-pass top-up recovery (capped at 300 mL max). If still outside 1200–1300 ppm or if initial TDS > 1300 ppm, latch `FAULT_PPM_OUT_OF_RANGE` and lock distribution pump OFF. Reason: Eliminates chemical hunting and overdosing risk while recovering minor concentration deficits.
- **D-002 (Target TDS & Gate Band):** Target TDS is 1250 ppm with an inclusive gate band of 1200 to 1300 ppm for a 140.0 L batch in Distribution Drum (Drum 2). (Supersedes earlier 600 ppm recipe draft). Reason: Grounded in greenhouse field test standards and `DOSE_TEST_RESULT.md`.
- **D-003 (Safety Interlocks):** Seven firmware-enforced safety interlocks locally on ESP32 (TDS Gate, Dry-Run Cutoff, Batch Depletion, Dual-Stage Fill Guard, Water Baseline & Plausibility, Radar Liveness Watchdog, Emergency Stop Guard). Zero bypass in AUTO or MANUAL mode. Reason: Hardware safety must not depend on network, backend, or UI availability.
- **D-004 (Distribution Topology):** Single distribution pump feeding all 6 beds (B1–B6, 980 dripper points) simultaneously; no per-zone solenoid valves or manifold switching in Phase 1. Reason: Hydraulic stability, pressure consistency, and simplified mechanical failure envelope.
- **D-005 (Edge Platform & Technology Stack):** Edge host is an on-site Beelink EQ12 Mini PC (Intel N100) running Docker Compose: FastAPI backend (Python 3.12, async, aiomqtt, WebSockets), PostgreSQL (SQLAlchemy 2.0 + Alembic), Eclipse Mosquitto MQTT broker, and React + Vite + TypeScript dashboard served as an offline static bundle via Nginx. Microcontroller is ESP32 WROOM-32 with FreeRTOS. (Onlook, Next.js, and PocketBase are explicitly discarded).
- **D-006 (Authentication & Roles):** Session-based username and password authentication with roles: Admin, Operator, Viewer.
- **D-007 (Network Topology & Remote Access):** Local greenhouse LAN for operations; remote operator access via Tailscale mesh VPN; critical operational alerts dispatched via Telegram Bot.
- **D-008 (Scope & Non-Goals):** Phase 1 scope is strictly limited to automated batch fertigation. Non-goals (environmental sensors, plant tracking, native mobile apps, AI predictive dosing) remain strictly unbuilt.
- **D-022 (Concentrate Stock Level & Starvation Detection):** Concentrate Drum (Drum 1) has no hardware level sensor. Stock depletion is detected inferentially based on empirical dosing calibration (`DOSE_TEST_RESULT.md`): if post-dosing TDS exhibits a significant negative anomaly (e.g. measuring ~1000 ppm instead of expected ~1250 ppm), the system flags an immediate warning/alert for operator inspection to check if Drum 1 is dry/starved.
- **D-024 (Batch Scheduling Execution):** Scheduled batches execute unattended without requiring operator presence, strictly guarded by the 7 autonomous firmware safety interlocks (Drum 2 empty ≤ 5.0 L, baseline water valid, no latched faults, ESP32 online).
- **D-034 (Drum Nomenclature):** Standardized English canonical terms: **Concentrate Drum (Drum 1)** for the 20 L fertilizer stock container, and **Distribution Drum (Drum 2)** for the 140 L mixing and irrigation tank. UI labels use clear Indonesian equivalents.
- **D-035 (Single Source of Truth):** `brain/` is the sole authoritative repository for project requirements, architecture, and specifications. Documents under `docs/` serve as historical reference inputs and are progressively aligned into `brain/`.

## Proposed

- **D-010 (FSM Execution Authority):** FSM executes autonomously on ESP32 firmware; backend mirrors state via MQTT telemetry. Reason: Batch execution survives edge server reboot or network dropouts.
- **D-011 (Fault Representation):** Fault is a latched status flag accompanied by dedicated fault codes, not a destructive state wipe. FSM requires explicit manual or gated reset.
- **D-012 (Gate Failure Outcome):** Gate failure locks distribution pump OFF, halts batch progress, and alerts operator. Recovery requires manual gravity drain to <= 5.0 L before reset is unlocked.
- **D-013 (Power Interrupt Recovery):** On power loss mid-batch, system reboots to safe cold-boot inspection. If Drum 2 volume > 5.0 L, system prompts inspection/recovery rather than blind re-dosing.
- **D-014 (Offline Frontend Kiosk):** Frontend is built as a static offline bundle. Control room touchscreen operates directly via HDMI/LAN without external CDN or web dependencies.
- **D-015 (Command Idempotency):** Actuator and state-changing commands include unique `cmd_id` and are acknowledged via MQTT ack topics.
- **D-016 (Telemetry Retention):** Raw high-frequency telemetry stored for 90 days in PostgreSQL, rolled up into 1-minute aggregates for long-term historical analytics.
- **D-017 (MQTT Topic Hierarchy):** Standardized MQTT topic namespace under `desanomia/gh1/`.
- **D-018 (Firmware Tooling):** PlatformIO for ESP32 firmware development, C++ with FreeRTOS tasks.
- **D-019 (Emergency Stop UI/UX):** Dual E-stop design: instant 1-tap button (min 56 × 56 px) on local kiosk touchscreen; confirmation modal (`aria-modal="true"`) on remote web clients to prevent accidental triggers. Hardwired NC mushroom button provides independent mechanical trip.
- **D-028 (User Provisioning):** Admin creates accounts; initial admin seeded via backend CLI with forced initial password reset.
- **D-029 (UI Theme & Aesthetics):** Industrial cockpit theme optimized for greenhouse control room lighting (high contrast, tabular figures, no heavy animation or particle slop).
- **D-030 (Manual Actuator Gating):** Manual actuator testing controls are disabled during active batch FSM execution.

## Open

- **D-020 (Time Synchronization):** Edge hardware RTC synchronization strategy when local network lacks external internet access (local RTC module vs GPS/cellular fallback).
- **D-026 (Auth Session Lifespan):** Precise session idle timeout and absolute expiry limits for control room kiosk vs remote mobile sessions.
- **D-027 (Firmware Security):** Flash encryption and secure boot requirements prior to production deployment.
