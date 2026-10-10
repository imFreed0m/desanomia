# 15 Deployment

Docker Compose on Beelink EQ12 Mini PC (Intel N100, x86_64, 16GB DDR5, 500GB NVMe SSD). [SPEC stack, aligned with 00_MASTER_RULES.md, 04_TRD.md, 05_ARCHITECTURE.md, and 18_DECISIONS.md D-005]

## Services

| Service | Image | Notes |
| --- | --- | --- |
| mosquitto | eclipse-mosquitto:2 | Bound strictly to `192.168.10.1:1883` on `ETH0` (OT fieldbus). Password file and topic ACLs mounted read-only. |
| postgres | postgres:16-alpine | Native monthly range partitioning (`telemetry`), 5s RAM write buffer, NVMe storage with zstd backup. |
| backend | built from `backend/` (`linux/amd64`) | FastAPI Python 3.12, aiomqtt, SQLAlchemy 2.0 async, depends on postgres and mosquitto healthy. |
| frontend | nginx:alpine serving static Vite build | Binds to loopback `:8080` (Kiosk) and `ETH1 :443` (TLS via local CA). Reverse proxies `/api` and `/ws` to backend. |

Tailscale mesh VPN runs on the Beelink EQ12 host OS (binding to `ETH1`). Compose file `deploy/docker-compose.yml`, environment variables in `deploy/.env` (not committed to git), `deploy/.env.example` committed.

## Edge Hardware & Network Topology (D-043)

- **Host Machine:** Beelink EQ12 Mini PC (Intel N100 Alder Lake-N, 4 cores @ 3.4GHz, 16GB DDR5, 500GB NVMe SSD, Dual Intel i225-V/i226-V 2.5 GbE NICs).
- **Dual NIC Hardware Isolation:**
  - `ETH0` (`192.168.10.1/24`): Dedicated isolated OT Industrial fieldbus connected to unmanaged industrial switch and ESP32-S3 (`192.168.10.20` via W5500 SPI Ethernet). Mosquitto binds strictly to this subnet.
  - `ETH1` (`192.168.1.10/24`): IT / Uplink connected to Orbit Star H2 4G modem (`192.168.1.1`), Tenda O1 Gazebo PTP bridge (Gazebo TV `192.168.1.50`), and Tailscale VPN. Linux kernel forwarding is dropped between interfaces.
- **Power & Auto-Boot:** Powered via 12V 3A DC adapter connected to panel UPS; BIOS AMI configured with `Restore on AC Power Loss: Always On` to auto-boot upon AC mains restoration.

## Control-Room Kiosk Screen (Tier 1)

UPERFECT BE156PF 15.6" FHD IPS touchscreen mounted on 90 cm standing kiosk in the control room, connected via HDMI 2.0 and USB-C touch data directly to the Beelink EQ12. Runs on Debian 12 Minimal with Cage Wayland compositor auto-launching Chromium in GPU-accelerated kiosk mode (`http://127.0.0.1:8080`). 100% offline-first operation with zero internet dependency, persistent local Operator session, and 1-tap Emergency Stop.

## Time Synchronization (D-020)

Motherboard CR2032 battery-backed CMOS RTC (`/dev/rtc0`) serves as authoritative hardware time master on cold boot (`hwclock --hctsys`). Debian host runs `chrony` configured as a local Stratum-10 NTP server on OT LAN (`192.168.10.1:123`), disciplining ESP32-S3 hardware clock every 60 minutes. When 4G WAN is active, Chrony synchronizes against `pool.ntp.org` and updates the CMOS RTC (`hwclock --systohc`).

## Release & Update Lifecycle

1. CI builds `linux/amd64` images, pushes to GHCR on release tag (see `14_GITHUB_ACTIONS.md`).
2. On Beelink EQ12: `docker compose pull && docker compose up -d`, execute Alembic migrations via `docker compose exec backend alembic upgrade head`.
3. Updates permitted only while FSM is strictly in `IDLE`.
4. Rollback: maintain previous image tag in `.env`, revert instantly with `docker compose up -d`.
5. Firmware OTA delivered over OT LAN from Beelink reverse proxy to ESP32 app0/app1 partitions.

## Backups & Retention (D-044)

- **Retention:** Raw `telemetry` retained for 90–120 days via monthly partition drops once 1-minute historical rollups in `telemetry_1m` (retained 2 years) are complete.
- **Dual-Target Backups:**
  - *Target A (Local NVMe):* Automated nightly `pg_dump` compressed with `zstd` stored in `/var/backups/postgres` (retains 30 daily snapshots).
  - *Target B (Off-Device):* Nightly rsync mirrors snapshots to mounted external USB drive and synchronizes over Tailscale to off-site backup storage.

## Monitoring

Docker Compose healthchecks on all containers, `/health` HTTP endpoint, immediate Telegram alert on broker or database disruption, NVMe disk usage alert at 80% threshold.
