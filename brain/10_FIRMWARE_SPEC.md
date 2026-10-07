# 10 Firmware Spec

ESP32 with FreeRTOS, PlatformIO project. [SPEC stack, structure PROPOSED]

## Tasks [PROPOSED]

sensor_task (read TDS and radar, filter), fsm_task (state machine and gate), interlock_task (evaluate all 5 interlocks every cycle, highest priority, drives outputs low on violation), actuator_task (single owner of GPIO outputs), mqtt_task (publish, subscribe, reconnect with backoff), ota_task, watchdog on all tasks. Only actuator_task writes outputs, and every output request passes through the interlock check first.

## Interlocks [SPEC]

Five interlocks enforced here, active in AUTO and MANUAL, no override path. Copy the exact definitions from SPEC.md into this table before implementing.

| ID | Condition | Action | Reset rule |
| --- | --- | --- | --- |
| IL-01 | copy from SPEC.md | | |
| IL-02 | copy from SPEC.md | | |
| IL-03 | copy from SPEC.md | | |
| IL-04 | copy from SPEC.md | | |
| IL-05 | copy from SPEC.md | | |

Categories worth checking against the SPEC list for gaps, not the list itself: dry-run protection on pumps, Drum 2 overflow, sensor invalid or out of range, dose over-limit, simultaneous conflicting actuators, distribution without a passed gate.

## FSM and gate

States per 05_ARCHITECTURE. Transitions are driven by sensor conditions and timers read from config. GATE_EVALUATE passes only if the measured TDS is within the gate band, inclusive of 550 and 650 [VERIFY inclusivity]. Failure latches a fault, blocks DISTRIBUTING, and does not trigger re-dosing.

## Behavior on connectivity loss [PROPOSED]

Active batch continues to a safe end using stored config. Events are buffered in RAM (bounded ring) and flushed on reconnect. Commands are accepted only while connected. Manual actuator commands expire if the link drops.

## Config and persistence

Target TDS, gate band, volumes, timings, calibration stored in NVS, changed only via cmd/config/set with ack, and reported back in state. Firmware version and config hash published on boot.

## Boot and recovery

On boot, outputs are low. If power was lost mid-batch, do not resume dosing or distribution automatically. Enter IDLE with a latched fault that an Operator must reset. [PROPOSED]

## OTA

HTTPS or MQTT-triggered OTA from the Pi on LAN, signed images, dual-partition rollback, refused unless FSM is IDLE.

## Testing

FSM, gate, and interlock modules are hardware-free and run in host-native unit tests, see 13_TESTING.
