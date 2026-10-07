# 04 TRD

## Stack [SPEC]

Firmware: ESP32 + FreeRTOS, OTA-capable. Broker: Mosquitto MQTT. Backend: FastAPI (Python) with aiomqtt and WebSocket. Database: PostgreSQL. Frontend: React + Vite + TypeScript + Tailwind CSS + shadcn/ui + Apache ECharts. Deploy: Docker Compose on Raspberry Pi 4/5. Alerts: Telegram Bot. Network: internal only, remote access via Tailscale.

## Constraints

1. Control-room monitor has no WiFi or internet. It reaches the Pi over local wired LAN. Frontend is a static Vite bundle served by the Pi, all assets bundled, no external fonts or CDNs.
2. Tailscale is for remote access only. Local control must work when internet is down.
3. Process safety must not depend on backend, broker, or network. The ESP32 completes or safely halts a batch on its own.
4. Raspberry Pi runs everything in containers on SD or SSD, so write volume (telemetry) must be bounded.

## Non-functional requirements [PROPOSED]

State propagation ESP32 to UI under 2 s on LAN. Telemetry every 5 s (1 s during MEASURING_TDS). API p95 under 300 ms. Raw telemetry retained 90 days, then 1-minute aggregates kept 2 years. Command delivery acknowledged within 3 s or surfaced as failed. Backend restart must not interrupt a running batch. Daily database backup.

## Interfaces

MQTT between ESP32 and backend (see 07_DATA_SOURCES). REST and WebSocket between backend and UI (see 11_API_CONTRACT). Telegram HTTPS from backend when internet is available, queued otherwise.

## Backend conventions [PROPOSED]

Python 3.12, async SQLAlchemy 2 with Alembic migrations, Pydantic v2 models, ruff, mypy strict on app code, pytest with pytest-asyncio.

## Frontend conventions [PROPOSED]

TypeScript strict, TanStack Query for REST, a single WebSocket store for live state, ECharts via a thin wrapper, shadcn/ui components, vitest and Playwright.

## Firmware conventions [PROPOSED]

PlatformIO project, FreeRTOS tasks per concern, FSM and interlock logic in pure C++ modules with no hardware calls so they run in host-native unit tests.
