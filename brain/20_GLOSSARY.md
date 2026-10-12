# 20 Glossary

Canonical domain terminology, technical definitions, and forbidden aliases for the DESANOMIA precision greenhouse automated fertigation and edge monitoring system. Governed by [`brain/00_MASTER_RULES.md`](file:///home/maria_zahra/Documents/projects/greenhouse/desanomia/brain/00_MASTER_RULES.md) and [`brain/18_DECISIONS.md`](file:///home/maria_zahra/Documents/projects/greenhouse/desanomia/brain/18_DECISIONS.md).

---

## 1. Hardware, Containment & Sensing

**Concentrate Drum (Drum 1)**:
The 20-liter blue HDPE stock tank holding concentrated liquid fertilizer solution (A+B premix). It has no electronic level sensor; stock level is tracked inferentially in software with low-stock warnings at $\le 3000\text{ mL}$.
_Avoid_: Drum pekat, Jerigen stok, Stock container, Fertilizer bucket

**Distribution Drum (Drum 2)**:
The 140-liter cylindrical HDPE mixing and holding reservoir where clean municipal/well water and concentrate are mixed via a submersible circulation pump, evaluated against the TDS Gate, and pumped to crops. Features a 5.0 L mechanical unpumpable sump volume.
_Avoid_: Drum nutrisi, Tandon air, Mixing drum, Reservoir, Water tank

**Raised Bed (B1–B6)**:
One of six physical elevated cultivation beds containing 980 total pressure-compensating emitter dripper points (163–164 drippers per bed). All six beds are irrigated simultaneously in Phase 1 by a single 0.5 HP distribution pump.
_Avoid_: Bedeng, Zone, Plot, Field, Section

**Dual-Circuit E-Stop Switch**:
A heavy-duty industrial red twist-release mushroom pushbutton featuring two mechanically linked, independent contact blocks: (1) Normally Closed (NC) physical circuit wired in series with the AC coil power bus to instantly sever all actuator relay coil power in 0 ms, and (2) secondary dry contact tapped to ESP32-S3 GPIO 21 with a hardware debounced interrupt streaming live `hw_estop_pressed: true` telemetry.
_Avoid_: Soft E-stop, Single switch, UI-only abort, Software halt button

**Analog TDS Signal Conditioning Chain**:
The complete sensory pipeline measuring Total Dissolved Solids: DFRobot Gravity Analog EC/TDS probe immersed in Drum 2, conditioned via active analog front-end board to ESP32-S3 ADC1_CH0 (GPIO 1), sampled at 10 Hz, filtered through a 10-sample moving trimmed median filter, and temperature-compensated to 27.0°C baseline ($T_{\text{comp}} = 1.04$).
_Avoid_: Raw EC reader, Blind ADC probe, Uncompensated PPM meter

**60 GHz FMCW Radar Level Sensor**:
The non-contact millimeter-wave radar sensor (HLK-LD2410 or equivalent) mounted at the top aperture of Distribution Drum (Drum 2), streaming binary distance frames over UART1 (GPIO 17/18 @ 115200 bps) at 10 Hz to calculate real-time fluid volume with a 5.0 L deadband sump offset and supervised by a 3.0-second silence watchdog (`FAULT_RADAR_OFFLINE`).
_Avoid_: Ultrasonic sensor, Float switch, Mechanical dipstick, Optical level gauge

---

## 2. Operational Processes & Agronomic Control

**Batch**:
A complete single-cycle execution of water filling, concentrate dosing, submersible mixing, quality verification, and crop distribution governed by the 12-state FSM.
_Avoid_: Run, Cycle, Dosing job, Irrigation session

**Safety Interlock**:
A firmware-enforced physical hardware safeguard executed autonomously on ESP32-S3 Core 1 that immediately de-energizes all actuator relays upon detecting unsafe physical conditions (`IL-01` to `IL-07`). Operates with zero bypass in both AUTO and MANUAL modes.
_Avoid_: Software guard, Interlock flag, UI lock, Backend check

**TDS Gate**:
A strict one-way quality validation threshold enforcing that post-mix fluid TDS falls within the inclusive dynamic gate band $[\text{Target} - 50\text{ ppm},\ \text{Target} + 50\text{ ppm}]$ (e.g. 1200–1300 ppm for default 1250 ppm Generatif recipe) before the distribution pump is permitted to energize.
_Avoid_: PPM check, EC filter, Quality loop, Dosing tolerance

**Single-Pass Top-Up Recovery**:
An automated single-attempt corrective addition of concentrate (capped at 300 mL max) triggered only when post-mix TDS falls in $[\text{Target} - 229.3\text{ ppm},\ \text{Target} - 50\text{ ppm})$ (derived from $300\text{ mL} \times 107.0 / 140.0\text{ L} \approx 229.3\text{ ppm}$, `D-051`). Followed by 60s mixing, 15s settling, and re-evaluation. If still out of band, the batch latches `FAULT_PPM_OUT_OF_RANGE`.
_Avoid_: Closed-loop auto-dosing, Iterative top-up, Continuous PID dosing, Multi-dose correction

**Concentrate Starvation Detection**:
An inferential monitoring mechanism where the system detects depletion of Concentrate Drum (Drum 1) when post-dosing TDS exhibits a significant negative deviation ($> 229.3\text{ ppm}$ deficit below target, e.g. $< 1020.7\text{ ppm}$ on a 1250 ppm target, exceeding the $300\text{ mL}$ top-up cap, `D-051`), raising `STARVATION_SUSPECTED` and aborting dosing without blind chemical hunting.
_Avoid_: Electronic float sensing, Dry run level check, Direct Drum 1 sensing

**Refill Confirmation Gate**:
A mandatory operator acknowledgment action required in the web app following physical replenishment of Concentrate Drum (Drum 1) that resets the virtual inventory counter to 20.0 liters and unlatches batch execution.
_Avoid_: Stock reset, Refill button, Inventory override, Stock zeroing

**Pause Mode (Mid-Batch Outage Recovery)**:
An un-energized safe holding state (`BATCH_PAUSED_INSPECTION`) entered upon microcontroller reboot when liquid remains in Distribution Drum (Drum 2) ($> 5.0\text{ L}$). Presents an intrusive screen-locking modal displaying volume, measured PPM, and dynamically calculated deficit concentrate ($V_{\text{deficit}} \le 300\text{ mL}$) required to resume dosing without draining the batch. Falls back to auto-resume after 30 minutes if interlocks pass.
_Avoid_: Power abort, Auto-drain hold, Blind restart, Cold flush

**Dynamic Baseline Reference**:
The operational scheduling rule where executing an ad-hoc batch ('Now') earlier than a planned schedule cancels that day's conflicting schedule to avoid over-fertigation, and dynamically establishes the ad-hoc batch execution timestamp as the new baseline reference for subsequent recurrence intervals.
_Avoid_: Hardcoded timer, Static recurrence, Fixed-clock reset, Rigid cron

**Hard Confirmation Gate**:
A high-friction, screen-locking safety modal designed to enforce the agronomic single-batch daily limit. Triggered whenever an operator attempts an ad-hoc distribution on a calendar day where a distribution cycle already occurred, requiring explicit 3-second button hold and acknowledgment of root asphyxiation and EC salt shock risks before allowing an override.
_Avoid_: Simple alert, Ignored warning, Soft confirm, Popup OK

**Named Recipe Preset Library**:
A centrally managed collection of crop-growth phase target recipes (e.g. Vegetatif: 1100 ppm, Generatif: 1250 ppm, Panen: 1050 ppm) that operators can select, customize, or default for automated schedules and manual batches, with immutable preset snapshots saved to batch history for long-term agricultural traceability.
_Avoid_: Static formula, Fixed target, Hardcoded EC, Raw PPM number

**Unified Schedule-First Pipeline**:
An architectural model where all batch operations (both automated and ad-hoc) originate from operator configuration and execute via a single unified scheduling engine. An ad-hoc run is registered as an immediate schedule item (`schedule_at = NOW`) that, upon passing the TDS quality gate, distributes automatically to crops without requiring a second manual confirmation.
_Avoid_: Split-brain runner, Rogue manual run, Bypass command, Two-step batch

**Zero-Conflict Hydraulic Invariant**:
The physical and scheduling rule that prevents more than one distribution tank from irrigating on the same day or overlapping time slot, necessitated by a shared 0.5 HP high-pressure pump and unified main delivery manifold across the greenhouse beds.
_Avoid_: Parallel irrigation, Overlapping schedule, Simultaneous manifold pump

**Multi-Tank 5-Pair Architecture**:
The system roadmap and UI framework accommodating 5 Concentrate Drums (K1–K5, 20 L each) and 5 Distribution Drums (D1–D5, 140 L each). In Phase 1, Pair 1 is physically plumbed and operational, while Pairs 2–5 are displayed on the Dashboard with clear 'Standby / Belum Terpasang' badges.
_Avoid_: Single-tank hardcoding, Blind multi-tank expansion, Static twin-tank

**Two-Stage Hardware Commissioning Protocol**:
The mandatory pre-production acceptance sequence: Stage 1 Water-Only Commissioning (hydraulic leak check, radar depth calibration, pulse flow meter scaling, and dry-run pump cutoff verification at $\le 5.0\text{ L}$), followed by Stage 2 Supervised Nutrient Calibration (A+B stock priming, Generatif recipe execution, single-pass top-up verification, and handheld EC meter cross-check) before starting a 7-day supervised pilot.
_Avoid_: Direct live chemical startup, Blind automated trial, Unchecked fertilizer test

---

## 3. Embedded Firmware & Real-Time Architecture

**Quad-Channel Memory**:
The architectural memory-caching and context-retrieval protocol utilized by autonomous agents in DESANOMIA to maintain multi-tier operational context (comprising semantic memory retrieval, AST callgraphs, structural architecture graphs, and past agent session history).
_Avoid_: Tri-memory, TriMemory, Legacy memory stack, Flat session memory

**Asymmetric Dual-Core Allocation**:
The FreeRTOS CPU core pinning discipline on the ESP32-S3 N16R8: Core 1 (240 MHz) is dedicated strictly to deterministic real-time control (20 Hz FSM tick, 50 ms safety interlock matrix evaluation, and 10 Hz sensor conditioning); Core 0 (240 MHz) is dedicated to asynchronous I/O (W5500 SPI Ethernet, MQTT client, QoS 1 ACK handshakes, and 500-event Octal PSRAM ring buffer spooling).
_Avoid_: Symmetric multitasking, Unpinned tasks, Core-free FreeRTOS, Random affinity

**Zero-Heap Firmware Discipline**:
The strict embedded memory management invariant prohibiting dynamic heap allocation (`malloc`, `free`, `new`, `delete`) inside real-time control loops. All FreeRTOS tasks, event groups, and queues are allocated statically at compile time (`xTaskCreateStaticPinnedToCore`), and all serialization uses pre-allocated stack buffers.
_Avoid_: Dynamic heap, malloc in loop, Dynamic JSON sizing, Runtime task spawn

**12-State Fertigation FSM Engine**:
The authoritative finite state machine governing the batch fertigation lifecycle: `IDLE`, `FILLING_WATER`, `CHECK_BASE`, `DOSING`, `MIXING`, `STABILIZING`, `MEASURING_TDS`, `GATE_EVALUATE`, `TOPUP_DOSING`, `RECOVERY_MIX_EVALUATE`, `DISTRIBUTING`, and `BATCH_DEPLETED`, with NVS-journaled `BATCH_PAUSED_INSPECTION` for outage recovery.
_Avoid_: Ad-hoc state machine, 10-state legacy engine, Software loop runner

**Command Idempotency Protocol**:
The communication handshake where every actuator and state mutation request carries a UUIDv4 `cmd_id`. The ESP32 tracks the last 32 executed IDs in circular SRAM and commits `last_executed_cmd_id` to NVS flash. Duplicate incoming QoS 1 commands return an `ALREADY_EXECUTED` ACK receipt without re-energizing physical actuators.
_Avoid_: Blind retry, Unchecked retransmission, Fire-and-forget command, Double actuation

**Active-LOW Relay Fail-Safe Invariant**:
The electrical circuit rule where power relays for all 4 physical actuators are driven by active-LOW optoisolated inputs and wired to Normally Open (NO) power contacts. Microcontroller reset, brownout, pin floating, or logic power loss forces 0 ms de-energization to safe off.
_Avoid_: Active-HIGH relay, Normally Closed actuator bus, Software-latched power

**Gated Fault Reset**:
The strict three-condition safety clearance protocol required to de-latch a critical firmware fault: (1) physical NC mushroom switch twist-released (`hw_estop_pressed == false`), (2) Distribution Drum (Drum 2) manually drained via gravity to $\le 8.0\text{ L}$ (`D-048`), and (3) FMCW radar level sensor actively online and communicating over UART (`radar_online == true`, `09_ERROR_HANDLING.md` §3.1). All three conditions must hold before the `RESET_FAULT` command transitions the FSM to `IDLE`.
_Avoid_: Force reset, UI override, Clear error, Software unlatch

---

## 4. Cyber-Physical Security & Edge Infrastructure

**Dual-NIC Network Air-Gap**:
The physical hardware network isolation on the Beelink EQ12 Mini PC: ETH0 (`192.168.10.1/24`) is strictly dedicated to the OT Industrial Fieldbus (ESP32-S3 and Mosquitto broker on port 1883); ETH1 (`192.168.1.10/24`) is dedicated to IT/WAN Uplink (Nginx reverse proxy, Gazebo TV `192.168.1.50`, and Tailscale). Linux kernel forwarding is disabled (`net.ipv4.ip_forward = 0`) with `nftables` dropping all forwarded packets.
_Avoid_: Single subnet, Flat network, Software-only VLAN, Bridge mode

**Local Time Authority (Chrony Stratum-10 NTP Master)**:
The edge time synchronization architecture where the Beelink EQ12 motherboard battery-backed CR2032 CMOS RTC (`/dev/rtc0`) serves as the authoritative time master on boot (`hwclock --hctosys`). Chrony runs as a local Stratum-10 NTP server on the isolated OT LAN (`192.168.10.1:123`), disciplining the ESP32-S3 internal clock via SNTP every 60 minutes with zero internet dependency.
_Avoid_: Cloud-only NTP, Unsynchronized RTC, Missing time reference, Drift blind

**Kiosk Step-Up Admin Elevation**:
The authentication pattern on the Primary HMI Touchscreen: runs as a persistent local loopback (`127.0.0.1:8080`) `Operator` session with zero idle lockout for instant operational response; performing administrative actions (user management, sensor calibration, manual actuator testing) requires passing a 15-minute temporary Admin password/PIN challenge (`is_elevated = true`).
_Avoid_: Constant admin mode, Unprotected kiosk, Shared root console, Session timeout kiosk

**Cryptographic Audit Log Hash Chaining**:
The tamper-evident database audit trail where every administrative and state mutation record in `audit_logs` includes an immutable SHA-256 cryptographic hash calculated as `row_hash = SHA256(prev_hash || id || ts || user_id || action || payload)`. Enforced by PostgreSQL PL/pgSQL append-only triggers that strictly reject `UPDATE` and `DELETE` operations.
_Avoid_: Mutable activity log, Plaintext syslog, Unverified history, Writable audit trail

**Offline Asset Integrity Gate**:
The automated CI/CD and deployment verification check that scans the compiled frontend production bundle (`dist/`) to guarantee 100% offline self-containment, failing the build if any external CDN references, unbundled web fonts, or remote protocols (`http://`, `https://`, `cdn.*`, `unpkg.*`) are detected.
_Avoid_: Cloud font loading, CDN script injection, Online bundle dependency

---

## 5. UI/UX & Operator Cockpit Ergonomics

**Clean Minimalist Laboratory Design System**:
The visual and interaction design philosophy for the greenhouse control room: light, clean, and sleek Scandinavian minimalist aesthetic matching the Aeros design reference (`#F8FAFC` warm off-white canvas, `#FFFFFF` pure white cards with 28px curvature, `#E2E8F0` hairline borders, generous whitespace, large bold metric numerals, soft pastel status pills, smooth dual-gradient cubic spline wave charts), Inter / Plus Jakarta Sans typography, tabular numerals (`tabular-nums`), WCAG 2.2 compliant contrast ($\ge 4.5:1$ text), and large touch targets (uniform $\ge 56 \times 56\text{ CSS px}$ for routine interactive controls on Tier 1 Kiosk, prominent coral-red pill for Master E-Stop).
_Avoid_: Heavy industrial dark theme, Cluttered mechanical gauges, Cramped data tables, Low-contrast gray, AI slop

**Pessimistic UI Mutation Discipline**:
The interaction pattern where clicking an actuator or state-changing button immediately disables the button, displays a pending spinner, and holds the interface state until hardware confirmation is returned over WebSocket/MQTT telemetry. If confirmation is not received within 3.0 seconds, the mutation enters `OUTCOME_UNKNOWN` (`D-047`, `D-050`): controls remain locked, an amber caution state is displayed, telemetry polling reconciles actual state, and any operator retry reuses the exact same `cmd_id` to prevent duplicate dosing.
_Avoid_: Optimistic UI, Double-click action, Unconfirmed state update

**Pipeline Stepper Component (UI-18)**:
A minimalist horizontal visual stepper positioned above the active tank card rendering the 12 FSM lifecycle steps, glowing active node, completed ticks, and live step countdown/count-up timers, providing immediate glanceable batch progress across all display tiers.
_Avoid_: Hidden step, Blind progress, Monospace log only, Simple progress bar

**Fluid Surface Physics Indicator (UI-03)**:
The dynamic SVG/Canvas liquid simulation inside the drum visualizer that visually encodes physical state dynamics at 60 FPS using procedural sine waves (rising wave for FILLING, rotational vortex swirl for MIXING, glassy mirror calm for STABILIZING, neon probe glow for MEASURING, draining wave for DISTRIBUTING, red hazard pulse for FAULT, and amber deficit wave for PAUSED_INSPECTION).
_Avoid_: Static flat bar, Unchanging tank graphic, Heavy 3D WebGL shader

**In-App Notification Hub (UI-17)**:
An Apple-style glassmorphic notification center pairing a persistent header bell (with unread badge counter), a slide-out frosted glass drawer with categorized history, and floating interactive toasts equipped with 1-tap action buttons (`[Lihat Detail]`, `[Konfirmasi Refill]`). Enforces a 4-tier severity model with selective subtle UI audio chimes on the HMI Kiosk (gentle glass ping for warnings, double chime for critical faults/E-stop; silent for routine success and info).
_Avoid_: No-alert policy, Intrusive full banner, Silent fault suppression, Constant alert beeping
