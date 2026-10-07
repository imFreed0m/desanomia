# 08 Security

Internal system with physical consequences. Threat priorities: unauthorized actuator or batch control, tampered firmware, loss of audit trail, exposed services. [SPEC: roles, session auth, Tailscale. Rest PROPOSED]

## Network

No port forwarded to the internet. Services bind to the Pi LAN and Tailscale interface only. Remote access via Tailscale with ACLs limiting access to the Pi on ports 80 or 443. Mosquitto listens on LAN only. ESP32 and Pi on an isolated greenhouse VLAN or dedicated switch if available.

## Authentication and sessions

Username and password, argon2id hashes, minimum length 12. Server-side sessions, random 256-bit id, httpOnly Secure SameSite=Strict cookie, idle expiry and absolute expiry (set values in settings). Login rate limit per IP and username, generic error message. Admin creates users, no self-registration. Control-room kiosk uses a dedicated viewer account.

## Authorization matrix

| Action | Viewer | Operator | Admin |
| --- | --- | --- | --- |
| View dashboard, history, schedules | yes | yes | yes |
| Start batch, reset fault, manual actuators, edit schedules | no | yes | yes |
| Manage users, change process settings | no | no | yes |

Enforce in the backend on every endpoint. UI hiding is cosmetic only.

## Safety versus security

No API, setting, or role can disable or relax an interlock. Process settings (target, gate band) accepted by firmware only within hard limits compiled into firmware.

## MQTT

Username and password per client, ACLs: ESP32 may publish telemetry, state, actuators, events, status, ack and subscribe to cmd. Backend may subscribe to device topics and publish cmd. No anonymous access. Add TLS if the greenhouse network is shared. Backend validates every inbound payload schema.

## Firmware

Signed OTA images, rollback partition, OTA only in IDLE. Credentials in NVS, flash encryption and secure boot considered before production. [PROPOSED]

## Data and secrets

Secrets in `.env` on the Pi (not in git), GitHub Actions secrets for CI. Telegram token and DB password rotatable. Parameterized queries only. Pi disk backups encrypted. Audit log covers logins, failed logins, every command, user changes, setting changes, OTA.

## Web hardening

CSRF header on state-changing requests, strict CORS (same origin), CSP without external origins (also supports the offline rule), dependency scanning in CI (pip-audit, npm audit, Dependabot).

## Incident basics

If compromise is suspected: disconnect Tailscale, rotate all secrets, review audit_log, verify firmware hash reported on boot.
