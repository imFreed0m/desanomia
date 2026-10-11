# Desanomia

> Precision IoT edge system and industrial cockpit for semi-automated greenhouse fertigation.

Desanomia is an edge-first IoT control and monitoring platform engineered for the **DESANOMI Greenhouse** (Greenhouse Utama), managing precision nutrient formulation and scheduled irrigation across **980 planting points** in **6 raised beds (B1–B6)**.

---

## System Architecture

The on-site edge gateway runs on a **Beelink EQ12 Mini PC (Intel N100)** deployed directly in the greenhouse panel room, coordinating bare-metal microcontroller control, local persistence, and offline display terminals.

```
+-----------------------------------------------------------------------------------------+
|                        BEELINK EQ12 MINI PC ON-SITE EDGE GATEWAY                        |
|                                                                                         |
|   +--------------------+     +---------------------+     +--------------------------+   |
|   | Eclipse Mosquitto  |     |   FastAPI Backend   |     |      PostgreSQL 16       |   |
|   | MQTT 2.0 (OT LAN)  |<--->| Python 3.12 / Async |<--->| Monthly Range Partition  |   |
|   +--------------------+     +----------+----------+     +--------------------------+   |
|             ^                           |                                               |
|             | (OT Fieldbus:             | (WebSocket 1.0 Hz                             |
|             |  192.168.10.0/24)         |  & REST API)                                  |
|             v                           v                                               |
|   +--------------------+     +------------------------------------------------------+   |
|   |  ESP32-S3 N16R8    |     |                 Nginx Reverse Proxy                  |   |
|   | FreeRTOS Firmware  |     |             100% Offline React + Vite SPA            |   |
|   | 12-State FSM Core  |     +--------------------------+---------------------------+   |
|   +--------------------+                                |                               |
+---------------------------------------------------------|-------------------------------+
                                                          |
                 +----------------------------------------+---------------------------------------+
                 |                                        |                                       |
                 v                                        v                                       v
   +---------------------------+            +---------------------------+           +---------------------------+
   | Primary HMI Kiosk (15.6") |            | Gazebo Showcase TV (43")  |           |     Mobile Web (PWA)      |
   | Cage Wayland / Chromium   |            | Fully Kiosk Browser (LAN) |           | Tailscale VPN Over WAN    |
   | 100% Offline Touch Screen |            | 24/7 Passive Billboard    |           | Remote Operational Access |
   +---------------------------+            +---------------------------+           +---------------------------+
```

---

## Domain Boundaries & Project Map

