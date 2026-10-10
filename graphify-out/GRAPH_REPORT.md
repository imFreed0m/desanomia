# Graphify Knowledge Graph Report: DESANOMIA

**Corpus:** 21 specification files in `brain/` (`00_MASTER_RULES.md` through `20_GLOSSARY.md`)  
**Graph Metrics:** 174 nodes, 258 edges across 8 functional communities.  
**Status:** 100% Authoritative Single Source of Truth (SOTT) graph with zero isolated nodes.

---

## Top 10 God Nodes (Core Architectural Pillars)
The highest-degree nodes represent the primary architectural integration hubs and safety bottlenecks:

1. **`React 18/19 + Vite + TS SPA Dashboard`** (Degree: 25) — *Industrial Cockpit Dashboard & Display Tiers*
2. **`FastAPI Edge Backend (Python 3.12)`** (Degree: 18) — *Contract-First API & Fieldbus Communication*
3. **`PostgreSQL 16 Relational Engine`** (Degree: 15) — *Relational Data Model & Telemetry Pipeline*
4. **`ESP32-S3 N16R8 FreeRTOS Firmware`** (Degree: 12) — *Bare-Metal Firmware & Hardware Safety*
5. **`D-003 Seven Firmware Safety Interlocks`** (Degree: 8) — *System Governance & Decision Authority*
6. **`Core 0 Ethernet, MQTT & PSRAM Task`** (Degree: 8) — *Bare-Metal Firmware & Hardware Safety*
7. **`FSM: IDLE`** (Degree: 7) — *Bare-Metal Firmware & Hardware Safety*
8. **`Semi-Closed Loop Feedforward + Single-Pass Top-Up`** (Degree: 7) — *Agricultural Requirements & Execution Microtasks*
9. **`Gated Fault Reset Protocol`** (Degree: 6) — *System Governance & Decision Authority*
10. **`Dual 2.5 GbE NIC Hardware Air-Gap`** (Degree: 6) — *Edge Platform, Dual-NIC Air-Gap & Deployment*

---

## Functional Communities Summary

### Community 0: System Governance & Decision Authority
- **Node Count:** 46
- **Key Elements:** Brain SOTT Repository, Hardware Safety Primacy Invariant, Domain Isolation & SRP, Gated Fault Reset Protocol, Zero-Conflict Hydraulic Invariant, Pause Mode (Mid-Batch Recovery) (+40 more)

### Community 1: Bare-Metal Firmware & Hardware Safety
- **Node Count:** 33
- **Key Elements:** ESP32-S3 N16R8 FreeRTOS Firmware, Core 1 Real-Time Safety & FSM Task (20 Hz), Core 0 Ethernet, MQTT & PSRAM Task, Zero-Heap Static Allocation Discipline, W5500 SPI Ethernet (192.168.10.20), 4x Active-LOW Optoisolated Relays (NO) (+27 more)

### Community 2: Edge Platform, Dual-NIC Air-Gap & Deployment
- **Node Count:** 14
- **Key Elements:** Beelink EQ12 Mini PC (Intel N100), Debian 12 Minimal Edge Host OS, Dual 2.5 GbE NIC Hardware Air-Gap, ETH0 OT Industrial Subnet (192.168.10.0/24), ETH1 IT/WAN Subnet (192.168.1.0/24), Linux nftables Forward Drop (ip_forward=0) (+8 more)

### Community 3: Relational Data Model & Telemetry Pipeline
- **Node Count:** 15
- **Key Elements:** PostgreSQL 16 Relational Engine, Alembic Versioned Migration Pipeline, table: telemetry (Monthly Range Partitioned), table: telemetry_1m (2-Year Aggregates), table: batches (Execution & Deficit Metrics), table: recipes (Agricultural Growth Presets) (+9 more)

### Community 4: Contract-First API & Fieldbus Communication
- **Node Count:** 11
- **Key Elements:** FastAPI Edge Backend (Python 3.12), CQS Asynchronous Command Model (HTTP 202), UUIDv4 cmd_id Idempotency Envelope, Pydantic v2 Strict Request/Response Schemas, WebSocket Hub (/ws/telemetry <500ms Snap, 1Hz), MQTT: desanomia/gh1/cmd (Type Discriminator) (+5 more)

### Community 5: Industrial Cockpit Dashboard & Display Tiers
- **Node Count:** 27
- **Key Elements:** React 18/19 + Vite + TS SPA Dashboard, 100% Offline Static Nginx Bundle (No CDN), Tier 1: 15.6" UPERFECT FHD HMI Kiosk (127.0.0.1), Tier 2: 43" Xiaomi TV Gazebo Mirror (192.168.1.50), Tier 3: Mobile PWA (Tailscale Mesh Access), Kiosk Persistent Operator + 15m Admin Step-Up (+21 more)

### Community 6: Testing Pyramid & Commissioning Quality Gates
- **Node Count:** 12
- **Key Elements:** 5-Tier Testing Pyramid Architecture, 100% Branch Coverage Mandate on Safety Firmware, PlatformIO GoogleTest/Unity Mocked HAL Suite, Backend Pytest-Asyncio Live PostgreSQL/MQTT Suite, Frontend Vitest & RTL Component Suite, Automated 100% Offline Asset Integrity Gate (+6 more)

### Community 7: Agricultural Requirements & Execution Microtasks
- **Node Count:** 16
- **Key Elements:** PRD Functional Requirements (FR-01 to FR-30), Semi-Closed Loop Feedforward + Single-Pass Top-Up, Recipe: Generatif 1250 ppm (Default 140L), Recipe: Vegetatif 1100 ppm, Recipe: Panen 1050 ppm, Concentrate Drum (Drum 1, 20L Stock) (+10 more)

---

## Architectural Invariants Verified by Graph Topology
1. **Safety Cutoff Primacy:** Node `Dual-Circuit NC E-Stop Switch` and `IL-07 Emergency Stop Hardware Cut` directly isolate relay power in 0 ms independently of edge host or software state.
2. **Dual-NIC Isolation Air-Gap:** Node `Dual 2.5 GbE NIC Hardware Air-Gap` cleanly separates `ETH0 OT Fieldbus` from `ETH1 IT Uplink`, with `Linux nftables Forward Drop` preventing cross-interface forwarding.
3. **Zero-Conflict Hydraulic Invariant:** Node `Single Distribution Pump Topology` links to `Zero-Conflict Hydraulic Invariant` and `UI-15 Dashboard Schedule Calendar`, mathematically preventing overlapping irrigation schedules across the 5 tank pairs.
4. **CQS Command Handshake:** All UI mutations and operator actions route through `CQS Asynchronous Command Model (HTTP 202)` and `UUIDv4 cmd_id Idempotency Envelope`, acknowledged over MQTT QoS 1 and resolved over WebSockets.
5. **100% Firmware Safety Branch Coverage:** Node `100% Branch Coverage Mandate on Safety Firmware` directly gates `PlatformIO GoogleTest/Unity Suite` and `GitHub Actions Monorepo Matrix` before merging.

---
*Generated directly from authoritative brain/ Single Source of Truth.*
