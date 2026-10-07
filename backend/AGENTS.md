# Backend / Edge

Applies only to `backend/**`, `docker-compose.yml`, and `docker/**`.

## Rules

- Preserve API, MQTT, persistence, and service boundaries unless explicitly changing architecture.
- Treat schemas, validation, idempotency, state transitions, and error handling as correctness boundaries.
- Do not move hardware safety authority into the backend; firmware remains authoritative for safety interlocks.
- Do not modify `frontend/**` or `firmware/**` for a backend-only task.
- Load the relevant backend/infrastructure skill before substantial changes.
- Verify API contracts and run the narrowest relevant tests/checks after modification.
