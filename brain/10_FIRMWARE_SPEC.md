# 10 Firmware Spec

ESP32-S3 N16R8 with FreeRTOS dual-core asymmetric task allocation, PlatformIO project. [SPEC stack, aligned with 00_MASTER_RULES.md, 04_TRD.md, 05_ARCHITECTURE.md, and 18_DECISIONS.md]

## Tasks [SPEC]

- **Core 1 (Real-Time Control & Safety Domain, 240 MHz):**
  - `fsm_task` (Priority 5, 20 Hz / 50 ms tick via `vTaskDelayUntil()`): 12-state fertigation lifecycle FSM execution.
  - `safety_interlock_matrix`: Synchronously evaluates all 7 autonomous safety interlocks (`IL-01` through `IL-07`) every 50 ms loop before GPIO relay registers are updated.
  - `sensor_task` (Priority 3, 10 Hz): Analog TDS multisampling (10-sample moving trimmed median filter, 27.0°C baseline compensation) on ADC1_CH0 (GPIO 1), and 60 GHz FMCW radar binary frame parser on UART1 (GPIO 17 TX / GPIO 18 RX @ 115200 bps).
  - `actuator_task`: Single hardware owner of 4 active-LOW optoisolated relay pins (Fill GPIO 4, Dose GPIO 5, Mix GPIO 6, Distribute GPIO 7) and panel alarm pins (Buzzer GPIO 2, Pilot Lamp GPIO 3).
- **Core 0 (Network & Communication Domain, 240 MHz):**
  - W5500 SPI Ethernet driver (`192.168.10.20` on OT LAN `ETH0`).
  - `mqtt_task` (Priority 2): Mosquitto client connection, 10s keep-alive with LWT on `desanomia/gh1/status`, QoS 0 telemetry streaming (5s standard, 1s measuring), QoS 1 command subscription on `desanomia/gh1/cmd`, QoS 1 correlated execution receipts on `desanomia/gh1/ack`, and 32-slot RAM + NVS circular idempotency cache (`last_executed_cmd_id`, D-045).
  - `psram_spooler_task` (Priority 1): Spools discrete FSM state transitions and fault trips into an 8MB Octal PSRAM ring buffer (capacity 500 events) during network loss and flushes chronologically to `desanomia/gh1/events` upon reconnection.
  - Watchdog timer supervising all tasks.

## Pinout & GPIO Allocation [SPEC]

To prevent pin conflicts with the native USB Serial/JTAG controller and internal memory buses on the ESP32-S3 N16R8, the hardware GPIO mapping is strictly frozen as follows:

