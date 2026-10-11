# Deployment & Infrastructure

Applies only to `deploy/**` and root container configurations.

## Rules

- Preserve network air-gap boundaries (OT LAN `192.168.10.0/24` vs IT WAN `192.168.1.0/24`).
- Maintain non-root container security, volume mounts, and healthcheck contracts.
- Do not commit production secrets or unencrypted credentials (`brain/00_MASTER_RULES.md` Rule 10).
- Keep Nginx tri-listener routing aligned with `brain/15_DEPLOYMENT.md`.
- Verify compose configurations with `docker compose config` before deployment changes.
