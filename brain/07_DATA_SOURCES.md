# 07 Data Sources

Sensors, actuators, and the MQTT contract between ESP32 and backend. Pin numbers and calibration live in firmware config, not here.

## Sensors [SPEC for drum 2 sensors]

TDS/EC sensor in Drum 2 (ppm, optional EC mS/cm). Radar level sensor in Drum 2 (percent and derived liters for the 140 L drum). Drum 1 (20 L) is manual concentrate, no sensor stated. [VERIFY whether Drum 1 has a level sensor]

## Actuators [PROPOSED, VERIFY against SPEC.md]

fill_valve (water inlet to Drum 2), dosing_pump (Drum 1 to Drum 2), mixer (recirculation pump or agitator), dist_pump (single distribution pump to all beds). Interlock outputs and any manual-only actuators per SPEC.

## MQTT conventions [PROPOSED]

Prefix `desanomia/gh1/`. JSON payloads, UTF-8, `ts` in ISO 8601 UTC from the ESP32 (backend also stamps receive time). QoS 1 for state, events, commands, acks. QoS 0 for high-rate telemetry. Retained: state, actuators, status.

| Topic | Direction | Payload | Notes |
| --- | --- | --- | --- |
| telemetry | ESP32 to backend | `{ts, tds_ppm, ec_ms_cm, drum2_level_pct, drum2_volume_l}` | 5 s, 1 s in MEASURING_TDS |
| state | ESP32 to backend | `{ts, fsm, batch_id, fault_code, fw}` | retained, on every change |
| actuators | ESP32 to backend | `{ts, fill_valve, dosing_pump, mixer, dist_pump}` each on/off plus source | retained |
| events | ESP32 to backend | `{ts, batch_id, state, event_type, payload}` | one per FSM transition, gate, fault |
| status | ESP32 to broker | `online` or `offline` | retained, offline set by Last Will |
| cmd/batch/start | backend to ESP32 | `{cmd_id, user, trigger}` | validated against FSM and interlocks |
| cmd/batch/abort | backend to ESP32 | `{cmd_id, user}` | [PROPOSED] safe-stop, confirm in SPEC |
| cmd/fault/reset | backend to ESP32 | `{cmd_id, user}` | only when fault cause cleared |
| cmd/actuator/{name} | backend to ESP32 | `{cmd_id, user, state}` | manual mode, interlocks still apply |
| cmd/config/set | backend to ESP32 | `{cmd_id, key, value}` | target, gate band, timings |
| ack/{cmd_id} | ESP32 to backend | `{cmd_id, result: accepted or rejected, reason}` | reason names the interlock or state |

## Other sources

PostgreSQL as system of record, Telegram Bot API as notification sink, system clock on the Pi. Time source when the Pi has no internet is an open question, see 18_DECISIONS D-020.

## Validation at ingest

Reject telemetry with TDS outside 0 to 5000 ppm or level outside 0 to 100 percent and raise a sensor-fault alert. Drop duplicate events by (batch_id, ts, event_type, state). Mark data stale in the UI if no telemetry for 15 s.
