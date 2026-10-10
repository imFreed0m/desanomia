# 16 Production Checklist & Commissioning Protocol

> **Authority Notice:** Single Source of Truth (SOTT) for Desanomia's Go-Live Verification, Hardware Commissioning Quality Gates, and Production Readiness Sign-Off. Every checkbox represents an uncompromised engineering gate that must be physically verified, tested, and certified before agricultural fertilizers are injected or unattended automated schedules are enabled. Governed by [00_MASTER_RULES.md](file:///home/maria_zahra/Documents/projects/greenhouse/desanomia/brain/00_MASTER_RULES.md), [01_PRD.md](file:///home/maria_zahra/Documents/projects/greenhouse/desanomia/brain/01_PRD.md), [04_TRD.md](file:///home/maria_zahra/Documents/projects/greenhouse/desanomia/brain/04_TRD.md), [05_ARCHITECTURE.md](file:///home/maria_zahra/Documents/projects/greenhouse/desanomia/brain/05_ARCHITECTURE.md), [08_SECURITY.md](file:///home/maria_zahra/Documents/projects/greenhouse/desanomia/brain/08_SECURITY.md), [09_ERROR_HANDLING.md](file:///home/maria_zahra/Documents/projects/greenhouse/desanomia/brain/09_ERROR_HANDLING.md), [10_FIRMWARE_SPEC.md](file:///home/maria_zahra/Documents/projects/greenhouse/desanomia/brain/10_FIRMWARE_SPEC.md), [11_API_CONTRACT.md](file:///home/maria_zahra/Documents/projects/greenhouse/desanomia/brain/11_API_CONTRACT.md), [12_UI_SPEC.md](file:///home/maria_zahra/Documents/projects/greenhouse/desanomia/brain/12_UI_SPEC.md), [13_TESTING.md](file:///home/maria_zahra/Documents/projects/greenhouse/desanomia/brain/13_TESTING.md), [14_GITHUB_ACTIONS.md](file:///home/maria_zahra/Documents/projects/greenhouse/desanomia/brain/14_GITHUB_ACTIONS.md), [15_DEPLOYMENT.md](file:///home/maria_zahra/Documents/projects/greenhouse/desanomia/brain/15_DEPLOYMENT.md), and [18_DECISIONS.md](file:///home/maria_zahra/Documents/projects/greenhouse/desanomia/brain/18_DECISIONS.md).

---

## 1. Specification Invariants & System Architectural Sign-Off

- [ ] **Zero Unresolved Tags:** All historical `[VERIFY]` and `[PROPOSED]` items across `brain/00` to `brain/20` are formally reconciled against empirical constants and Master Invariants.
- [ ] **Empirical Constants & Bounds Formally Reconciled:**
  - [ ] Dynamic TDS Tolerance Gate Band compiled as $[ \text{Target} - 50, \text{Target} + 50 ]\text{ ppm}$ (e.g. 1200–1300 ppm for default Generatif 1250 ppm recipe).
  - [ ] Distribution Drum 2 Volumetric Thresholds Separated (`D-048`): Normal distribution cutoff $\le 8.0\text{ L}$, dry-run safety cutoff $< 6.0\text{ L}$ (debounced $\le 200\text{ ms}$), and batch start $\le 8.0\text{ L}$ (with $5.0\text{ L}$ mechanical sump offset).
  - [ ] Concentrate Drum 1 Capacity compiled as $20.0\text{ L}$, with low-stock warning at $\le 3000\text{ mL}$ and batch lockout at $< 1500\text{ mL}$.
  - [ ] Feedforward dosing duration coefficient verified at $V_{\text{mL}} \times 0.107\text{ s/mL}$ ($9.35\text{ mL/s}$ peristaltic flow rate).
  - [ ] Semi-Closed Loop Single-Pass Top-Up dosing volume strictly capped at $\le 300.0\text{ mL}$ ($32.1\text{ s}$ run time).
  - [ ] Dual-Stage Fill Timeouts compiled: Early rise timeout ($< 1.0\text{ L}$ in $90\text{ s}$) and total fill timeout ($> 20\text{ min}$).
  - [ ] Clean water baseline range compiled: $50\text{ to }350\text{ ppm}$ acceptable; $\ge 350\text{ ppm}$ trips `FAULT_BASE_TDS_HIGH`.
  - [ ] 60 GHz radar millimeter-wave UART silence watchdog compiled at $3.0\text{ s}$.
  - [ ] Same-day double distribution lockout enforced with dual friction barrier: mandatory agronomic risk checkbox + 3-second press-and-hold button on `SAME_DAY_FORCE_OVERRIDE` (`D-050`).
