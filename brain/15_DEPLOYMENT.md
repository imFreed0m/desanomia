# 15 Deployment

Docker Compose on Raspberry Pi 4/5. [SPEC] Details below PROPOSED.

## Services

| Service | Image | Notes |
| --- | --- | --- |
| mosquitto | eclipse-mosquitto | password file and ACL mounted read-only, persistence volume |
| postgres | postgres:16 | named volume, healthcheck |
| backend | built from backend/ (linux/arm64) | depends on postgres and mosquitto healthy |
| frontend | nginx serving Vite dist | also reverse proxies /api and /ws to backend |

Tailscale runs on the Pi host. Compose file `deploy/docker-compose.yml`, env in `deploy/.env` (not committed), `deploy/.env.example` committed.

## Hardware

Prefer SSD over SD card for PostgreSQL. Stable PSU, UPS or at least clean shutdown path. Pi connected to the control-room monitor via HDMI and to the greenhouse network by ethernet.

## Control-room screen

Chromium in kiosk mode on the Pi or a thin client opening `http://<pi-lan-address>/`. No internet needed. Auto-start on boot, restart on crash.

## Time

ESP32 and Pi need a consistent clock without internet. Options: RTC module on the Pi plus the Pi as local NTP server for the ESP32, or Tailscale-connected NTP when online. Decide in D-020.

## Release and update

1. CI builds arm64 images, pushes to GHCR on tag (see 14).
2. On the Pi: `docker compose pull && docker compose up -d`, run Alembic migrations via a one-shot backend command.
3. Update only while FSM is IDLE. Backend restarts never interrupt a batch, but avoid anyway.
4. Rollback: keep previous image tag in `.env`, restore with `docker compose up -d`.
5. Firmware OTA is a separate flow, see 10.

## Backups

Nightly `pg_dump` to a second disk or via Tailscale to another machine, keep 14 daily and 8 weekly. Test a restore before go-live (16_PRODUCTION_CHECKLIST).

## Monitoring

Compose healthchecks, `/health` endpoint, Telegram alert if backend sees broker or database down, disk usage alert at 80 percent.
