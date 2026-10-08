# 01 PRD

## Problem

Fertigation for the 980-point greenhouse is mixed and distributed by hand, so concentration varies between batches and nobody has a record of what was delivered. Desanomia automates batch preparation and distribution with a measured safety gate, and gives operators one place to monitor, command, and review batches. [SPEC]

## Physical system [SPEC]

- **Cultivation Layout:** 980 planting points across 6 elevated raised beds (B1–B6) organized into 2 administrative logical zones (Zone 1: B1–B3, Zone 2: B4–B6). Distribution delivers to all 6 beds simultaneously via a single distribution pump (zero per-zone manifold switching in Phase 1).
- **Tanks & Sensing:**
  - **Concentrate Drum (Drum 1):** 20 L fertilizer stock container (manually dissolved 2 kg fertilizer; unsensed).
  - **Distribution Drum (Drum 2):** 140 L mixed solution and fertigation reservoir equipped with an analog TDS/EC probe and an overhead 60 GHz FMCW radar level sensor (UART).
- **Actuators (4 Relays):** Clean Water Fill Solenoid Valve (AC 220V), Peristaltic Dosing Pump (DC 12V), Submersible Mixing Pump (AC 220V), and High-Pressure Distribution Pump (AC 220V).
- **Emergency Hardware:** Hardwired normally-closed (NC) twist-to-reset mushroom emergency stop switch cutting relay power directly.
- **Edge Hardware Stack:** On-site Beelink EQ12 Mini PC (Intel N100, 16GB RAM) running Docker Compose services, 15.6" control-room touchscreen kiosk operating 100% offline over LAN/HDMI, and an ESP32 WROOM-32 microcontroller executing FreeRTOS firmware.

## Users and roles [SPEC]

Admin: full access including user management. Operator: control batches, schedules, manual actuators. Viewer: read-only.

## Goals

1. Run a full batch (fill, dose, mix, stabilize, measure, gate, distribute, including single-pass top-up recovery if under-dosed) with one protected start action. [SPEC]
2. Never distribute a batch outside 1200 to 1300 ppm TDS (target 1250 ppm for a 140.0 L batch). [SPEC]
3. Show live process state, TDS, and Drum 2 level on the control-room screen without internet.
4. Keep a complete batch history: events, TDS trace, gate result, who started it.
5. Alert via Telegram on faults and gate failures.
6. Allow scheduled batches and manual actuator control within firmware interlocks.

## Functional requirements

FR-01 Start batch (Operator+, confirmation required). FR-02 Live FSM state across 12 states (IDLE, FILLING_WATER, CHECK_BASE, DOSING, MIXING, STABILIZING, MEASURING_TDS, GATE_EVALUATE, TOPUP_DOSING, RECOVERY_MIX_EVALUATE, DISTRIBUTING, BATCH_DEPLETED). FR-03 Live TDS with color-coded gauge. FR-04 Drum 2 level and volume. FR-05 Actuator status panel. FR-06 Batch event timeline. FR-07 Batch history table with detail view. FR-08 TDS history chart. FR-09 ESP32 connectivity indicator. FR-10 Reset Fault (Operator+, confirmation required, enforced by Gated Fault Reset protocol locked while Drum 2 level > 5.0 L). FR-11 Manual actuator control (Operator+, strictly subject to the 7 firmware safety interlocks; disabled during active batch FSM). FR-12 Schedule management. FR-13 Login with session auth. FR-14 User management (Admin only). FR-15 Telegram alerts. FR-16 Audit trail of every command. FR-17 Emergency Stop (Operator+, Dual E-Stop UX: instant 1-tap min 56×56 px without modal on local kiosk; confirmation dialog with aria-modal="true" on remote web; immediately de-energizes all 4 relays via ESP32 FAULT_ESTOP). FR-18 Concentrate Virtual Stock Tracking (Operator records initial refill of 20 L / 2 kg NPK fertilizer; system tracks remaining stock by deducting actual batch injection history after each distribution run; alerts operator when estimated remaining stock ≤ 2 batches). FR-19 Resume Fill Control (Operator+, available during FAULT_NO_WATER_SUPPLY or FAULT_FILL_TIMEOUT to re-open fill valve once water supply is restored without aborting or draining the batch). FR-20 JIT Pre-Dispatch Sequence (Scheduler initiates preparation 20 min prior to target time; sends notification upon reaching BATCH_LOCKED & READY; if unconfirmed within 30 min, triggers greenhouse acoustic buzzer for 15 s followed by 60 s mixer re-homogenization before auto-distributing). FR-21 Local Panel Alarms (Firmware drives physical buzzer and red pilot lamp on panel box door for immediate acoustic and visual signaling upon any FAULT state transition, independent of network or server connectivity). FR-22 Offline Alert Store-and-Forward (Persistent queue in backend buffers critical Telegram alerts during internet outages and flushes them in chronological order with original event timestamps upon reconnection). UI items map to SPEC FE-01 to FE-18, see 12_UI_SPEC. [SPEC, FR numbering PROPOSED]