- [ ] **Decision Log Completeness:** Decisions `D-001` through `D-050` in `brain/18_DECISIONS.md` are formally marked `Accepted`, with zero open architectural blockers.
- [ ] **Canonical Terminology Compliance:** All documentation and code adheres strictly to `brain/20_GLOSSARY.md` (e.g. `Concentrate Drum 1`, `Distribution Drum 2`, `Gated Fault Reset`, `Pause Mode`).

---

## 2. Physical Hardware & Electrical Safety Verification

- [ ] **Fail-Safe Relay Coil De-Energization (Active LOW Logic):**
  - [ ] All 4 optoisolated power relays (SV1 Fill Solenoid GPIO 4, PP1 Peristaltic Pump GPIO 5, M1 High-Shear Mixer GPIO 6, SV2 Distribution Solenoid GPIO 7) wired to **Normally Open (NO)** contact terminals.
  - [ ] Verified that microcontroller power loss, reset, or bare-metal panic unconditionally de-energizes relay coils, forcing all valves CLOSED and all pumps OFF.
- [ ] **Dual-Circuit Physical Mushroom Emergency Stop (E-Stop) Switch:**
  - [ ] **Circuit 1 (Hardware Bus Cutoff):** Verified that depressing the NC mushroom switch physically severs the DC 12V/24V actuator coil power bus, achieving instantaneous **$0\text{ ms}$ electrical de-energization** independent of microcontroller software.
  - [ ] **Circuit 2 (Software Telemetry Sensing):** Verified that depressing the mushroom switch opens the auxiliary NC contact to ESP32-S3 GPIO 21 (pulled HIGH), generating an immediate hardware interrupt that sets `hw_estop_pressed = true` and latches `FAULT_ESTOP` in NVS.
  - [ ] Verified that twisting the mushroom switch to release clears the physical contact, restoring GPIO 21 to LOW (`hw_estop_pressed = false`).
- [ ] **Local Panel Alarms & Audio Feedback:**
  - [ ] DC 12V Red Pilot Lamp (GPIO 3 via MOSFET driver) illuminates solidly during active batches and flashes at 2 Hz during latched faults.
  - [ ] Piezo Buzzer (GPIO 2 via transistor driver) sounds strictly on error and fault events; silent during routine operation.
- [ ] **Sensor Wiring & Signal Conditioning Chains:**
  - [ ] DFRobot Gravity Analog TDS probe conditioning board powered with isolated 5V; output connected to ADC1_CH0 (GPIO 1); 10-sample moving trimmed median filter and 27.0°C baseline temperature compensation active.
  - [ ] 60 GHz FMCW millimeter-wave radar sensor connected to UART1 (GPIO 17/18 @ 115200 bps); binary frame parser verified with 5.0 L physical sump calibration offset.
  - [ ] Distribution pulse flow meter connected to GPIO 16 with hardware debouncing filter.
- [ ] **Power Supply & Battery Backup (UPS):**
  - [ ] Beelink EQ12 Mini PC, network switch, Orbit Star H2 modem, and 24V industrial power supply connected to 1200VA Online Double-Conversion UPS.
  - [ ] Simulated grid power loss: UPS maintains continuous power for $> 45\text{ minutes}$ with zero microsecond dropouts.

