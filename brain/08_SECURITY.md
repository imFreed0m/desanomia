# 08 Security

Internal system with physical consequences. Threat priorities: unauthorized actuator or batch control, tampered firmware, loss of audit trail, exposed services. [SPEC: roles, session auth, Tailscale. Aligned with 00_MASTER_RULES.md, 04_TRD.md, 05_ARCHITECTURE.md, and 18_DECISIONS.md D-005, D-026, D-043]

## Network & Dual-NIC Segmentation (D-043)

No port forwarded directly to the internet. The Beelink EQ12 edge host enforces physical dual-NIC network segmentation:
- **`ETH0` (OT Fieldbus - `192.168.10.1/24`):** Dedicated to ESP32-S3 microcontroller (`192.168.10.20`) via unmanaged industrial switch. Eclipse Mosquitto binds strictly to `192.168.10.1:1883`. Port 1883 is completely isolated and unreachable from `ETH1`. Wi-Fi is strictly disabled on ESP32-S3.
- **`ETH1` (IT / Uplink - `192.168.1.10/24`):** Connects to Orbit Star H2 4G modem router (`192.168.1.1`), Tenda O1 Gazebo PTP bridge (`192.168.1.50`), and Tailscale mesh VPN. Nginx reverse proxy binds to ports 80 (auto-redirect) and 443 (TLS with local CA certificate).
- **Firewall Isolation:** Linux kernel drops all forwarding between `eth0` and `eth1` (`nftables` drop rules), preventing external routing into the greenhouse physical fieldbus.

## Authentication & Tier-Differentiated Sessions (D-026)

Username and password credentials hashed with Argon2id (minimum length 12). Centralized PostgreSQL sessions (`user_sessions`):
1. **Primary HMI Kiosk (15.6" Touchscreen):** Persistent local loopback `Operator` session (`127.0.0.1:8080`) with zero idle lockout, enabling instant emergency response and batch execution. Administrative settings require step-up authentication granting a 15-minute temporary Admin elevation (`is_elevated = true`).
2. **Secondary Gazebo Display (Xiaomi TV 43"):** Auto-authenticated read-only `Viewer` session via Nginx IP allowlist (`192.168.1.50`) and bearer token. Mutation endpoints return HTTP 403 Forbidden.
3. **Remote Mobile Clients / PWA:** Enforce sliding 8-hour idle timeout and 7-day absolute maximum lifetime via `HttpOnly`, `SameSite=Lax`, `Secure` cookies over Tailscale VPN / TLS port 443.
4. **User Provisioning:** Initial admin seeded via backend CLI (`python -m backend.cli seed-admin`, TR-14) with forced password change on first login. Zero self-registration.

## Authorization matrix

| Action | Viewer | Operator | Admin |
| --- | --- | --- | --- |
| View dashboard, telemetry, history, schedules | yes | yes | yes |
| Start batch, reset fault, manual actuators, edit schedules | no | yes | yes |
| User administration, recipe library defaults, system configs | no | no (or 15-min Kiosk elevation) | yes |

Enforced on every FastAPI endpoint. UI hiding is cosmetic only.

## Safety versus security

No API, database role, configuration setting, or user privilege can disable or relax the 7 firmware-enforced safety interlocks. All process parameters (TDS target, gate band) sent to firmware are verified against hard plausibility bounds compiled into ESP32 firmware before execution.

## MQTT

Client credentials per service:
- ESP32 client: `esp32_gateway`, publishing on `telemetry`, `ack`, `events`, `status`, subscribing strictly to `cmd`.
- Backend client: `backend_service`, publishing on `cmd`, subscribing to `telemetry`, `ack`, `events`, `status`.
- `allow_anonymous false` enforced. Topic ACLs prevent cross-client topic pollution. Backend validates every inbound payload schema against Pydantic models.

## Firmware & Hardware Security (D-027)

In Phase 1, ESP32-S3 eFuses remain unburned to facilitate PlatformIO UART/JTAG debugging and rapid iteration. OTA images are signed and verified against SHA-256 digests, delivered exclusively over OT LAN when FSM is in `IDLE`. Credentials stored in NVS flash. Hardware flash encryption and Secure Boot v2 reserved for Phase 2 production lockdown.

## Data, Secrets & Cryptographic Audit Trail

Secrets managed via `.env` on the Beelink EQ12 (ignored in `.gitignore`) and CI secrets. Telegram bot token and DB password rotatable. Parameterized SQL queries only (SQLAlchemy 2.0). All state-changing actions commit to `audit_logs` with SHA-256 cryptographic hash chaining (`prev_hash` $\to$ `row_hash`), strictly protected by database append-only triggers.

## Web hardening

CSRF validation on state-changing requests, strict CORS, CSP without external origins (100% offline bundled static build, zero CDNs or remote Google fonts), dependency auditing in CI.

## Incident basics

If compromise is suspected: disconnect Tailscale and Orbit Star H2 WAN uplink, rotate `.env` secrets, review tamper-evident `audit_logs` hash chain, and inspect ESP32 firmware hash.
