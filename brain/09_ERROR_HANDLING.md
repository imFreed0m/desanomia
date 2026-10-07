# 09 Error Handling

Principle: the process fails safe in firmware first, the backend reports honestly, the UI never hides uncertainty.

## Fault taxonomy [PROPOSED, map codes to SPEC]

| Class | Examples | Raised by | Effect |
| --- | --- | --- |
| Interlock | Any of IL-01 to IL-05 triggered | Firmware | Outputs forced safe, fault latched |
| Gate failure | TDS outside 550 to 650 at GATE_EVALUATE | Firmware | Distribution blocked, fault latched, no re-dose |
| Sensor | TDS or level out of range, flatline, timeout | Firmware | Batch halts safely, fault latched |
| Timeout | A state exceeds its max duration | Firmware | Safe halt, fault latched |
| Comms | Broker down, ESP32 offline, ack timeout | Backend | Alert, UI stale, no commands |
| Backend | DB down, internal error | Backend | 5xx, alert, process unaffected |

Fault codes are short stable strings (for example `GATE_FAIL`, `SENSOR_TDS_RANGE`, `STATE_TIMEOUT_DOSING`). Add the SPEC interlock codes when copied into 10.

## Fault lifecycle

Raised, latched, alerted, acknowledged by Operator via Reset Fault, cleared. Reset is accepted only when the firmware confirms the cause is gone. Every step writes faults and audit_log rows.

## Behavior matrix

| Event | Firmware | Backend | UI |
| --- | --- | --- | --- |
| Broker or backend down mid-batch | Continues to safe end, buffers events | n/a | n/a |
| ESP32 offline | Autonomous | Marks offline, Telegram alert after 30 s, rejects commands with DEVICE_OFFLINE | Stale banner, buttons disabled |
| Command rejected | Ack with reason | Returns reason | Shows reason verbatim |
| Command ack timeout | Unknown | COMMAND_TIMEOUT, does not retry state-changing commands | Shows timeout, prompts to check state |
| Duplicate start | Rejects, not IDLE | Maps to INVALID_STATE | Shows reason |
| Power loss mid-batch | Boots IDLE with latched fault | Logs batch as aborted | Fault banner |
| DB write failure | n/a | Buffers telemetry in memory, retries, alerts | Live data unaffected |

## Backend rules

Never retry a state-changing command automatically. Use idempotent `cmd_id`. MQTT reconnect with exponential backoff capped at 30 s. Structured JSON logs with request id, user id, cmd_id. Unhandled exceptions return INTERNAL without internals.

## Alerts (Telegram)

Send on: fault raised, gate failure, device offline over 30 s, batch completed with result, repeated login failures. Deduplicate by code within 10 minutes. If Telegram is unreachable, queue and mark telegram_sent false, retry with backoff. Message includes batch id, state, fault code, last TDS.

## Frontend rules

Error boundaries per page. Distinguish network error, auth expired (redirect to login), and server error. Never show a stack trace.