---

## 3. Bare-Metal Firmware Safety Quality Gates

- [ ] **Automated CI Quality Gate Pass:** PlatformIO test suite passes cleanly on GitHub Actions with zero warnings (`-Wall -Wextra -Werror`).
- [ ] **100% Branch Coverage on Safety Modules:** LCOV report certifies exactly **$100.0\%$ branch coverage** across `safety_interlocks.cpp`, `fsm_engine.cpp`, and `dosing_calculator.cpp`.
- [ ] **Physical Bench Verification of The Seven Safety Interlocks (`IL-01` to `IL-07`):**
  - [ ] **`IL-01` Dynamic Tolerance Gate:** Distribution pump physically inhibited when TDS is 1199 ppm or 1301 ppm (Target 1250 ppm); enabled strictly within $[ 1200, 1300 ]\text{ ppm}$.
  - [ ] **`IL-02` Dry-Run Cutoff Guard:** Distribution pump P1 de-energizes when Drum 2 level drops below 6.0 L (debounced over 2 frames, $\le 200\text{ ms}$, `D-048`); latches `FAULT_DRY_RUN`.
  - [ ] **`IL-03` Batch Depletion Guard:** Starting a batch with $> 8.0\text{ L}$ in Drum 2 is rejected with `FAULT_BATCH_REJECTED` (`D-048`, Tier 1B precondition rejection: FSM remains `IDLE`, zero buzzer, zero NVS latch).
  - [ ] **`IL-04` Dual-Stage Fill Guard:** Early rise timeout ($< 1.0\text{ L}$ rise in 90s) trips `PAUSED_FILL_NO_WATER`; total fill timeout ($> 20\text{ min}$) trips `PAUSED_FILL_TIMEOUT`. Non-draining `RESUME_FILL` recovers fill safely (max 3 resumes, cumulative 20 min watchdog).
  - [ ] **`IL-05` Water Baseline & Plausibility Guard:** Clean water TDS $< 50\text{ ppm}$ or $> 2000\text{ ppm}$ trips `FAULT_TDS_INVALID`; baseline $\ge 350\text{ ppm}$ trips `FAULT_BASE_TDS_HIGH`.
  - [ ] **`IL-06` Radar Watchdog Guard:** Disconnecting radar UART trips `FAULT_RADAR_OFFLINE` within $3.0\text{ s}$ and de-energizes all relays.
  - [ ] **`IL-07` Emergency Stop Guard:** Depressing physical mushroom switch severs relay power in $0\text{ ms}$ and latches `FAULT_ESTOP`.
- [ ] **Gated Fault Reset Protocol Three Preconditions Verified (`TR-10`, `D-012`, `D-019`, `D-048`, `D-050`):**
  - [ ] Reset command is physically rejected and button disabled while mushroom switch is depressed (`hw_estop_pressed == true`).
  - [ ] Reset command is physically rejected and button disabled while fluid remains in Drum 2 ($> 8.0\text{ L}$, `D-048`).
  - [ ] Reset command is physically rejected and button disabled if radar UART is offline (`radar_online == false`, `09_ERROR_HANDLING.md` §3.1).
  - [ ] Reset command succeeds, clears fault latch, and transitions FSM to `IDLE` strictly when switch is twist-released, Drum 2 is drained to $\le 8.0\text{ L}$, and radar is online.
- [ ] **Mid-Batch Power Outage Recovery (`D-013`):**
  - [ ] Unplugged AC mains during active mixing stage; verified that upon cold boot, ESP32-S3 reads NVS state journal and enters **`BATCH_PAUSED_INSPECTION`**.
  - [ ] Verified dynamic deficit concentrate dosing formula: $[(\text{TDS}_{\text{target}} - \text{TDS}_{\text{meas}}) \times V_{\text{vol}}] / 107.0 \le 300\text{ mL}$.