## Non-goals (Phase 1) [SPEC]

Per-zone valve control, continuous multi-pass closed-loop dosing or PID tuning, multi-greenhouse support, crop or plant management, environmental monitoring, native mobile app, e-commerce, AI/ML predictive dosing, automated pipe priming (machinery constraint).

## Success metrics [PROPOSED]

1. Zero batches distributed outside the 1200–1300 ppm TDS gate band.
2. Emergency Stop cutoff latency: hardware NC trip de-energizes relays immediately; software E-stop executes relay cutoff on ESP32 in < 100 ms.
3. Dry-run cutoff protection: Distribution pump shutoff triggered immediately upon radar frame reading level < 5.0 L (firmware execution < 50 ms after sensor frame ingestion; total physical response < 500 ms given UART update period), safely backed by the 5.0 L bottom suction sump buffer to prevent pump cavitation.
4. Zero double-dispatch on hardware commands (enforced via Pessimistic UI button disabling and unique `cmd_id`).
5. Zero critical event data loss during network outages (firmware ring buffer retains state transitions and faults during LAN disconnects; offline alert queue flushes with 100% fidelity upon internet restoration).
6. Dashboard telemetry latency < 2 s over local LAN.
7. 100% of user and system commands recorded in backend audit log.
8. Control-room touchscreen kiosk loads and functions 100% offline with zero external Internet dependencies.

## Operational assumptions and policies [SPEC]

1. **Unattended Batch Scheduling:** Scheduled batches trigger autonomously without mandatory operator presence, strictly guarded by the 7 firmware safety interlocks (Distribution Drum level ≤ 5.0 L, clean water baseline within 50–350 ppm, no active faults, and ESP32 online).
2. **Concentrate Drum (Drum 1) Sensing & Starvation Detection:** Concentrate Drum (Drum 1) has no hardware level sensor and is manually prepared (2 kg fertilizer dissolved in 20 L water). Liquid depletion is detected inferentially: the system calculates dosing based on empirical injection calibration (`DOSE_TEST_RESULT.md`). If the post-dosing TDS exhibits a significant negative anomaly (e.g., measuring ~1000 ppm instead of the expected ~1250 ppm, indicating partial or empty concentrate suction), the system triggers a warning alert prompting the operator to inspect Drum 1 for concentrate starvation.
3. **Gate Failure & Recovery Protocol:** If measured TDS is outside the 1200–1300 ppm window after single-pass top-up recovery (or if initial TDS exceeds 1300 ppm), the distribution pump is locked OFF and `FAULT_PPM_OUT_OF_RANGE` is latched. Recovery requires physical drainage via the manual gravity drain valve to ≤ 5.0 L before the UI unlocks the "Reset Fault" button (Gated Fault Reset protocol).
