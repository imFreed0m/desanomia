# 09 Error Handling

Principle: the process fails safe in firmware first, the backend reports honestly, the UI never hides uncertainty. [Aligned with 00_MASTER_RULES.md, 04_TRD.md, 05_ARCHITECTURE.md, and 18_DECISIONS.md]

## Fault taxonomy [SPEC]

| Class | Examples | Raised by | Effect |
| --- | --- | --- | --- |
| Interlock | Any of IL-01 to IL-07 triggered (`FAULT_DRY_RUN`, `FAULT_PPM_OUT_OF_RANGE`, `FAULT_BATCH_REJECTED`, `FAULT_NO_WATER_SUPPLY`, `FAULT_FILL_TIMEOUT`, `FAULT_TDS_INVALID`, `FAULT_BASE_TDS_HIGH`, `FAULT_RADAR_OFFLINE`, `FAULT_ESTOP`) | Firmware | Outputs forced safe, fault latched in NVS |
| Gate failure | Final mean TDS outside $[\text{Target} \pm 50\text{ ppm}]$ at `GATE_EVALUATE` after single-pass top-up recovery, or initial TDS $> \text{Target} + 50\text{ ppm}$ | Firmware | Distribution pump locked OFF, `FAULT_PPM_OUT_OF_RANGE` latched, zero secondary top-up |
| Starvation | Post-dosing TDS deficit $> 250\text{ ppm}$ below target (`< Target - 250 ppm`) | Firmware / Backend | `STARVATION_SUSPECTED` flagged, top-up skipped, inspection alert dispatched |
| Sensor | Analog TDS probe disconnected ($< 50\text{ ppm}$) / shorted ($> 2000\text{ ppm}$), baseline raw water $\ge 350\text{ ppm}$, or radar UART silent $> 3.0\text{ s}$ | Firmware | Actuators cut immediately, fault latched (`FAULT_TDS_INVALID`, `FAULT_BASE_TDS_HIGH`, `FAULT_RADAR_OFFLINE`) |
| Timeout | Fill early rise $< 1.0\text{ L}$ in 90 s (`FAULT_NO_WATER_SUPPLY`) or total fill $> 20\text{ min}$ (`FAULT_FILL_TIMEOUT`) | Firmware | Fill valve closed, timer halted, allows `RESUME_FILL` without draining |
| Comms / Liveness | Telemetry silent $> 12.0\text{ s}$ (`STALE`), silent $> 20.0\text{ s}$ (`OFFLINE`), MQTT broker down, command ACK timeout (3.0 s) | Backend | In-app alert, UI stale/offline banner, control mutations disabled, Telegram alert on `OFFLINE` |
| Backend | DB write failure, internal exception | Backend | 5xx, RAM queue buffering, alert, physical process continues unaffected on ESP32 |

Fault codes are canonical strings matching the 7 safety interlocks.

## Fault lifecycle & Gated Fault Reset

Raised $\to$ latched in NVS $\to$ alerted (HMI buzzer/lamp, in-app toast, Telegram) $\to$ physical resolution $\to$ operator `Reset Fault` command on UI $\to$ cleared:
- **Gated Fault Reset Protocol (Master Rule 7, TR-10):** The firmware strictly rejects `RESET_FAULT` commands while Drum 2 radar level reads $> 5.0\text{ L}$ (requiring manual gravity drainage of contaminated solution to the waste ditch) OR while physical NC Emergency Stop contacts remain open (`hw_estop_pressed == true`).
- The UI `Reset Fault` button remains disabled with instructive badges until radar confirms volume $\le 5.0\text{ L}$ and hardware contacts close. Every fault raise and clear event logs to `faults` and `audit_logs`.

## Behavior matrix

| Event | Firmware | Backend | UI |
| --- | --- | --- | --- |
| Broker or backend down mid-batch | Continues to safe completion autonomously, spools events to 500-slot PSRAM buffer | n/a | n/a |
| ESP32 telemetry silent | Autonomous | `STALE` at $> 12.0\text{ s}$; `OFFLINE` at $> 20.0\text{ s}$ with Critical Telegram alert; rejects mutations with `DEVICE_OFFLINE` | Yellow stale badge at 12s; red offline banner at 20s with controls locked |
| Command rejected by interlock | Acknowledges QoS 1 with `REJECTED` and reason | Maps to `INTERLOCK_REJECTED` (409) | Displays rejection reason verbatim |
| Command ack timeout | Unknown | `COMMAND_TIMEOUT` (504) after 3.0 s, releases optimistic UI lock, does not re-dispatch | Displays timeout toast, prompts operator to verify state |
| Duplicate batch start | Rejects with `INTERLOCK_IL03_DRUM2_NOT_EMPTY` or non-IDLE | Maps to `INVALID_STATE` (409) | Displays reason |
| Power loss mid-batch | Detects cold-boot with active batch and Drum 2 $> 5.0\text{ L}$; initializes safely into `BATCH_PAUSED_INSPECTION` mode (D-013) | Calculates deficit concentrate mL; runs 30-min auto-resume timer; sends Telegram alert | Dominating modal showing deficit math and `[Konfirmasi & Lanjutkan]` button |
| DB write failure | n/a | Buffers telemetry frames in RAM queue (5s flush), retries, alerts | Real-time WebSocket feed unaffected |

## Backend rules

Never retry a state-changing command automatically. Use unique `cmd_id` UUID for every mutation (QoS 1). MQTT reconnect with exponential backoff capped at 30 s. Structured JSON logs with request id, user id, cmd_id. Unhandled exceptions return INTERNAL without leaking internals.

## Alerts (Telegram)

Send on: safety interlock trip, gate failure (`FAULT_PPM_OUT_OF_RANGE`), device `OFFLINE` ($> 20.0\text{ s}$ or LWT), batch completed with result, concentrate stock low ($\le 3,000\text{ mL}$) or starved, repeated login failures. Deduplicate by code within 10 minutes. If 4G WAN is disconnected, buffer in `alert_queue` and flush chronologically with original timestamps upon reconnection (TR-22). Critical alert messages feature secure inline callback buttons (`[Siram Sekarang]`, `[Tunda 1 Jam]`, `[Konfirmasi Pause Recovery]`).

## Frontend rules

Error boundaries per page. Distinguish network error, auth expired (redirect to login), and server error. Never show a raw stack trace. Mutation controls enforce pessimistic UI locking (instant button disable on tap until ACK received or 3.0s timeout).
