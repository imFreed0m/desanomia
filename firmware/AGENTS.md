# Firmware / ESP32

Applies only to `firmware/**`.

## Safety authority

Firmware owns local safety interlocks and actuator protection. Backend/frontend commands must never bypass firmware guards.

Safety thresholds and frozen constants are canonical in:
- `docs/CONSTITUTION.md`
- `docs/SPEC.md`

Read those documents before changing dosing, water filling, sensor validation, actuator control, or safety state machines.

## Rules

- Preserve ESP32/FreeRTOS architecture unless explicitly changing it.
- Preserve sensor conditioning and calibration behavior, including ADC settling and filtering.
- Do not introduce rejected hardware architecture or closed-loop auto-dosing.
- Prefer native FreeRTOS/platform primitives and existing firmware utilities.
- Keep actuator operations bounded, recoverable, and watchdog-safe.
- Verify firmware changes with the relevant build, tests, and hardware/simulation checks available in the repository.
- Do not modify `frontend/**` or `backend/**` for a firmware-only task.