| Directory | Subsystem | Stack & Description |
| :--- | :--- | :--- |
| [`brain/`](file:///home/maria_zahra/Documents/projects/greenhouse/desanomia/brain/) | **System Authority (SOTT)** | Single Source of Truth for specifications, PRD, TRD, API contracts, decisions (`D-001`–`D-050`), and microtasks. |
| [`frontend/`](file:///home/maria_zahra/Documents/projects/greenhouse/desanomia/frontend/) | **Industrial Cockpit UI** | React 18/19 SPA, Vite, TypeScript, Tailwind CSS, shadcn/ui. 100% offline bundle. |
| [`backend/`](file:///home/maria_zahra/Documents/projects/greenhouse/desanomia/backend/) | **Core Edge Services** | FastAPI, Python 3.12, SQLAlchemy 2.0 (asyncpg), PostgreSQL 16, Mosquitto MQTT bridge, WebSockets. |
| [`firmware/`](file:///home/maria_zahra/Documents/projects/greenhouse/desanomia/firmware/) | **Embedded Microcontroller** | ESP32-S3 N16R8, FreeRTOS, PlatformIO, W5500 SPI Ethernet (`192.168.10.20`), active-LOW relays. |
| [`simulator/`](file:///home/maria_zahra/Documents/projects/greenhouse/desanomia/simulator/) | **Hardware Test Bench** | Python MQTT simulator modeling the 12-state FSM, fluid dynamics, and HTTP fault injection port (`9099`). |
| [`deploy/`](file:///home/maria_zahra/Documents/projects/greenhouse/desanomia/deploy/) | **Infrastructure & Ops** | Hardened Docker Compose production stack, Nginx tri-listener routing, systemd kiosk runner. |
| [`hardware/`](file:///home/maria_zahra/Documents/projects/greenhouse/desanomia/hardware/) | **Electrical & Physical** | Hardware schematics, bill of materials (BOM), sensor wiring pinouts, and relay protection specs. |
| [`docs/`](file:///home/maria_zahra/Documents/projects/greenhouse/desanomia/docs/) | **Historical Documentation** | Baseline specifications, field dosing benchmarks, and architectural design archives. |

---

## Core Operational Invariants

1. **Authority Model:** Authority strictly follows [`brain/00_MASTER_RULES.md`](file:///home/maria_zahra/Documents/projects/greenhouse/desanomia/brain/00_MASTER_RULES.md) and [`brain/18_DECISIONS.md`](file:///home/maria_zahra/Documents/projects/greenhouse/desanomia/brain/18_DECISIONS.md). All application layers derive state from `brain/`.
2. **The Seven Firmware Safety Interlocks (IL-01 to IL-07):** Evaluated synchronously every 50 ms on ESP32 Core 1. Safety interlocks run bare-metal and cannot be bypassed via UI, network, or backend:
   * **IL-01 (TDS Gate):** Distribution locked OFF if mean TDS is outside `[Target − 50, Target + 50] ppm` (e.g. 1200–1300 ppm for Generatif).
   * **IL-02 (Radar Dry-Run Cutoff):** Distribution pump de-energized in $\le 200\text{ ms}$ if Drum 2 level $< 6.0\text{ L}$.
   * **IL-03 (Batch Depletion Guard):** New batch command rejected if Drum 2 level $> 8.0\text{ L}$.
   * **IL-04 (Dual-Stage Fill Guard):** Solenoid closed if early rise $< 1.0\text{ L}$ in 90 s, or total fill $> 20\text{ min}$.
   * **IL-05 (Water Baseline & Sensor Plausibility):** Aborted if raw water TDS $< 50\text{ ppm}$, $> 2000\text{ ppm}$, or baseline $\ge 350\text{ ppm}$.
   * **IL-06 (Radar Watchdog):** Actuators de-energized if UART communication is silent $> 3.0\text{ s}$.
   * **IL-07 (Emergency Stop Guard):** Relays de-energized in $0\text{ ms}$ (hardware NC coil circuit cut) and $< 1\text{ }\mu\text{s}$ (`IRAM_ATTR` ISR).
3. **Dual-NIC Network Air-Gap (`D-043`):**
   * **OT Fieldbus (`ETH0`, `192.168.10.0/24`):** Strictly isolated to ESP32-S3 and Mosquitto MQTT broker.
   * **IT / WAN Uplink (`ETH1`, `192.168.1.0/24`):** Connects to Nginx HTTPS, Gazebo TV, and Tailscale VPN.
   * Cross-subnet packet forwarding is disabled (`net.ipv4.ip_forward = 0`).
4. **100% Offline Capability (`Rule 7`):** The primary operator kiosk runs without an active internet connection. Static assets, fonts (Space Grotesk, Geist Sans, Geist Mono), and libraries are bundled locally with zero CDN dependencies.
5. **Pessimistic UI Mutation (`D-025`):** Actuation triggers disable immediately on click with zero double-dispatch, confirming state only upon receipt of verified hardware telemetry.

---

## Development & Verification

### Code Formatting and Pre-Commit Hooks

Pre-commit hooks validate formatting, JSON/YAML schemas, and style across all domains:

```bash
uvx pre-commit run --all-files
```

### Domain Quick Links

* [Master System Rules](file:///home/maria_zahra/Documents/projects/greenhouse/desanomia/brain/00_MASTER_RULES.md)
* [System Architecture](file:///home/maria_zahra/Documents/projects/greenhouse/desanomia/brain/05_ARCHITECTURE.md)
* [UI & Industrial Cockpit Specification](file:///home/maria_zahra/Documents/projects/greenhouse/desanomia/brain/12_UI_SPEC.md)
* [Microtasks Roadmap](file:///home/maria_zahra/Documents/projects/greenhouse/desanomia/brain/17_MICROTASKS.md)
* [Architectural Decisions Catalog](file:///home/maria_zahra/Documents/projects/greenhouse/desanomia/brain/18_DECISIONS.md)
