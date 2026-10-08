# Desanomia Fertigation System

Precision IoT-driven automated fertigation and edge monitoring system for Greenhouse Utama (980 planting points across 6 raised beds).

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