| Pin ESP32-S3 | Hardware Function | Logic / Circuit Type | Engineering Safety Notes |
| :--- | :--- | :--- | :--- |
| **GPIO 1** | Analog TDS Probe Input | ADC1_CH0 (0–3.3V) | Connected to AFE Conditioner board |
| **GPIO 2** | Acoustic Buzzer (DC 12V Driver) | Output (Active HIGH via NPN) | Error annunciation; moved from GPIO 20 (USB isolated) |
| **GPIO 3** | Red Industrial Pilot Lamp (DC 12V) | Output (Active HIGH via NPN) | Latched fault indicator; moved from GPIO 19 (USB isolated) |
| **GPIO 4** | Relay 1: Fill Solenoid Valve (AC 220V) | Output (Active LOW Optoisolated) | Interlock IL-04 & IL-05 Cutoff |
| **GPIO 5** | Relay 2: Peristaltic Dosing Pump (DC 12V) | Output (Active LOW Optoisolated) | Dosing runtime protection |
| **GPIO 6** | Relay 3: Submersible Mixing Pump (AC 220V) | Output (Active LOW Optoisolated) | Circulation & homogenization (120 s) |
| **GPIO 7** | Relay 4: High-Pressure Distribution Pump | Output (Active LOW Optoisolated) | Interlock IL-01, IL-02, IL-07 Cutoff |
| **GPIO 10** | W5500 SPI CS (Chip Select) | Output SPI Bus | OT LAN Ethernet communication |
| **GPIO 11** | W5500 SPI MOSI | Output SPI Bus | OT LAN Ethernet communication |
| **GPIO 12** | W5500 SPI MISO | Input SPI Bus | OT LAN Ethernet communication |
| **GPIO 13** | W5500 SPI SCK | Output SPI Clock | OT LAN Ethernet communication |
| **GPIO 14** | W5500 Hardware Reset (RST) | Output Active LOW | Hardware reset controller for W5500 |
| **GPIO 15** | W5500 Interrupt (INT) | Input External Interrupt | Incoming Ethernet frame notification |
| **GPIO 17** | 60 GHz Radar UART1 TX | Output UART (115200 bps) | FMCW radar sensor configuration |
| **GPIO 18** | 60 GHz Radar UART1 RX | Input UART (115200 bps) | Level reading binary frame parser (10 Hz) |
| **GPIO 19** | **ESP32-S3 Native USB D-** | **Dedicated USB-JTAG Serial** | **Reserved for flashing/debugging (D-027)** |
| **GPIO 20** | **ESP32-S3 Native USB D+** | **Dedicated USB-JTAG Serial** | **Reserved for flashing/debugging (D-027)** |
| **GPIO 21** | Emergency Stop Sensing Contact | Input Pulled-Up (RC Filter $\le 1\text{ ms}$) | Secondary NC Contact hardware sensing (D-019) |
| **GPIO 35–37**| **Internal Octal PSRAM Bus** | **Reserved Memory Bus** | **STRICTLY FORBIDDEN FOR EXTERNAL GPIO (N16R8)** |

## Interlocks [SPEC]

Seven autonomous safety interlocks enforced in firmware, active in both AUTO and MANUAL mode, with zero software or UI bypass:

| ID | Interlock Name | Trigger Condition | Latched Fault Code | Hardware Safety Response | Reset Requirement (Gated Reset) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **IL-01** | **TDS Safety Gate** | Final mean TDS $< (\text{Target}-50)$ or $> (\text{Target}+50\text{ ppm})$ | `FAULT_PPM_OUT_OF_RANGE` | Distribution pump (GPIO 7) locked OFF | Manual gravity drain to waste ditch until level $\le 5.0\text{ L}$ |
| **IL-02** | **Radar Dry-Run Cutoff** | Drum 2 level $< 5.0\text{ L}$ while distribution pump is active | `FAULT_DRY_RUN` | Cut distribution pump (GPIO 7) in $< 50\text{ ms}$ | FSM returns to `IDLE` / refilling allowed |
| **IL-03** | **Batch Depletion Guard** | `START_BATCH` received while Drum 2 level $> 5.0\text{ L}$ | `FAULT_BATCH_REJECTED` | Reject command, all relays remain OFF | Drain residual water to $\le 5.0\text{ L}$ |
| **IL-04** | **Dual-Stage Fill Guard** | Level rise $< 1.0\text{ L}$ in 90 s OR total fill time $> 20\text{ min}$ | `FAULT_NO_WATER_SUPPLY` / `FAULT_FILL_TIMEOUT` | Close fill valve (GPIO 4), halt timer | Clear water supply issue, send `RESUME_FILL` command |
| **IL-05** | **Water Baseline Plausibility** | Raw clean water TDS $< 50$, $> 2000$, or baseline $\ge 350\text{ ppm}$ | `FAULT_TDS_INVALID` / `FAULT_BASE_TDS_HIGH` | Close fill valve, abort batch immediately | Inspect probe cable or raw water source |
| **IL-06** | **Radar Liveness Watchdog** | Radar UART1 silent / missing frames for $> 3.0\text{ s}$ | `FAULT_RADAR_OFFLINE` | Cut all 4 relays immediately | Auto-clears immediately upon receiving valid UART frame |
| **IL-07** | **Emergency Stop Guard** | Physical NC switch loop open (GPIO 21 High / ISR) OR software E-Stop command | `FAULT_ESTOP` | Mechanical relay coil bus cut ($0\text{ ms}$) + GPIO Low ($< 5\text{ ms}$) | Twist physical switch NC (`hw_estop_pressed == false`) AND Drum 2 level $\le 5.0\text{ L}$ |

