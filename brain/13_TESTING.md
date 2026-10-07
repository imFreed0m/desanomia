# 13 Testing

Priority is process safety, then command correctness, then UI. [PROPOSED]

## Layers

| Layer | Tooling | Scope |
| --- | --- | --- |
| Firmware unit | PlatformIO native, Unity or GoogleTest | FSM transitions, gate, interlocks, dose calculation |
| Backend unit | pytest | RBAC, command building, payload validation, retention jobs |
| Backend integration | pytest with real PostgreSQL and Mosquitto | subscriber persistence, command and ack round trip, WebSocket fan-out |
| Frontend unit | vitest and Testing Library | stores, gauge thresholds, button enablement rules |
| End to end | Playwright against compose stack plus simulator | login, start batch, live updates, fault and reset, role restrictions |
| Hardware in the loop | bench with real ESP32, water only | actuator wiring, sensor reads, interlock triggering |

## Must-have firmware tests

1. Gate boundaries: 549, 550, 600, 650, 651 ppm, plus NaN and sensor error. Confirm inclusivity against SPEC.
2. Every FSM state: valid transitions only, timeout per state, fault latch from every state.
3. Each of the 5 interlocks: trips on its condition, forces outputs safe, cannot be overridden in AUTO or MANUAL, reset rule works.
4. Gate failure never reaches DISTRIBUTING and never triggers re-dose.
5. Reboot mid-batch lands in IDLE with latched fault, outputs low.
6. Connectivity loss mid-batch: batch finishes safely, events flushed on reconnect.
7. Commands rejected with the right reason: wrong state, active fault, interlock.

## Backend must-haves

Viewer cannot call any command endpoint (403). Start is rejected when device offline (409). Duplicate start with same cmd_id is idempotent. Audit row written for every command. Command timeout produces `timeout`, no retry. Payload outside valid ranges raises sensor alert.

## Simulator

`simulator/` is a Python ESP32 stand-in speaking the 07 topics, with a deterministic FSM, configurable timings, and fault injection (sensor out of range, gate fail, offline, interlock trip). Used by integration and E2E tests and for UI development without hardware.

## Frontend must-haves

Gauge color and text at 549, 550, 575, 625, 650, 651. Buttons disabled when offline, in fault, or not IDLE. Viewer sees no command controls. Stale banner on socket loss. Offline-origin check passes.

## Coverage targets [PROPOSED]

Firmware safety modules 100% branch coverage. Backend 85% lines. Frontend logic 80%. Coverage gaps in safety modules block merge.

## Hardware acceptance

See 16_PRODUCTION_CHECKLIST. Full batch with water only before any fertilizer, then a supervised first fertilizer batch.
