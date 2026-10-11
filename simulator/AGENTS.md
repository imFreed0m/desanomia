# Hardware Simulator & Test Bench

Applies only to `simulator/**`.

## Rules

- Preserve simulator fidelity with ESP32 firmware and MQTT contracts (`desanomia/gh1/*`).
- Accurately simulate 12-state FSM transitions, sensor conditioning (TDS, temperature, radar), and safety interlock behaviors.
- Do not modify `backend/**`, `firmware/**`, or `frontend/**` for a simulator-only task.
- Ensure fault injection endpoints (`localhost:9099`) mirror physical edge failure modes.
- Run simulator tests and verify MQTT telemetry frames after modifications.