Hardware mutual exclusion enforced in output registers: `fill_valve` and `dist_pump` cannot run simultaneously; `dosing_pump` and `dist_pump` cannot run simultaneously.

## FSM and gate

States per `05_ARCHITECTURE.md` §4.2 (12 operational lifecycle states: `IDLE`, `FILLING_WATER`, `CHECK_BASE`, `DOSING`, `MIXING`, `STABILIZING`, `MEASURING_TDS`, `GATE_EVALUATE`, `TOPUP_DOSING`, `RECOVERY_MIX_EVALUATE`, `DISTRIBUTING`, `BATCH_DEPLETED`). Semi-closed loop dosing with open-loop feedforward calculation ($V_{\text{mL}} \times 0.107\text{ s/mL}$). 

`GATE_EVALUATE` evaluates against dynamic recipe band $[\text{Target} - 50\text{ ppm},\ \text{Target} + 50\text{ ppm}]$ (1200–1300 ppm for default Generatif 1250 ppm recipe):
- **Pass:** Transitions autonomously to `DISTRIBUTING`.
- **Top-Up Recovery:** If TDS is in $[\text{Target} - 250\text{ ppm},\ \text{Target} - 50\text{ ppm})$, transitions to `TOPUP_DOSING` (single-pass dose capped at $\le 300\text{ mL}$ max), followed by `RECOVERY_MIX_EVALUATE` (60s mix, 15s settle, 10s measure).
- **Starvation:** If TDS is $< (\text{Target} - 250\text{ ppm})$, raises `STARVATION_SUSPECTED`, skips top-up, and latches `FAULT_PPM_OUT_OF_RANGE`.
- **Failure:** If TDS remains outside $[\text{Target} \pm 50\text{ ppm}]$ or initial TDS exceeds $\text{Target} + 50\text{ ppm}$, latches `FAULT_PPM_OUT_OF_RANGE`, locks distribution pump OFF, and requires manual gravity drain to $\le 5.0\text{ L}$. Zero continuous PID loops or secondary top-up attempts.

## Behavior on connectivity loss

Active batch continues autonomously to safe completion using parameters snapshotted in NVS. Transitions, gate evaluations, and fault trips are committed to the 500-event PSRAM ring buffer and flushed chronologically upon reconnection. Manual actuator commands expire if link drops.

## Config and persistence

Target TDS, tolerance band, volume calibration, timings, and probe calibration slope/offset ($K_{\text{cell}}$, $V_{\text{offset}}$) stored in NVS flash namespace `calib_tds`. Updated only via validated commands on `desanomia/gh1/cmd` with ack on `desanomia/gh1/ack`. Firmware version, hardware MAC, and config hash published on boot.

## Boot and recovery (D-013)

On cold boot, outputs are pulled LOW. If power was lost mid-batch:
- ESP32 reads NVS journal: if batch was active and Drum 2 radar level is $> 5.0\text{ L}$, the firmware enters un-energized `BATCH_PAUSED_INSPECTION` mode.
- Firmware calculates deficit concentrate volume required to reach recipe target and awaits a `RESUME_DEFICIT_BATCH` command from the backend (manual confirmation or 30-minute auto-resume timer if all 7 interlocks pass).
- If solution exhibits catastrophic spike ($> 500\text{ ppm}$ above target), manual gravity drain to $\le 5.0\text{ L}$ is required before reset is unlocked.

## OTA

Signed firmware update images delivered over local OT LAN from the Beelink EQ12 Mini PC edge host, dual-partition rollback (app0/app1), refused unless FSM is strictly in `IDLE`.

## Testing

FSM, gate, and interlock modules are hardware-independent and validated via host-native unit tests, see `13_TESTING.md`.