- [ ] **Command Idempotency & Replay Protection (`D-045`):**
  - [ ] Sent identical UUID `cmd_id` twice over MQTT QoS 1; verified second transmission returns `ALREADY_EXECUTED` without re-toggling physical relays.
  - [ ] Verified that `last_executed_cmd_id` persists across microcontroller reboots via NVS flash.

---

## 4. Dual-NIC Network Air-Gap & Cyber Hardening (D-043)

- [ ] **Physical Interface Air-Gap:**
  - [ ] `ETH0` (`enp1s0`) assigned static IP `192.168.10.1/24`; connected strictly to unmanaged industrial switch and ESP32-S3 (`192.168.10.20`). Zero WAN uplink.
  - [ ] `ETH1` (`enp2s0`) assigned static IP `192.168.1.10/24`; connected to Orbit Star H2 4G gateway, Gazebo PTP bridge (TV `192.168.1.50`), and Tailscale.
- [ ] **Kernel Isolation & nftables Verification:**
  - [ ] Verified `sysctl net.ipv4.ip_forward` returns `0`.
  - [ ] Tested cross-interface routing: Packets from `ETH1` to `ETH0` are dropped unconditionally by `nftables`.
  - [ ] Performed external nmap port scan from 4G WAN: Confirmed zero open ports directly exposed to public internet.
- [ ] **MQTT Broker Hardening (Mosquitto 2.0):**
  - [ ] Mosquitto listener strictly bound to `192.168.10.1:1883` on `ETH0`; zero exposure to `ETH1` or WAN.
  - [ ] Anonymous access disabled (`allow_anonymous false`).
  - [ ] Authenticated accounts enforced: `esp32_gateway` restricted to `desanomia/gh1/#`; `backend_service` restricted to backend topics.
- [ ] **Cryptographic Audit Trail Immutability (`D-039`, `D-044`):**
  - [ ] Verified SHA-256 hash chaining formula (`row_hash = SHA256(prev_hash + ...)`) on `audit_logs` table.
  - [ ] Executed test `UPDATE` and `DELETE` queries on `audit_logs`: Confirmed PostgreSQL database triggers reject mutations with error.

---

## 5. Multi-Tier Display & Touch Ergonomics Verification

