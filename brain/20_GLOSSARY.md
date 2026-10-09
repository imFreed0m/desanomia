# Desanomia Fertigation System

Precision IoT-driven automated fertigation and edge monitoring system for DESANOMIA Greenhouse.

## Hardware & Containment

**Concentrate Drum (Drum 1)**:
The 20-liter fertilizer stock tank holding concentrated liquid nutrient solution.
_Avoid_: Drum pekat, Jerigen stok, Stock container

**Distribution Drum (Drum 2)**:
The 140-liter mixing and holding reservoir where clean water and concentrate are mixed, evaluated, and pumped to crops.
_Avoid_: Drum nutrisi, Tandon air, Mixing drum, Reservoir

**Raised Bed**:
One of six physical elevated cultivation beds (B1–B6) containing a collective total of 980 dripper points.
_Avoid_: Bedeng, Zone, Plot

## Operational Processes & Control

**Batch**:
A complete single-cycle execution of water filling, concentrate dosing, submersible mixing, quality verification, and crop distribution.
_Avoid_: Run, Cycle, Dosing job

**Safety Interlock**:
A firmware-enforced physical hardware safeguard executed autonomously on the ESP32 that prevents actuator operation during unsafe physical conditions.
_Avoid_: Software guard, Interlock flag, UI lock

**TDS Gate**:
A strict one-way quality validation threshold (1200–1300 ppm) that must be satisfied before the distribution pump is permitted to energize.
_Avoid_: PPM check, EC filter, Quality loop

**Single-Pass Top-Up Recovery**:
An automated single-attempt corrective addition of concentrate (capped at 300 mL) triggered only when post-mix solution tests below 1200 ppm.
_Avoid_: Closed-loop auto-dosing, Iterative top-up, Continuous PID dosing

**Gated Fault Reset**:
A safety mechanism requiring the operator to manually drain contaminated or out-of-spec solution to 5.0 liters or less via gravity before the system allows clearing a fault.
_Avoid_: Force reset, UI override, Clear error

**Pessimistic UI**:
An interaction design pattern where actuator mutation buttons immediately disable and display a pending state upon click until confirmed by hardware telemetry.
_Avoid_: Optimistic UI, Double-click action

**Concentrate Starvation Detection**:
An inferential monitoring mechanism where the system detects depletion of Concentrate Drum (Drum 1) based on a significant negative deviation in post-dosing TDS response relative to calibrated peristaltic pump injection parameters, triggering an immediate operator inspection alert.
_Avoid_: Electronic float sensing, Dry run level check, Direct Drum 1 sensing

**Refill Confirmation Gate**:
A mandatory operator acknowledgment action required in the web app following replenishment of Concentrate Drum (Drum 1) that resets the virtual inventory counter to 20.0 liters and unlatches batch execution.
_Avoid_: Stock reset, Refill button, Inventory override

**Modular Drum Animation Indicator**:
A fluid graphic element representing real-time liquid level and operating health solely through organic visual states (waves, color shifts, pulsation) without in-app text alert banners.
_Avoid_: Liquid progress bar, Animated tank gauge, Alert banner

**Pause Mode (Mid-Batch Recovery)**:
An un-energized safe holding state entered upon power restoration when liquid remains in Distribution Drum (Drum 2), presenting an intrusive full-screen modal showing real-time volume, current PPM, and dynamically calculated deficit concentrate (mL) required to resume dosing without draining the batch.
_Avoid_: Power abort, Auto-drain hold, Blind restart

**Guided Sensor Calibration Wizard**:
A step-by-step interactive maintenance procedure on the dashboard requiring physical tank drainage verification (≤ 5.0 L in Drum 2) before detaching analog sensors (DFRobot Gravity TDS probe) for 2-point immersion calibration (1413 µS/cm buffer) and greenhouse raw water baseline subtraction, committing calibrated slope/offset directly to ESP32 NVS.
_Avoid_: Software-only offset, Live calibration, Blind zeroing

**Named Recipe Preset Library**:
A centrally managed collection of crop-growth phase target recipes (e.g. Vegetatif, Generatif, Panen) that operators can select, customize, or default for automated schedules and manual batches, with immutable preset snapshots saved to batch history for long-term agricultural traceability.
_Avoid_: Static formula, Fixed target, Hardcoded EC

**Unified Schedule-First Pipeline**:
An architectural model where all batch operations (both automated and ad-hoc) originate from operator configuration and execute via a single unified scheduling engine. An ad-hoc run is simply an immediate schedule item (`schedule_at = NOW`) that, upon passing the TDS quality gate, distributes automatically to crops without requiring a second manual confirmation.
_Avoid_: Split-brain runner, Rogue manual run, Bypass command

**Dynamic Baseline Reference**:
The operational rule where executing an ad-hoc batch ('Now') earlier than a planned schedule cancels that day's conflicting schedule to avoid over-fertigation, and dynamically establishes the ad-hoc batch timestamp as the new baseline reference for the subsequent recurrence interval.
_Avoid_: Hardcoded timer, Static recurrence, Fixed-clock reset

**Hard Confirmation Gate**:
A high-friction, screen-locking safety modal designed to enforce the agronomic daily fertigation limit. Triggered whenever an operator attempts an ad-hoc distribution on a day where a distribution cycle already occurred, requiring explicit acknowledgment of root-rot and EC salt shock risks before allowing an override.
_Avoid_: Simple alert, Ignored warning, Soft confirm

**Multi-Tank 5-Pair Architecture**:
The system roadmap and UI framework accommodating 5 Concentrate Drums (K1–K5, 20 L) and 5 Distribution Drums (D1–D5, 140 L). In Phase 1, Pair 1 is physically plumbed and operational, while Pairs 2–5 are displayed on the Dashboard with clear 'Standby / Belum Terpasang' statuses.
_Avoid_: Single-tank hardcoding, Blind multi-tank expansion

**Zero-Conflict Hydraulic Invariant**:
The physical and scheduling rule that prevents more than one distribution tank from irrigating on the same day or overlapping time slot, necessitated by a shared high-pressure pump and unified main delivery manifold across the greenhouse beds.
_Avoid_: Parallel irrigation, Overlapping schedule, Simultaneous manifold pump

**In-App Notification Hub**:
An Apple-style glassmorphic UI system pairing a persistent header notification bell (with unread badge counter), a slide-out frosted drawer with categorized history, and floating interactive toasts equipped with 1-tap action buttons (`[Lihat Detail]`, `[Konfirmasi Refill]`). Enforces a 4-tier severity model with selective subtle UI audio chimes on the HMI Kiosk (gentle glass ping for warnings, double chime for critical faults/E-stop; silent for success/info).
_Avoid_: No-alert policy, Intrusive full banner, Silent fault suppression

**Pipeline Stepper Component**:
A minimalist horizontal visual stepper positioned above the active tank card rendering the 12 FSM lifecycle steps, glowing active node, completed ticks, and live step countdown/count-up timers.
_Avoid_: Hidden step, Blind progress, Monospace log only

**Fluid Surface Physics Indicator**:
The dynamic SVG/Canvas liquid simulation inside the drum visualizer that visually encodes physical state dynamics (rising wave for FILLING, rotational vortex for MIXING, mirror calm for STABILIZING, probe neon glow for MEASURING, draining outflow for DISTRIBUTING, red hazard pulse for FAULT, and amber deficit wave for PAUSED_INSPECTION).
_Avoid_: Static flat bar, Unchanging tank graphic


