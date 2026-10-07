# 01 PRD

## Problem

Fertigation for the 980-point greenhouse is mixed and distributed by hand, so concentration varies between batches and nobody has a record of what was delivered. Desanomia automates batch preparation and distribution with a measured safety gate, and gives operators one place to monitor, command, and review batches. [SPEC]

## Physical system [SPEC]

980 planting points across 6 raised beds (B1 to B6) in 2 logical zones. One pump distributes to all beds simultaneously. Drum 1: 20 L, manually prepared fertilizer concentrate. Drum 2: 140 L mixed solution with a TDS/EC sensor and a radar level sensor.

## Users and roles [SPEC]

Admin: full access including user management. Operator: control batches, schedules, manual actuators. Viewer: read-only.

## Goals

1. Run a full batch (fill, dose, mix, stabilize, measure, gate, distribute) with one protected start action.
2. Never distribute a batch outside 550 to 650 ppm TDS (target 600).
3. Show live process state, TDS, and Drum 2 level on the control-room screen without internet.
4. Keep a complete batch history: events, TDS trace, gate result, who started it.
5. Alert via Telegram on faults and gate failures.
6. Allow scheduled batches and manual actuator control within firmware interlocks.

## Functional requirements

FR-01 Start batch (Operator+, confirmation required). FR-02 Live FSM state across 10 states. FR-03 Live TDS with color-coded gauge. FR-04 Drum 2 level and volume. FR-05 Actuator status panel. FR-06 Batch event timeline. FR-07 Batch history table with detail view. FR-08 TDS history chart. FR-09 ESP32 connectivity indicator. FR-10 Reset Fault (Operator+, confirmation required). FR-11 Manual actuator control (Operator+, still subject to interlocks). FR-12 Schedule management. FR-13 Login with session auth. FR-14 User management (Admin only). FR-15 Telegram alerts. FR-16 Audit trail of every command. UI items map to SPEC FE-01 to FE-14, see 12_UI_SPEC. [SPEC, FR numbering PROPOSED]

## Non-goals (Phase 1) [SPEC]

Per-zone valve control, closed-loop feedback dosing, multi-greenhouse support, crop or plant management, environmental monitoring, native mobile app, e-commerce, AI/ML predictive dosing.

## Success metrics [PROPOSED]

Zero batches distributed outside the gate band. Dashboard state lag under 2 s on LAN. 100% of commands appear in audit log. Control-room screen loads with no external network.

## Assumptions and open questions

Scheduled batches start unattended (confirm). Fertilizer concentrate in Drum 1 is refilled manually and not sensed (confirm whether Drum 1 has a level sensor). Behavior when a gate fails: batch halts and raises a fault, no re-dose (consistent with one-way gate, confirm exact outcome in SPEC).