- [ ] **Tier 1: Primary HMI Kiosk (UPERFECT 15.6" IPS FHD):**
  - [ ] Cage Wayland compositor auto-launches Chromium in fullscreen kiosk mode on boot (`http://127.0.0.1:8080`). Mouse cursor hidden.
  - [ ] Kiosk loopback operates with persistent local `Operator` session; 15-minute temporary `Admin` step-up elevation functional.
  - [ ] **Emergency Stop Hit Target:** Minimum touch bounding box of **$56 \times 56\text{ px}$** (header pill is $64 \times 64\text{ px}$). Touching trips software E-stop within $< 16\text{ ms}$ without modal confirmation.
  - [ ] **Routine Control Buttons:** Hit target is $\ge 48 \times 48\text{ px}$ (standard $56\text{ px}$ height) with $\ge 12\text{ px}$ physical clearance between buttons.
  - [ ] **Integrated On-Screen Touch Numpad:** Tested numeric inputs (PPM, calibration, manual mL); numpad spawns cleanly with $72 \times 72\text{ px}$ digit keys without triggering OS virtual keyboards.
  - [ ] Non-scrolling single-screen fit: Viewport locked at 1920×1080 with zero vertical or horizontal scrollbars.
- [ ] **Tier 2: Secondary Gazebo Display (Xiaomi TV A 43" Google TV):**
  - [ ] Fully Kiosk Browser runs 24/7 passive read-only mirror via Wired LAN (`192.168.1.50`).
  - [ ] 30/70 split layout active: 30% ambient/drum carousel, 70% glanceable operational Bento grid.
  - [ ] Glanceable Space Grotesk 112 px hero TDS numeral legible from 3–5 meters.
  - [ ] Mutation controls and command buttons completely hidden.
- [ ] **Tier 3: Mobile PWA Client (Smartphone Browser via Tailscale):**
  - [ ] Responsive single-column layout tested down to 360 px width.
  - [ ] Two-step gated E-stop confirmation modal (`aria-modal="true"`) active to prevent pocket mis-touches.
- [ ] **100% Offline Asset Bundling Certification:**
  - [ ] Production build grep audit confirms zero occurrences of `http://`, `https://`, `fonts.googleapis.com`, or `cdn.` in `dist/`.
  - [ ] Kiosk display tested with 4G WAN cable disconnected: Full application loads and functions normally with local variable fonts.

---

## 6. Edge Infrastructure, Persistence & Local Time Authority

- [ ] **Cold-Boot Autostart & BIOS AMI Settings:**
  - [ ] Beelink BIOS AMI configured with `Restore on AC Power Loss: Always On`.
  - [ ] System cold boot tested: Beelink powers up, starts Docker Compose stack, and launches Cage Wayland kiosk automatically within $< 45\text{ seconds}$.
- [ ] **Local Time Synchronization Authority (`D-020`):**
  - [ ] Beelink motherboard CR2032 CMOS Real-Time Clock (`/dev/rtc0`) verified functional.
  - [ ] Tested boot with WAN disconnected: System clock accurately restored from RTC via `hwclock --hctosys`.
  - [ ] Chrony local Stratum-10 NTP server running on `192.168.10.1:123`; verified ESP32-S3 synchronizes time over OT LAN every 60 minutes.
- [ ] **PostgreSQL 16 Monthly Partitioning & Retention (`D-044`):**
  - [ ] Verified native range partitions exist for current and subsequent 2 months on `telemetry`.
  - [ ] 5-second asynchronous RAM write buffer verified: Disk writes grouped to preserve NVMe SSD endurance.
  - [ ] Partition maintenance cron job verified: 1-minute historical rollups computed into `telemetry_1m` (retained 2 years); raw partitions dropped after 120 days.
- [ ] **Dual-Target Zstandard Backup Rehearsal:**
  - [ ] Target A (Local NVMe): Automated nightly `pg_dump | zstd` job verified in `/var/backups/postgres` (30 daily snapshots retained).
  - [ ] Target B (Off-Device): Mirroring verified via rsync to external mounted USB drive and remote sync over Tailscale to Host 2 (`lenovo-latop`).
  - [ ] Restoration Rehearsal: Restored a compressed `.sql.zst` backup archive on a secondary test instance; verified table schemas and data integrity.

---

## 7. Two-Stage Physical Greenhouse Commissioning & Pilot Protocol

Do not introduce chemical fertilizers or activate unattended automated schedules until both stages pass completely:

### 7.1 Stage 1: Water-Only Commissioning Run (Zero Fertilizer)
- [ ] **Hydraulic Integrity Under Pressure:** Fill Distribution Drum 2 with 140.0 L of municipal water. Run circulation and distribution pumps at full speed. Inspect all clamp collars, bulkheads, pump unions, and solenoid bodies for zero leaks.
- [ ] **Radar Millimeter-Wave Depth Calibration:**
  - [ ] 0.0 L reading matches empty sump offset ($5.0\text{ L}$ virtual offset).
  - [ ] 50.0 L reading matches physical dipstick within $\pm 1.0\text{ cm}$.
  - [ ] 100.0 L reading matches physical dipstick within $\pm 1.0\text{ cm}$.
  - [ ] 140.0 L reading matches physical target fill level within $\pm 1.0\text{ cm}$.
- [ ] **Pulse Flow Meter Calibration:** Measure 140.0 L water filling via SV1; calibrate pulse counter to within $\pm 1.5\%$ of true volumetric flow.
- [ ] **Dry-Run Trip Cutoff Test:** Drain Drum 2 using distribution pump P1. Verify that when water level drops below 5.0 L, distribution pump P1 de-energizes within $< 50\text{ ms}$ and firmware latches `FAULT_DRY_RUN`.

### 7.2 Stage 2: Supervised First Nutrient Run (Live A+B Fertilizer)
- [ ] **Concentrate Priming:** Load Concentrate Drum 1 with standard A+B nutrient stock solution. Use `/manual` fine-grained jog (+10 mL) to prime the peristaltic delivery line up to the injection tee. Confirm stock reset to 20.0 L via Refill Confirmation Gate.
- [ ] **Automated Fertigation Batch Execution:** Initiate automated batch with Generatif recipe preset (Target 1250 ppm, Band 1200–1300 ppm) for 140.0 L batch:
  - [ ] Water filling stops cleanly at 140.0 L.
  - [ ] Baseline water reading captured during `CHECK_BASE` (e.g. 104 ppm).
  - [ ] Feedforward dosing injects calculated NPK concentrate volume.
  - [ ] High-shear mixer runs for 180 seconds, followed by 60 seconds stabilization.
  - [ ] TDS measurement reading captured and logged.
  - [ ] Single-pass top-up recovery ($\le 300\text{ mL}$) triggers if initial measurement is in deficit band $[ 1000, 1200 )\text{ ppm}$.
  - [ ] Upon passing TDS tolerance gate ($1200\text{ to }1300\text{ ppm}$), system **automatically transitions to DISTRIBUTING** without demanding a second confirmation click.
- [ ] **Independent Handheld Calibration Cross-Check:** Sample nutrient solution from Drum 2 sampling port and measure with an independent, laboratory-calibrated handheld EC/TDS meter (e.g. Hanna Instruments or Apera).
  - *Recorded In-line TDS Reading:* `________ ppm`
  - *Recorded Handheld Meter Reading:* `________ ppm`
  - *Deviation:* `________ ppm` (Must be $\le \pm 25\text{ ppm}$).
- [ ] **Post-Distribution Flush & Residue Drainage:** Verify post-distribution flush valve cleans manifold and residual drainage completes to $\le 5.0\text{ L}$. FSM returns to `BATCH_DEPLETED` $\to$ `IDLE`.

### 7.3 Stage 3: Seven-Day Supervised Pilot Sign-Off
- [ ] **Supervised Operational Period:** The system must complete **seven (7) consecutive days of daily supervised batches** without unhandled faults, sensor drift anomalies, or communication timeouts.
- [ ] **Agronomic Sign-Off:** Plant root zones inspected daily for optimal electrical conductivity, moisture saturation, and zero symptoms of root asphyxiation or salt toxicity.
- [ ] **Unattended Schedule Activation:** Upon successful completion of the 7-day pilot, the Lead Agronomist and Systems Engineer sign off on enabling unattended automated calendar schedules (`/schedules`).

---

## 8. Final Commissioning Certification & Sign-Off

| Milestone Certification | Responsible Engineer | Signature / Date | Verification Status |
| :--- | :--- | :--- | :---: |
| **Electrical & Hardware Safety** | Hardware Systems Lead | `____________________` | `[ ] CERTIFIED` |
| **Bare-Metal Firmware Safety** | Embedded Firmware Lead | `____________________` | `[ ] CERTIFIED` |
| **Dual-NIC Cyber Security** | Infrastructure Lead | `____________________` | `[ ] CERTIFIED` |
| **HMI Kiosk & Ergonomics** | Frontend UI Lead | `____________________` | `[ ] CERTIFIED` |
| **Water-Only Commissioning** | Commissioning Lead | `____________________` | `[ ] CERTIFIED` |
| **Supervised Nutrient Run** | Lead Agronomist | `____________________` | `[ ] CERTIFIED` |
| **FINAL GO-LIVE PERMIT** | Operations Director | `____________________` | `[ ] APPROVED` |
