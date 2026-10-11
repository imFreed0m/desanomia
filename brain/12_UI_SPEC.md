# 12 UI Specification

> **Authority Notice:** Single Source of Truth (SOTT) for Desanomia's Light Minimalist Cockpit user interface architecture, multi-tier display environments, component registry (`UI-01` to `UI-26`), client state management, WebSocket telemetry ingestion, touch ergonomics, and accessibility. Governed by [00_MASTER_RULES.md](file:///home/maria_zahra/Documents/projects/greenhouse/desanomia/brain/00_MASTER_RULES.md), [03_UI_UX_BRIEF.md](file:///home/maria_zahra/Documents/projects/greenhouse/desanomia/brain/03_UI_UX_BRIEF.md), [04_TRD.md](file:///home/maria_zahra/Documents/projects/greenhouse/desanomia/brain/04_TRD.md), [08_SECURITY.md](file:///home/maria_zahra/Documents/projects/greenhouse/desanomia/brain/08_SECURITY.md), [09_ERROR_HANDLING.md](file:///home/maria_zahra/Documents/projects/greenhouse/desanomia/brain/09_ERROR_HANDLING.md), [10_FIRMWARE_SPEC.md](file:///home/maria_zahra/Documents/projects/greenhouse/desanomia/brain/10_FIRMWARE_SPEC.md), [11_API_CONTRACT.md](file:///home/maria_zahra/Documents/projects/greenhouse/desanomia/brain/11_API_CONTRACT.md), [18_DECISIONS.md](file:///home/maria_zahra/Documents/projects/greenhouse/desanomia/brain/18_DECISIONS.md) (including `D-001` through `D-050`), and [`DESIGN.md`](file:///home/maria_zahra/Documents/projects/greenhouse/desanomia/docs/DESIGN.md).

---

## 1. Architecture & Tech Stack

Desanomia implements an offline-first Single Page Application (SPA) architecture served locally from the Beelink EQ12 Mini PC (Intel N100) edge gateway via Nginx.

```
                                 +--------------------------------------------+
                                 |         Beelink EQ12 Mini PC Edge          |
                                 |  Nginx Static HTTP Server (Port 80/443)    |
                                 +---------------------+----------------------+
                                                       |
                             +-------------------------+-------------------------+
                             |                                                   |
                             v                                                   v
               +---------------------------+                       +---------------------------+
               |  Primary HMI Kiosk (15.6")|                       | Gazebo Billboard TV (43") |
               | Cage Wayland / Chromium   |                       | Fully Kiosk Browser (TV)  |
               | Loopback: 127.0.0.1:8080  |                       | Wired LAN: 192.168.1.50   |
               | Interactive Cockpit       |                       | Passive 24/7 Showcase     |
               +---------------------------+                       +---------------------------+
                                                       |
                                                       v
                                         +---------------------------+
                                         |    Mobile Client (PWA)    |
                                         | Smart Phone (iOS/Android) |
                                         | Tailscale VPN Client      |
                                         | Protected Remote Ops      |
                                         +---------------------------+
```

### 1.1 Core Technology Stack

- **Core Framework:** React 18/19 SPA with TypeScript (`strict: true`).
- **Build System & Dev Server:** Vite 5+ configured for 100% offline static production builds (`dist/`).
- **Forbidden Regressions ([`D-005`](file:///home/maria_zahra/Documents/projects/greenhouse/desanomia/brain/18_DECISIONS.md#L22)):** Next.js, React Server Components (RSC), and Server Actions are strictly prohibited. The system must operate fully decoupled from node runtime servers.
- **Styling & Design System ([`D-029`](file:///home/maria_zahra/Documents/projects/greenhouse/desanomia/brain/18_DECISIONS.md#L74), `D-050`):** Tailwind CSS 3.4+ configured with `@tailwindcss/container-queries`, modern `oklch()` color spaces with hex fallbacks, and light minimalist laboratory tokens matching [`DESIGN.md`](file:///home/maria_zahra/Documents/projects/greenhouse/desanomia/docs/DESIGN.md).
- **Component Primitives (`D-050`):** shadcn/ui built on headless Radix UI accessible primitives. Standardizing on Radix UI dialogs eliminates browser-level `showModal()` top-layer inert traps, guaranteeing that the top navigation Master Emergency Stop (E-Stop) bar remains permanently clickable at `z-[100]`.
- **Data Visualization:** Apache ECharts 5+ for historical time-series telemetry charts with canvas-accelerated rendering and `lttb` downsampling.
- **Fluid Surface Physics Engine ([`D-046`](file:///home/maria_zahra/Documents/projects/greenhouse/desanomia/brain/18_DECISIONS.md#L108)):** Dual-layer HTML5 Canvas 2D procedural sine-wave engine rendering fluid hydrodynamics at 60 FPS without WebGL/Three.js overhead. The `requestAnimationFrame` loop automatically pauses during static or standby states to preserve CPU resources.
- **Icons & Visuals:** Lucide React icons bundled locally as SVG vectors.
- **Client State Management:** Zustand 4+ with fine-grained atomic selectors and `useShallow` middleware for compound object slices.
- **Network Ingestion:** Native WebSocket client connected to `/api/v1/ws/telemetry` with full-jitter exponential backoff, coupled with Fetch for CQS HTTP REST command dispatch.

### 1.2 100% Offline Asset Bundling Rule

The greenhouse installation operates in agricultural environments with intermittent WAN connectivity. The frontend bundle is entirely self-contained:
1. **Zero CDN Dependencies:** No external scripts (`<script src="https://...">`), stylesheets, or remote images.
2. **Self-Hosted Variable Fonts:** Space Grotesk, Geist Sans, and Geist Mono are bundled in `frontend/public/fonts/` as `.woff2` files and loaded via local `@font-face` declarations.
3. **Automated CI Integrity Check:** The production build pipeline executes a verification grep script:
   ```bash
   grep -riE "(https?://|fonts\.googleapis|cdn\.)" frontend/dist/ && exit 1 || echo "Offline bundle clean"
   ```
   If any external origin or protocol link is detected in the compiled output, the CI pipeline fails immediately.

---

## 2. Multi-Tier Display Environments & Touch Ergonomics

Per decisions [`D-014`](file:///home/maria_zahra/Documents/projects/greenhouse/desanomia/brain/18_DECISIONS.md#L40), [`D-019`](file:///home/maria_zahra/Documents/projects/greenhouse/desanomia/brain/18_DECISIONS.md#L50), [`D-026`](file:///home/maria_zahra/Documents/projects/greenhouse/desanomia/brain/18_DECISIONS.md#L64), and `D-050`, Desanomia serves three distinct hardware display tiers with tailored behavioral profiles:

| Specification Parameter | Tier 1: Primary HMI Kiosk | Tier 2: Gazebo Monitoring TV | Tier 3: Mobile PWA Client |
| :--- | :--- | :--- | :--- |
| **Target Hardware** | UPERFECT BE185EF 15.6" IPS FHD (1920×1080, 355×223×11/6 mm) | Xiaomi TV A 43" Google TV FHD (1920×1080) | Smartphone Browsers (Safari / Chrome, 360–430px) |
| **Physical Mounting** | Standing console (90 cm height) in Panel Room | VESA 200×200 wall bracket in Gazebo Dining/Lounge | Handheld field operator mobile device |
| **Windowing / Runtime** | Cage Wayland compositor running Chromium kiosk | Fully Kiosk Browser on Android TV (Wired LAN) | Mobile Safari / Chrome running as standalone PWA |
| **Network Path** | Direct HDMI 2.0 + USB-C touch loopback (`127.0.0.1:8080`)| Wired Ethernet (`192.168.1.50`) via PTP bridge | Tailscale Mesh VPN (`100.x.y.z`) over 4G uplink |
| **User Role & Session** | Persistent `Operator` session; 15-min Admin step-up PIN| Locked `Viewer` role (auto-authenticated by IP) | Authenticated `Operator` or `Admin` (8h sliding / 7d max) |
| **Emergency Stop (E-Stop)**| **Instant 1-Tap Pill** ($64 \times 64\text{ px}$, $z\text{-}[100]$ persistent)| **Hidden** (Passive billboard display) | **2-Step Gated Confirmation Modal** (`aria-modal="true"`) |
| **Interaction Mode** | 10-point capacitive touch (cursor hidden) | Read-only passive billboard (remote D-pad disabled) | Responsive mobile touch / scrollable stack |
| **Screen Budget** | Fixed 1920×1080 viewport (**Zero vertical scroll on Dashboard**)| Fixed 1920×1080 (**Dedicated 30/70 Split Layout**)| Fluid vertical stack with sticky bottom control pill |
| **Outage Recovery** | Service Worker offline shell + local retry loop | Service Worker offline shell + local retry loop | Stale indicator pill with manual tap-to-reconnect |

### 2.1 Panel Room Touch Ergonomics Invariant (D-019, D-050)

Greenhouse operators frequently operate the HMI kiosk while wearing nitrile gloves or with damp hands. The interface strictly enforces tactile touch geometry:
- **Emergency Stop Button:** Minimum touch bounding box of **$56 \times 56\text{ CSS px}$** (Kiosk top right header renders a $64 \times 64\text{ px}$ pill at `z-[100]`). Touching this button immediately locks the local UI in $< 16\text{ ms}$, dispatches MQTT `ESTOP` with software cutoff p95 $< 100\text{ ms}$, while physical NC contacts break relay coil power in $0\text{ ms}$.
- **Routine Operational Controls:** Minimum touch bounding box of **$56 \times 56\text{ CSS px}$** (`min-h-[56px] min-w-[56px]`) across all Tier 1 buttons. Critical batch initiation triggers are engineered at **$64\text{ px}$** height.
- **Button Spacing:** Adjacent operational buttons maintain a minimum physical clearance of **$12\text{ px}$** to eliminate accidental neighboring triggers.
- **Integrated On-Screen Touch Numpad (UI-13 Sub-component):** All numeric inputs spawn an integrated on-screen numpad with $72 \times 72\text{ px}$ tactile digit keys and a dedicated `.` (decimal) key, completely preventing operating system on-screen keyboards from obscuring the viewport.

### 2.2 Latency & Safety Performance Invariants

- **UI Touch Detection & Local Mutation Lock:** $< 16\text{ ms}$ (instantaneous pessimistic state lock upon tap).
- **Software E-Stop Command Dispatch (FastAPI $\to$ MQTT):** p95 $< 100\text{ ms}$ (FastAPI publishes to MQTT before writing async audit log, [`D-049`](file:///home/maria_zahra/Documents/projects/greenhouse/desanomia/brain/18_DECISIONS.md#L129)).
- **Firmware E-Stop Cutoff Execution (ESP32-S3):** $< 5\text{ ms}$ via FreeRTOS software task; $< 1\text{ }\mu\text{s}$ via `IRAM_ATTR` interrupt handler (`emergency_stop_isr`).
- **Physical Mushroom Switch Relay Cutoff:** **$0\text{ ms}$** (hardwired NC contacts physically break relay coil VCC bus).

---

## 3. Page Route Map & Navigation Architecture

The application is structured into focused operational views governed by client-side routing (`react-router-dom` v6):

| Route Path | View Title | Permitted Roles | Primary Function & View Composition |
| :--- | :--- | :--- | :--- |
| `/login` | Masuk Sistem | All (Public) | Secure login interface with credentials entry or on-screen keypad PIN. |
| `/` | Dashboard Cockpit | `Viewer`, `Operator`, `Admin` | Primary Bento Grid: 5-pair visualizer, hero TDS, FSM status, live timeline, actuator bench. Strictly 1080px non-scrolling. |
| `/batches` | Riwayat Batch | `Viewer`, `Operator`, `Admin` | Searchable, paginated audit table of historical batch executions with gate evaluation badges. Internal touch-scroll. |
| `/batches/:id` | Detail Batch | `Viewer`, `Operator`, `Admin` | Deep forensic view of single batch: time-series sensor traces, FSM transition logs, dosing record. Internal touch-scroll. |
| `/recipes` | Manajemen Resep | `Viewer` (view), `Admin` (edit)| Recipe cards (Vegetatif 1100, Generatif 1250, Panen 1050), target PPM limits, formula editor. Internal touch-scroll. |
| `/schedules` | Jadwal Fertigasi | `Viewer` (view), `Operator`/`Admin`| 5-tank conflict-free 7-day calendar view, cron configuration, next-trigger previews in Asia/Jakarta WIB. |
| `/manual` | Uji Diagnostik & Kalibrasi | `Operator`, `Admin` | Manual actuator jog controls (+10 mL peristaltic, 10s mixer), calibration wizard launcher. |
| `/users` | Kelola Pengguna | `Admin` (Elevated) | User account administration, role assignment, credential resets, audit trail review. Internal touch-scroll. |
| `/change-password`| Ganti Kata Sandi | Authenticated | Password update interface with Argon2id complexity validation. |
| `/403` | Akses Ditolak | All | Role-elevation prompt or permission denied notice with return CTA. |
| `/404` | Halaman Tidak Ditemukan | All | Fallback 404 view with 1-tap navigation back to `/`. |

### 3.1 Persistent Light Minimalist Cockpit Shell

The layout shell wraps all protected views in a clean, airy minimalist frame:

```
+-------------------------------------------------------------------------------------------------------------------------------------+
| [LOGO] desanomia    [Pair 1: Aktif] [Pairs 2-5: Standby]    [FSM: DOSING]    [WS: ONLINE 1.0Hz]    [BELL: 2]          [E-STOP (!!)] |
+-------------------------------------------------------------------------------------------------------------------------------------+
|                                                                                                                                     |
|                                                     MAIN CONTENT VIEWPORT CANVAS                                                    |
|                                  (Fixed 1920x1080 Budget on Cockpit, Internal Touch-Scroll on Tables)                               |
|                                                                                                                                     |
+-------------------------------------------------------------------------------------------------------------------------------------+
| [SYSTEM FOOTER: Edge Beelink EQ12 • Firmware v1.0.0 • Core 1: 20Hz • DB Sync: OK • OT LAN: 192.168.10.1 • 2026-10-11 02:14:17 WIB] |
+-------------------------------------------------------------------------------------------------------------------------------------+
```

1. **Top Navigation Header:**
   - **System Identity:** Desanomia wordmark with greenhouse identifier badge (`GH-01`).
   - **Tank Allocation Badge:** Indicates current active hardware pair (`Pair 1: Aktif`) and standby pairs (`Pair 2–5: Standby`).
   - **Live FSM State Pill:** Color-coded status badge showing current finite state machine state and elapsed state duration.
   - **Network & Engine Pill:** Real-time WebSocket connection state (`ONLINE`, `STALE`, or `OFFLINE`) with 1 Hz pulse dot.
   - **Notification Bell Hub (UI-17):** Slide-out drawer trigger displaying unread notification count badge.
   - **Admin Step-Up Timer Banner ([`D-026`](file:///home/maria_zahra/Documents/projects/greenhouse/desanomia/brain/18_DECISIONS.md#L64)):** If operator is elevated to Admin, displays a countdown banner (`Elevasi Admin: 14m 22s tersisa [Kunci]`).
   - **Master E-Stop Button:** Persistent high-contrast crimson button mounted at `z-[100]` for instantaneous software shutdown.
2. **Main Content Viewport:**
   - On Tier 1 (HMI Kiosk) and Tier 2 (Gazebo TV), the Cockpit (`/`) view strictly enforces `h-screen overflow-hidden` within a 1080 px vertical budget (Header 64px, Stepper 56px, Bento grid 912px, Footer 48px).
   - Data tables on `/batches`, `/users`, and `/recipes` enforce internal touch scrolling (`overflow-y-auto`).
   - On Tier 3 (Mobile PWA), the viewport adopts a single-column flex layout with smooth touch scrolling and sticky top/bottom bars.
3. **Bottom Notification & Toast Surface:**
   - Floating interactive toast notifications spawn in the lower-right quadrant without occluding primary operational controls or the top-right E-Stop button.

---

## 4. Comprehensive Component Registry (`UI-01` to `UI-26`)

The Desanomia dashboard interface is composed of twenty-six signature industrial components:

```
+-----------------------------------------------------------------------------------------------------------------------------------------+
| TOP NAVIGATION BAR: [Logo]  [Pair 1 Active]  [FSM: DOSING]  [WS: ONLINE 1.0Hz]  [Bell: 2]                          [E-STOP BUTTON (!!)] |
+-----------------------------------------------------------------------------------------------------------------------------------------+
| [UI-18: PIPELINE STEPPER COMPONENT]                                                                                                     |
| [1:IDLE] -> [2:FILL] -> [3:BASE] -> [4:DOSE*] -> [5:MIX] -> [6:STAB] -> [7:MEAS] -> [8:GATE] -> [9:DIST] -> [10:DEPLETED]               |
+-----------------------------------------------------------------------------------------------------------------------------------------+
| +-----------------------------------+ +-----------------------------------+ +---------------------------------------------------------+ |
| | UI-01: FSM STATUS CARD            | | UI-02: LIVE TDS GAUGE & GATE CARD | | UI-03: MULTI-TANK 5-PAIR VISUALIZER                     | |
| | State: DOSING                     | |        1248 ppm                   | | +---------------------------+ +-----------------------+ | |
| | Batch: #1042                      | | [======== Gate Band ========]     | | | Drum 1 (Konsentrat 20L)   | | Drum 2 (Distrib. 140L) | | |
| | Elapsed: 00:01:14                 | | Target: 1250 ± 50 ppm (1200-1300) | | | 18.2 L (91%)              | | 140.0 L (100%)        | | |
| | Step: 4 dari 12 (Injeksi Nutrisi) | | Status: DALAM TOLERANSI (OK)      | | | Wave: Tenang              | | Wave: Pusaran Mixer   | | |
| | [UI-08: Mulai Batch] [UI-09: Reset] | | Baseline Air Baku: 104 ppm        | | | [Konfirmasi Refill]       | | (Kuras Manual Fisik)  | | |
| +-----------------------------------+ +-----------------------------------+ +---------------------------+ +-----------------------+ | |
|                                                                             | Standby: [Pair 2] [Pair 3] [Pair 4] [Pair 5] (Terkunci) | |
|                                                                             +---------------------------------------------------------+ |
| +-------------------------------------------------------------------------+ +---------------------------------------------------------+ |
| | UI-06: INTERACTIVE TDS HISTORY CHART (Apache ECharts)                   | | UI-04: ACTUATOR STATUS PANEL & TEST BENCH               | |
| | [1h] [6h*] [24h] [7d]  --- Toleransi 1200-1300 ppm                      | | Katup Air Masuk (SV1)     : [OFF]     [Manual Jog 5s]   | |
| | ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~        | | Pompa Peristaltik (PP1)   : [RUNNING] [+10 mL Bump]     | |
| | Live Stream Point: 1248 ppm | Temp: 27.0°C                              | | Pompa Mixer (M1)          : [OFF]     [Mixer Jog 10s]   | |
| +-------------------------------------------------------------------------+ | Pompa Distribusi (Relay 4): [LOCKED]  (Belum Matang)    | |
| +-------------------------------------------------------------------------+ +---------------------------------------------------------+ |
| | UI-05: BATCH EVENT TIMELINE & AUDIT LOG                                 | | UI-15: DASHBOARD SCHEDULE CALENDAR & 7-DAY TIMELINE     | |
| | 02:01:00 - Transisi IDLE -> FILLING_WATER (140.0 L)                     | | Hari Ini: Pair 1 (Generatif 1250 ppm) [BERJALAN]        | |
| | 02:03:15 - Transisi CHECK_BASE -> DOSING (Injeksi 1695 mL NPK)          | | Besok   : Pair 1 (Generatif 1250 ppm) [06:00 WIB]       | |
| | 02:05:00 - Target Tercapai: 1248 ppm (Delta: -2 ppm)                    | | [Sen] [Sel*] [Rab] [Kam] [Jum] [Sab] [Min]              | |
| +---------------------------------------------------------------------------+-----------------------------------------------------------+ |
```

### 4.1 UI-01: FSM Status Card

- **Purpose:** Primary real-time indicator communicating the operational phase of the greenhouse finite state machine.
- **Visual Presentation:** Prominent Bento card. Glowing status beacon: Emerald for nominal processing, Amber for `BATCH_PAUSED_INSPECTION`, Red for latched fault states, Slate for `IDLE`.
- **Displayed Metrics:** Current FSM state name (e.g. `DOSING`), active `batch_id`, human-readable state phase (e.g. `Tahap 4 dari 12`), and elapsed duration stopwatch (`mm:ss`) formatted via Space Grotesk `.telemetry-numeral`.
- **Error Presentation:** If a fault is latched, displays a pulsating red alert banner rendering the verbatim firmware fault code (e.g. `FAULT_PPM_OUT_OF_RANGE`, `FAULT_DRY_RUN`), trigger timestamp, and root-cause description.
- **Role Permissions:** Visible to all roles. Command buttons gated to `Operator` and `Admin`.

### 4.2 UI-02: Live TDS Gauge & Gate Card

- **Purpose:** Displays live water-nutrient electrical conductivity and TDS measurements evaluated against active recipe tolerance gates.
- **Hero Numeral:** Space Grotesk 64 px Bold numeral rendering live PPM (e.g. `1248 ppm`) with zero layout shift via `.telemetry-numeral` (`font-variant-numeric: tabular-nums lining-nums;`).
- **Dynamic Tolerance Gate Bands ([`D-001`](file:///home/maria_zahra/Documents/projects/greenhouse/desanomia/brain/18_DECISIONS.md#L14), [`D-002`](file:///home/maria_zahra/Documents/projects/greenhouse/desanomia/brain/18_DECISIONS.md#L16), [`D-023`](file:///home/maria_zahra/Documents/projects/greenhouse/desanomia/brain/18_DECISIONS.md#L58)):**
  - **In Tolerance (OK):** $[ \text{Target} - 50, \text{Target} + 50 ]\text{ ppm}$ (e.g. 1200–1300 ppm for Generatif). Emerald (`text-emerald-400`, `bg-emerald-500/10`). Label: `"Dalam Toleransi"`.
  - **Deficit Recovery Band (Amber):** $[ \text{Target} - 250, \text{Target} - 50 )\text{ ppm}$. Amber (`text-amber-400`, `bg-amber-500/10`). Label: `"Kurang Nutrisi (Defisit)"`.
  - **Starvation Anomaly (Red):** $< \text{Target} - 250\text{ ppm}$. Vivid Crimson (`text-red-500`, `bg-red-500/10`). Label: `"Konsentrat Habis (Starvasi)"`.
  - **Out of Band Over-Concentration (Red):** $> \text{Target} + 50\text{ ppm}$. Vivid Crimson (`text-red-500`, `bg-red-500/10`). Label: `"Melebihi Batas Toleransi"`.
- **Water Baseline Offset ([`D-036`](file:///home/maria_zahra/Documents/projects/greenhouse/desanomia/brain/18_DECISIONS.md#L88)):** Displays reference clean water baseline reading captured during `CHECK_BASE` (e.g. `Baseline Air Baku: 104 ppm`).
- **Accessibility String Centralization:** All Indonesian text labels are centralized in `frontend/src/i18n/id.ts` ensuring 100% test contract alignment.

### 4.3 UI-03: Multi-Tank 5-Pair Visualizer & Fluid Physics (D-040, D-046)

- **Purpose:** Visual representation of the fertigation vessel manifold across 5 physical tank pairs (Concentrate Drum 1 + Distribution Drum 2).
- **Tank Pair Allocation Display:**
  - **Pair 1 (Aktif):** Live radar telemetry driving Distribution Drum 2 level (140 L capacity) and virtual stock decrement tracking Concentrate Drum 1 level (20 L capacity).
  - **Pairs 2–5 (Standby):** Rendered with industrial hatched pattern and `Standby / Belum Terpasang` status badges. Standby pairs are disabled from active selection.
- **Procedural Fluid Hydrodynamics Engine ([`D-046`](file:///home/maria_zahra/Documents/projects/greenhouse/desanomia/brain/18_DECISIONS.md#L108)):** Dual HTML5 `<canvas>` elements running procedural sine-wave algorithms at 60 FPS ($< 5\%$ CPU utilization on Intel N100). The canvas `rAF` loop automatically pauses during `IDLE` or static states.
  - `IDLE`: Gentle breathing wave ($A = 2.0\text{ px}, \omega = 0.02$).
  - `FILLING_WATER`: High-amplitude filling wave ($A = 8.0\text{ px}, \omega = 0.08$).
  - `MIXING`: Rotational vortex shear ripples ($A = 6.0\text{ px}, \omega = 0.12$).
  - `STABILIZING`: Mirror calm decay ($A \to 0.5\text{ px}$).
  - `MEASURING_TDS`: Neon probe pulse emission expanding from probe sensor coordinates.
  - `DISTRIBUTING`: Outflow suction wave ($A = 4.0\text{ px}$).
  - `BATCH_PAUSED_INSPECTION`: Pulsating amber deficit warning wave.
  - `FAULT_*` / `ESTOP`: Pulsating crimson hazard ripple.
- **Physical Drain Instruction Badge:** Replacing software drain buttons with an instructive badge: `"Kuras Manual Fisik via Keran Bawah Drum 2"`.
- **Accessibility Mirror:** Semantic `<div role="meter">` DOM mirrors for screen readers.

### 4.4 UI-04: Actuator Status Panel

- **Purpose:** Diagnostic matrix displaying active electrical status of all 4 active-LOW relays driven by ESP32-S3 ([`D-009`](file:///home/maria_zahra/Documents/projects/greenhouse/desanomia/brain/18_DECISIONS.md#L30), [`D-048`](file:///home/maria_zahra/Documents/projects/greenhouse/desanomia/brain/18_DECISIONS.md#L118)).
- **Monitored Actuators:**
  1. Katup Solenoid Air Bersih (SV1) — GPIO 4 (Relay 1)
  2. Pompa Peristaltik Nutrisi (PP1) — GPIO 5 (Relay 2)
  3. Motor Pengaduk / Mixer (M1) — GPIO 6 (Relay 3)
  4. Pompa Distribusi Utama — GPIO 7 (Relay 4)
- **Source Badges:** Every actuator displays an origin pill:
  - `[FSM Otomatis]` — Commanded by firmware state machine sequence.
  - `[Manual Operator]` — Commanded via manual diagnostic jog.
  - `[Interlock Locked]` — Hardware or firmware interlock actively inhibiting actuation.
- **Verbatim Interlock Reason:** Displays exact firmware rejection rule (e.g. `IL-02: Pompa dilarang aktif saat volume air < 6.0 L`, `IL-03: Volume Drum 2 > 8.0 L`).
- **Operational Mutual Exclusion ([`D-030`](file:///home/maria_zahra/Documents/projects/greenhouse/desanomia/brain/18_DECISIONS.md#L76)):** Manual jogs sent during an active batch are rejected with `FSM_BUSY_CANNOT_MANUAL`.

### 4.5 UI-05: Batch Event Timeline

- **Purpose:** Real-time chronological audit trail of state transitions and sensor gates for the active batch.
- **Event Log Entries:** Displays event timestamp, state transition (`IDLE -> FILLING_WATER`), automated dosing volumes injected (e.g. `Dosed: 1695 mL NPK A+B`), stabilization settling times, and tolerance gate evaluation results.
- **Telemetry Pinning:** Each historical entry displays a snapshot of TDS, temperature, and water level captured at transition time.

### 4.6 UI-06: Interactive TDS History Chart

- **Purpose:** Interactive time-series telemetry visualization powered by Apache ECharts.
- **Data Series:**
  - Primary Line: Temperature-compensated TDS (ppm) in bold sky blue (`#38BDF8`).
  - Secondary Line: Drum 2 Water Volume (L) in translucent emerald (`#34D399`).
  - Reference Shaded Band: Upper and lower tolerance gate boundaries (e.g. 1200–1300 ppm) shaded in subtle green (`rgba(16, 185, 129, 0.1)`).
  - Baseline Line: Dotted line indicating clean water baseline reading (104 ppm).
- **Time Window Scrubber:** Interactive range pills for `1 Jam`, `6 Jam`, `24 Jam`, and `7 Hari`.
- **Performance Invariant:** Rendered in canvas mode with `lttb` downsampling maintaining silky 60 FPS performance on Intel N100.

### 4.7 UI-07: ESP32 Connectivity Indicator

- **Purpose:** Real-time hardware health and bridge connectivity monitor.
- **Three-State Semaphore ([09 §2.4](file:///home/maria_zahra/Documents/projects/greenhouse/desanomia/brain/09_ERROR_HANDLING.md#L155)):**
  - **ONLINE (Hijau):** Heartbeat packets received within $< 12.0\text{ s}$. Pulsing emerald beacon (`Ping: 12ms`).
  - **STALE (Kuning):** No telemetry packet received for $12.0\text{ s} \le t \le 20.0\text{ s}$. Displays amber warning banner: `"Data Usang: Menunggu Respons ESP32..."`. Real-time figures dim by 40%.
  - **OFFLINE (Merah):** No packet for $> 20.0\text{ s}$ or MQTT LWT triggered. Red status banner across header. Locks all mutating control buttons.
  - **Master E-Stop Exemption ([`D-047`](file:///home/maria_zahra/Documents/projects/greenhouse/desanomia/brain/18_DECISIONS.md#L115)):** The software Master Emergency Stop button is **strictly exempt** from the offline lock and remains 1-tap clickable 24/7.
- **Hardware Telemetry Flyout:** Tapping the indicator reveals ESP32 internal vitals: Free SRAM (KB), Free PSRAM (KB), Uptime (`hh:mm:ss`), Ethernet Link status (`eth_link`), and Active Safety Interlocks status. (Wi-Fi is permanently disabled, [`D-043`](file:///home/maria_zahra/Documents/projects/greenhouse/desanomia/brain/18_DECISIONS.md#L102)).

### 4.8 UI-08: Jadwalkan / Mulai Batch (Unified Setup Modal)

- **Purpose:** Unified workflow modal for configuring or immediately initiating a fertigation batch without double-confirmation friction.
- **Three-Step Integrated Flow:**
  1. **Pemilihan Resep (Recipe Selection):** Dropdown selector featuring Named Recipe Presets (`Vegetatif 1100 ppm`, `Generatif 1250 ppm`, `Panen 1050 ppm`). Arbitrary custom PPM entry is disallowed to guarantee agricultural traceability ([`D-037`](file:///home/maria_zahra/Documents/projects/greenhouse/desanomia/brain/18_DECISIONS.md#L89), `D-050`).
  2. **Waktu Pelaksanaan (Timing Dispatch):** Choice between `Sekarang` (Immediate execution) and `Jadwalkan Nanti` (Time-picker for scheduled cron dispatch).
  3. **Alokasi Tangki (Target Tank Pair):** Target tank pair selection (`Pair 1` active; `Pairs 2–5` disabled in Phase 1).
- **Backend HTTP 409 Conflict Handling:**
  - `SAME_DAY_DOUBLE_DISTRIBUTION` $\to$ Intercepts submission and triggers UI-16 Hard Confirmation Modal.
  - `OUT_OF_STOCK_CONCENTRATE` $\to$ Intercepts submission and triggers UI-21 Refill Modal.
  - `SCHEDULE_CONFLICT_IMMINENT` $\to$ Prompts operator to postpone or pre-empt schedule.
  - `DEVICE_OFFLINE` $\to$ Displays toast indicating fieldbus communication loss.
- **Autonomous Distribution Invariant ([`D-041`](file:///home/maria_zahra/Documents/projects/greenhouse/desanomia/brain/18_DECISIONS.md#L98)):** When `Mulai Sekarang` is selected, upon passing the TDS gate evaluation, the system **automatically transitions to DISTRIBUTING** without demanding a secondary confirmation click.

### 4.9 UI-09: Reset Fault Button & Recovery Protocol

- **Purpose:** Safety-critical recovery button for clearing latched firmware faults (`FAULT_ESTOP`, `FAULT_DRY_RUN`, `FAULT_PPM_OUT_OF_RANGE`, etc.).
- **Triple Hardware Preconditions ([09 §3.1](file:///home/maria_zahra/Documents/projects/greenhouse/desanomia/brain/09_ERROR_HANDLING.md#L209), [`D-048`](file:///home/maria_zahra/Documents/projects/greenhouse/desanomia/brain/18_DECISIONS.md#L119)):**
  The Reset Fault button is **disabled and visually locked** until all three preconditions evaluate to `true` in live telemetry:
  1. **Physical E-Stop Switch Twist-Released:** Telemetry must report `hw_estop_pressed: false`. If switch is depressed: `"TOMBOL JAMUR MASIH TERTEKAN - PUTAR UNTUK MELEPAS"`.
  2. **Drum 2 Fluid Level Cleared:** Level sensor must report fluid volume $\le 8.0\text{ L}$. If fluid remains: `"KURAS DRUM HINGGA ≤ 8.0 L SEBELUM RESET"` (or operator selects Tiered Recovery UI-20).
  3. **Radar Sensor Online:** Radar UART must be streaming valid binary frames (`radar_online: true`).
- **Execution Endpoint:** Tapping the button dispatches `POST /api/v1/faults/reset` (zero password in request body, [`11 §2.2`](file:///home/maria_zahra/Documents/projects/greenhouse/desanomia/brain/11_API_CONTRACT.md#L127)).

### 4.10 UI-10: Batch History Table

- **Purpose:** Comprehensive historical audit table for past fertigation runs.
- **Columns:** ID Batch, Tanggal & Jam Mulai, Resep, Pasangan Tangki, Target TDS, TDS Akhir, Status Evaluasi (`LULUS`, `GAGAL`, `DIBATALKAN`), Durasi Total, Operator.
- **Internal Touch Scrolling:** Viewport enforces internal touch scrolling (`overflow-y-auto`) preserving the persistent header and footer.
- **Data Export:** 1-tap `Ekspor CSV` button generating client-side CSV files.

### 4.11 UI-11: Manual Actuator Controls & Test Bench

- **Purpose:** Low-level diagnostic engineering interface on `/manual` for jogging individual actuators during commissioning or maintenance.
- **Tactile Jog Triggers (4 Relays):**
  - Solenoid Air Bersih (SV1): `[Buka 5 Detik]` momentary pulse.
  - Pompa Peristaltik (PP1): `[Injeksi +10 mL]` micro-jog pulse.
  - Mixer Pengaduk (M1): `[Aduk 10 Detik]` jog pulse.
  - Pompa Distribusi (Relay 4): `[Uji 5 Detik]` momentary pulse (strictly interlocked to volume $\ge 8.0\text{ L}$).
- **Interlock Transparency:** If an illegal jog is attempted during an active batch, the UI surfaces a toast: `REJECTED: FSM_BUSY_CANNOT_MANUAL` ([`D-030`](file:///home/maria_zahra/Documents/projects/greenhouse/desanomia/brain/18_DECISIONS.md#L76)).

### 4.12 UI-12: Schedule Management Dialog

- **Purpose:** Calendar timetable interface for creating and modifying automated fertigation schedules.
- **Conflict Prevention Engine:** Validates proposed schedules against existing bookings across all 5 tank pairs. Rejects overlapping allocations to guarantee the Zero Conflict Invariant ([`D-040`](file:///home/maria_zahra/Documents/projects/greenhouse/desanomia/brain/18_DECISIONS.md#L96)).
- **Schedule Parameters:** Days of week (Senin–Minggu), Start Time (`hh:mm` in Asia/Jakarta WIB), Target Tank Pair (`Pair 1`), Recipe Preset, Active toggle.

### 4.13 UI-13: Login Page & On-Screen Numpad

- **Purpose:** Access control interface authenticating operators and administrators.
- **Tactile On-Screen Numpad Integration:** Features $72 \times 72\text{ px}$ numeric touch buttons with an explicit `.` (decimal) key, completely eliminating native OS virtual keyboards.
- **Security Compliance:** Rate-limited (locks for 60s after 5 failed attempts) and eliminates user enumeration by displaying a generic `"Nama pengguna atau PIN salah"` alert.

### 4.14 UI-14: User Management Table

- **Purpose:** Administrative interface for managing operator and viewer credentials.
- **Admin Elevation Required ([`D-026`](file:///home/maria_zahra/Documents/projects/greenhouse/desanomia/brain/18_DECISIONS.md#L64)):** Accessible only when an active session possesses verified `Admin` rights or has completed 15-minute step-up elevation via UI-22.
- **Internal Touch Scrolling:** Table body scrolls smoothly with sticky header.

### 4.15 UI-15: Dashboard Schedule Calendar & 7-Day Timeline Widget

- **Purpose:** Glanceable horizontal timeline mounted on the main dashboard showing 7 days of fertigation scheduling in Asia/Jakarta timezone (`WIB`, UTC+7).
- **Visual Display:** 7-day horizontal strip with color-coded schedule blocks:
  - Grey: Past completed runs.
  - Pulsing Blue: Currently active running batch.
  - Green / Amber: Upcoming scheduled runs with countdown pills (`Mulai dalam 42 menit`).
- **Same-Day Lock Badge:** If a batch has already executed today, displays a warning badge denoting same-day distribution lock.

### 4.16 UI-16: Same-Day Hard Confirmation Modal (UX-FR-17, D-050)

- **Purpose:** High-friction protective modal intervening when an operator attempts an ad-hoc or secondary batch on a calendar day where distribution has already completed.
- **Agronomic Safety Mandate:** Prevents accidental over-fertigation, fertilizer salt toxicities, and root rot resulting from double-watering greenhouse crops on the same day ([`D-039`](file:///home/maria_zahra/Documents/projects/greenhouse/desanomia/brain/18_DECISIONS.md#L94)).
- **Dual Friction Design:**
  - High-visibility warning border (`border-2 border-amber-500`).
  - Alert text: *"Peringatan Asfiksia & Over-Fertigasi: Bed tanaman sudah menerima nutrisi hari ini. Distribusi kedua berisiko menyebabkan busuk akar dan keracunan garam pupuk."*
  - **Mandatory Agronomic Risk Checkbox:** Operator must check: `[x] Saya memahami risiko asfiksia akar & toksisitas salinitas pupuk`.
  - **3-Second Press-and-Hold Button:** Once checked, the confirmation button requires a continuous **3-second press-and-hold** gesture before committing `SAME_DAY_FORCE_OVERRIDE` to the audit log.

### 4.17 UI-17: In-App Notification Hub & Frosted Glass Drawer (D-025)

- **Purpose:** Centralized operational alerting hub uniting real-time banners, drawer history, and floating action toasts.
- **Slide-Out Frosted Glass Drawer:** Slides out from the right with frosted glass styling (`backdrop-filter: blur(12px); background: rgba(15, 23, 42, 0.85);`). Categorizes alerts across 4 tiers:
  - **Critical (Merah):** E-Stop trips, sensor faults (`FAULT_*`).
  - **Warning (Kuning):** Stock concentrate low ($\le 3.0\text{ L}$), radar frame jitter.
  - **Info (Biru):** Batch completed, schedule armed.
  - **Success (Hijau):** Calibration committed, system restored.
- **Interactive Action Toasts:** Real-time toasts spawn in the lower-right quadrant with 1-tap action buttons (`[Konfirmasi Refill]`, `[Lihat Detail Inspeksi]`).
- **Auditory Signaling:** Subtle Web Audio chimes on the HMI Kiosk (gentle glass ping for warnings, double chime for critical faults; silent for routine success/info).

### 4.18 UI-18: Pipeline Stepper Component (D-042)

- **Purpose:** Horizontal process stepper tracking the 12 finite state machine lifecycle steps ([`10 §5`](file:///home/maria_zahra/Documents/projects/greenhouse/desanomia/brain/10_FIRMWARE_SPEC.md#L214)).
- **The Authoritative 12 Lifecycle States:**
  1. `IDLE` (Siaga)
  2. `FILLING_WATER` (Pengisian Air Bersih)
  3. `CHECK_BASE` (Pengecekan Air Baku)
  4. `DOSING` (Injeksi Nutrisi Konsentrat)
  5. `MIXING` (Pengadukan Homogen)
  6. `STABILIZING` (Stabilisasi Larutan)
  7. `MEASURING_TDS` (Pengukuran TDS & Suhu)
  8. `GATE_EVALUATE` (Evaluasi Ambang Toleransi)
  9. `TOPUP_DOSING` (Dosis Tambahan Koreksi)
  10. `RECOVERY_MIX_EVALUATE` (Pengadukan & Evaluasi Ulang)
  11. `DISTRIBUTING` (Distribusi ke Tanaman)
  12. `BATCH_DEPLETED` (Batch Selesai & Pembersihan)
- **Node Semantics:**
  - **Completed Steps:** Solid emerald circle with white checkmark icon (`emerald-500`).
  - **Active Step:** Pulsing sky blue circle with glowing outer halo and live count-up/countdown timer.
  - **Upcoming Steps:** Muted slate circle with sequence number (`slate-700`).
  - **Fault / Paused:** Amber or Red flashing node reflecting abnormal interruption.

### 4.19 UI-19: Pause Mode Modal (UX-FR-11, D-013)

- **Purpose:** Screen-locking inspection modal triggered when the system boots after a mid-batch power outage with Drum 2 fluid level $> 8.0\text{ L}$ (`BATCH_PAUSED_INSPECTION`).
- **Displayed Metrics:** Measured volume in Drum 2, measured TDS ppm, and dynamically calculated deficit concentrate volume ($V_{\text{deficit\_mL}} = [(\text{TDS}_{\text{target}} - \text{TDS}_{\text{measured}}) \times V_{\text{current\_L}}] / 107.0$, capped at $300\text{ mL}$).
- **Authoritative 30-Minute Countdown:** Displays live countdown timer until autonomous firmware resumption.
- **Operator Actions:**
  - `[Konfirmasi Dosing Defisit & Lanjutkan]` $\to$ dispatches `POST /api/v1/batches/{id}/resume-deficit`.
  - `[Kuras & Batalkan Batch]` $\to$ dispatches `POST /api/v1/batches/{id}/abort` and instructs manual gravity drain.
- **Embedded E-Stop:** Features an explicit inline Master E-Stop button.

### 4.20 UI-20: Tiered E-Stop Recovery Overlay (D-048)

- **Purpose:** Safety-critical recovery modal presented when the operator twist-releases the physical E-Stop switch following an emergency stop during an active batch.
- **Tiered Choices:**
  1. **Opsi A: Verifikasi Ulang TDS & Lanjutkan:** Permitted if solution is already mixed and vessels intact. Dispatches `RESET_FAULT`, transitioning FSM to `STABILIZING` $\to$ `MEASURING_TDS` $\to$ `GATE_EVALUATE` without discarding viable fertilizer.
  2. **Opsi B: Batalkan & Kuras ke Parit:** Aborts batch, keeps distribution pump locked OFF, and instructs operator to open manual gravity drain valve until level $\le 8.0\text{ L}$.
- **Embedded E-Stop:** Features an explicit inline Master E-Stop button.

### 4.21 UI-21: Concentrate Refill Confirmation Modal (D-022, D-025)

- **Purpose:** Refill Confirmation Gate modal triggered by low-stock warnings ($\le 3.0\text{ L}$) or batch lockouts (`OUT_OF_STOCK_CONCENTRATE` $< 1.5\text{ L}$).
- **Safety Instructions:** Guides operator to prepare concentrated NPK A+B stock solution and fill Concentrate Drum 1 to the 20.0 L physical graduation line.
- **Confirmation Action:** Tapping `[Konfirmasi Drum 1 Terisi Penuh (20.0 L)]` dispatches `POST /api/v1/tanks/1/refill-confirm`, resetting PostgreSQL virtual stock to 20.0 L and recording `CONCENTRATE_REFILLED` in `audit_logs`.

### 4.22 UI-22: Admin Step-Up Elevation Modal (D-026, D-050)

- **Purpose:** 15-minute temporary administrative elevation modal on the Tier 1 Kiosk.
- **Tactile PIN Elevation:** Centered modal with $72 \times 72\text{ px}$ tactile numeric keys accepting a 6-digit Admin PIN (`kiosk_pin_hash`, Argon2id).
- **Execution:** Dispatches `POST /api/v1/auth/elevate` restricted strictly to loopback (`127.0.0.1:8080`), granting 15 minutes of Admin privilege and recording `elevated_by` in `audit_logs`.
- **Password Fallback:** Includes a toggle to switch to full password input via touch keyboard.

### 4.23 UI-23: TDS Sensor Calibration Wizard (D-036, D-049)

- **Purpose:** Guided step-by-step calibration wizard on `/manual` for calibrating the analog TDS probe.
- **Step 1 — Drain Precondition:** Checks live telemetry; wizard remains locked until Drum 2 volume is $\le 8.0\text{ L}$ and FSM is `IDLE`.
- **Step 2 — Probe Immersion:** Guides operator to detach probe and immerse in 1413 µS/cm reference calibration buffer.
- **Step 3 — ADC Stabilization:** Displays live 30-second ADC voltage trace until reading stabilizes ($< 2\text{ mV}$ drift over 10s).
- **Step 4 — NVS Commit:** Submits stabilized voltage to `POST /api/v1/sensors/calibrate/tds`. Backend computes probe cell constant $K_{\text{cell}}$ (bounded 0.5–2.0) and commits to ESP32 NVS `calib_tds`.

### 4.24 UI-24: Named Recipe Management View (D-037)

- **Purpose:** Dedicated recipe catalog on `/recipes` managing agronomic growth stage presets.
- **Preset Cards:** Displays Vegetatif (1100 ppm), Generatif (1250 ppm), and Panen (1050 ppm) with target bounds (500–1800 ppm) and fixed ±50 ppm gate band ([`IL-01`](file:///home/maria_zahra/Documents/projects/greenhouse/desanomia/brain/10_FIRMWARE_SPEC.md#L183)).
- **Permissions:** Read-only for `Viewer` and routine `Operator`; editing gated to `Admin` (or Kiosk elevated Operator).
- **Default Designation:** 1-tap `[Jadikan Resep Default]` button sets active preset for upcoming autonomous schedules.

### 4.25 UI-25: Kiosk Offline Service Worker Shell (D-050)

- **Purpose:** Service worker caching layer (`sw.js`) preventing Chromium kiosk browser from crashing to raw error screens (`ERR_CONNECTION_REFUSED`) during edge gateway reboots or Nginx restarts.
- **Local Retry Shell:** If WebSocket drops for $> 60\text{ s}$ on Tier 1 Kiosk, instead of executing a destructive `window.location.reload()`, the service worker presents an animated local radar reconnect screen with exponential retry polling.

### 4.26 UI-26: Forensic Audit Trail Inspector

- **Purpose:** Deep historical audit trail viewer mounted on `/batches/:id/events` and `/users`.
- **Chronological Trace:** Displays immutable records from PostgreSQL `audit_logs` including timestamp, user ID, client IP, action type (`START_BATCH`, `RESET_FAULT`, `SAME_DAY_FORCE_OVERRIDE`), and before/after state snapshots.

---

## 5. Client State Architecture & WebSocket Data Ingestion

The frontend architecture strictly adheres to single-source unidirectional data flow:

```
                                +-----------------------------------+
                                |     FastAPI Backend (Edge PC)     |
                                | WebSocket: /api/v1/ws/telemetry   |
                                +-----------------+-----------------+
                                                  |
                                                  | 1.0 Hz JSON Frames
                                                  v
                                +-----------------------------------+
                                |    Telemetry Ingestion Layer      |
                                |   useTelemetryStore (Zustand)     |
                                +-----------------+-----------------+
                                                  |
                 +--------------------------------+--------------------------------+
                 |                                |                                |
                 v                                v                                v
       Fine-Grained Selector            Fine-Grained Selector            Fine-Grained Selector
    useTelemetryStore(s => s.tds)    useTelemetryStore(s => s.fsm)   useTelemetryStore(s => s.drum2)
                 |                                |                                |
                 v                                v                                v
       [UI-02: Live TDS Card]          [UI-01: FSM Status Card]        [UI-03: Tank Visualizer]
```

### 5.1 Zustand Store Architecture

State is partitioned into four decoupled stores:

1. **`useTelemetryStore`:**
   - Holds 1.0 Hz real-time sensor metrics matching [`11 §3.1`](file:///home/maria_zahra/Documents/projects/greenhouse/desanomia/brain/11_API_CONTRACT.md#L279): `ts`, `tank_pair_id`, `tds_ppm`, `water_temp_c`, `drum2_volume_l`, `drum2_level_pct`, `hw_estop_pressed`, `relays` (`fill_valve`, `dosing_pump`, `mixing_pump`, `dist_pump`), `fsm_state`, `active_batch_id`, `active_fault`, and `device_status`.
   - Updated strictly via incoming WebSocket frames.
2. **`useBatchStore`:**
   - Holds active batch configuration, historical timeline transitions, recipe parameters, and execution progress.
3. **`useNotificationStore`:**
   - Manages toast queue, unread notification counts, and slide-out drawer history.
4. **`useAuthStore`:**
   - Holds authenticated user identity, role (`Viewer`, `Operator`, `Admin`), `is_elevated`, and elevation countdown (`elevated_until`).
   - **Zero JWT Storage ([`D-026`](file:///home/maria_zahra/Documents/projects/greenhouse/desanomia/brain/18_DECISIONS.md#L64)):** Sessions are managed via secure `HttpOnly` cookies. The store holds zero raw token secrets.

### 5.2 Selector Discipline & Render Optimization

Components must **never subscribe to the root store**:
```typescript
// FORBIDDEN: Causes entire component to re-render at 1.0 Hz
const { tds_ppm, fsm_state, relays } = useTelemetryStore();

// MANDATORY: Atomic primitive selectors
const tdsPpm = useTelemetryStore((state) => state.tds_ppm);
const fsmState = useTelemetryStore((state) => state.fsm_state);

// MANDATORY: useShallow for compound object slices
import { useShallow } from 'zustand/react/shallow';
const relays = useTelemetryStore(useShallow((state) => state.relays));
```

### 5.3 WebSocket Lifecycle & Full-Jitter Reconnection

The client connects to `ws://127.0.0.1:8080/api/v1/ws/telemetry`:
1. **Initial Hydration Frame ($< 500\text{ ms}$):** Upon connection, backend pushes a complete system state snapshot.
2. **Heartbeat & Liveness Watchdog ([09 §2.4](file:///home/maria_zahra/Documents/projects/greenhouse/desanomia/brain/09_ERROR_HANDLING.md#L155)):** Packets expected every $1.0\text{ s} \pm 200\text{ ms}$. If silent $> 12.0\text{ s}$, status shifts to `STALE`. If silent $> 20.0\text{ s}$, status shifts to `OFFLINE`.
3. **Full-Jitter Exponential Backoff:** Reconnection intervals follow $t = \min(15, 2^n) \times (0.5 + 0.5 \times \text{random}())$ seconds.
4. **Kiosk Auto-Recovery:** Handled by UI-25 Service Worker shell without unhandled Chromium crash pages.

### 5.4 Pessimistic UI Mutation Discipline (`usePessimisticMutation`)

Optimistic UI updates are **strictly forbidden** in safety-critical automation ([`D-047`](file:///home/maria_zahra/Documents/projects/greenhouse/desanomia/brain/18_DECISIONS.md#L114), [`D-049`](file:///home/maria_zahra/Documents/projects/greenhouse/desanomia/brain/18_DECISIONS.md#L130)):
1. When an operator taps an action button (e.g. `Mulai Batch` or `Jog Solenoid`), the button enters a disabled spinner state (`loading: true`).
2. Client dispatches HTTP `POST` with a unique UUIDv4 `cmd_id` (via `Idempotency-Key` header).
3. The button remains disabled until either:
   - A correlated WebSocket frame arrives with `command_result` matching `cmd_id` and status `ACCEPTED` (transitioning button to success and releasing lock).
   - An interlock rejection arrives with status `REJECTED` (releasing lock and presenting rejection toast).
   - A $3.0\text{ s}$ timeout elapses without ACK. The backend marks status `OUTCOME_UNKNOWN`. **The button remains locked** in an reconciling state (`"Menunggu Rekonsiliasi Telemetri"`). The client polls `GET /api/v1/commands/{cmd_id}`. Any operator retry **must reuse the exact same `cmd_id`**, ensuring ESP32's 32-slot circular RAM cache ([`D-045`](file:///home/maria_zahra/Documents/projects/greenhouse/desanomia/brain/18_DECISIONS.md#L106)) suppresses duplicate actuation.

---

## 6. Design Tokens, Typography & Accessibility Standards

### 6.1 Light Clean & Sleek Minimalist Color Tokens (D-029, D-050)

All styling tokens are declared in `frontend/src/index.css` leveraging standard hex and perceptual `oklch()` color spaces matching [`DESIGN.md`](file:///home/maria_zahra/Documents/projects/greenhouse/desanomia/docs/DESIGN.md):

```css
:root {
  /* Foundations & Surfaces */
  --cockpit-bg: #F8FAFC;              /* Slate 50 - Warm off-white foundation */
  --card-surface: #FFFFFF;            /* Pure White - Rounded 28px card container */
  --card-surface-elevated: #F1F5F9;   /* Slate 100 - Inset surface / subtle pill */
  --border-subtle: #E2E8F0;           /* Slate 200 - Hairline card divider */
  --border-active: #2563EB;           /* Blue 600 - Royal Blue focus ring & active selection */

  /* Operational Status Semaphores (Soft Pastels) */
  --status-normal: #10B981;           /* Emerald 500 - In tolerance text */
  --status-normal-bg: #DCFCE7;        /* Emerald 100 - Mint pill background */
  --status-normal-glow: rgba(16, 185, 129, 0.15);
  --status-warning: #F97316;          /* Orange 500 - Deficit text */
  --status-warning-bg: #FFEDD5;       /* Orange 100 - Peach pill background */
  --status-warning-glow: rgba(249, 115, 22, 0.15);
  --status-danger: #EF4444;           /* Red 500 - Critical/fault text */
  --status-danger-bg: #FEE2E2;        /* Red 100 - Coral pill background */
  --status-danger-glow: rgba(239, 68, 68, 0.15);
  --status-standby: #64748B;          /* Slate 500 - Muted standby */

  /* Typography Colors (WCAG AAA Compliant on #FFFFFF / #F8FAFC) */
  --text-primary: #0F172A;            /* Slate 900 - Contrast 15.8:1 (AAA) */
  --text-secondary: #64748B;          /* Slate 500 - Contrast 4.8:1 (AA) */
  --text-muted: #94A3B8;              /* Slate 400 - Contrast 3.2:1 (Large text) */
}
```

### 6.2 Typographic Hierarchy & Tabular Invariant

1. **Display & Telemetry Numerals:** **Space Grotesk**
   - Sharp, geometric, precision scientific character for all large telemetry figures.
   - **Dedicated Numeric Utility:** Telemetry readouts apply `.telemetry-numeral` to preserve Space Grotesk letterforms while enforcing fixed tabular numeral widths:
     ```css
     .telemetry-numeral {
       font-family: 'Space Grotesk', system-ui, sans-serif;
       font-variant-numeric: tabular-nums lining-nums;
     }
     ```
2. **Body & User Interface:** **Geist Sans**
   - High-neutrality neo-grotesque engineered for optimal legibility at compact sizes.
3. **Hardware Identifiers & Logs:** **Geist Mono**
   - Fixed-pitch typeface used for UUIDs, `cmd_id` hashes, firmware error codes, and raw ADC readouts.

### 6.3 Accessibility & Glare Readability (WCAG 2.2 AA / AAA)

- **Contrast Ratios:** Text-to-background contrast maintains a minimum of **$7.0:1$** for primary text and secondary captions (exceeding WCAG AAA). Graphical elements maintain $\ge 3.0:1$.
- **No Color-Alone Signaling:** Every green, amber, or red indicator is paired with an explicit typographic label (e.g. `[LULUS]`, `[PERINGATAN]`, `[BAHAYA]`).
- **Focus Ring Trapping:** Headless Radix UI dialog primitives manage focus trapping with high-contrast focus rings (`outline: 2px solid #2563EB; outline-offset: 2px;`).
- **Screen Reader Announcements (`aria-live`):** Routine FSM transitions are routed through `<div aria-live="polite" class="sr-only">`. Latched faults and emergency stops use `aria-live="assertive"`.

### 6.4 Comprehensive WCAG 2.2 Accessibility Architecture & Implementation Specification

Desanomia's greenhouse cockpit interface enforces strict compliance with **WCAG 2.2 Level AA** (with Level AAA contrast and focus appearance targets) governed by the POUR principles (Perceivable, Operable, Understandable, Robust) across all three display tiers.

#### 1. Perceivable: Glare Resistance, Tabular Stability & Non-Color Semantics
- **Text & Interactive Contrast (SC 1.4.3 Level AA, SC 1.4.6 Level AAA, SC 1.4.11 Level AA):**
  - Primary text (`--text-primary: #0F172A`) on white card foundation (`#FFFFFF`): **15.8:1** (exceeds 7.0:1 AAA).
  - Secondary captions (`--text-secondary: #64748B`): **4.8:1** (exceeds 4.5:1 AA).
  - Inactive / Muted captions (`--text-muted: #94A3B8`): **3.2:1** (meets WCAG large text requirements).
  - Active interactive borders (`--border-active: #2563EB`): **4.5:1** (exceeds 3.0:1 requirement for user interface components).
- **Zero Color-Alone Signaling (SC 1.4.1 Level A):**
  - Every operational status semaphore pairs color with an explicit typographic badge and semantic icon:
    - Normal / In Tolerance: Emerald + Checkmark icon + Text `"Dalam Toleransi"`.
    - Deficit Warning: Amber + AlertTriangle icon + Text `"Kurang Nutrisi (Defisit)"`.
    - Starvation Anomaly: Red + AlertOctagon icon + Text `"Konsentrat Habis (Starvasi)"`.
    - Over-Concentration: Red + AlertOctagon icon + Text `"Melebihi Batas Toleransi"`.
    - Standby: Slate + Lock icon + Text `"Standby / Belum Terpasang"`.
- **Tabular Figures & Numeral Layout Stability (SC 1.4.4 Level AA):**
  - High-frequency 1.0 Hz telemetry numerals apply `.telemetry-numeral` (`font-variant-numeric: tabular-nums lining-nums;`), guaranteeing identical horizontal glyph widths across digits `0` through `9` and preventing visual layout oscillation.
- **Audio-Visual Equivalence & Volume Control (SC 1.1.1 Level A, SC 1.4.2 Level A):**
  - Localized Web Audio chimes on Tier 1 Kiosk are strictly non-looping with duration $< 1.5\text{ s}$.
  - UI-17 includes a persistent Audio Alert Toggle (`aria-label="Bisukan Sinyal Suara Alur Kerja"`).
  - Every audio chime is paired with an immediate visual banner, toast, and card border flash—zero information depends solely on auditory perception.

#### 2. Operable: Physical Ergonomics, Focus Appearance & Keyboard Architecture
- **Target Size (Minimum) (SC 2.5.8 Level AA, D-019, D-050):**
  - All interactive buttons, tabs, switches, and inputs on Tier 1 (HMI Kiosk) strictly enforce a minimum bounding box of **$56 \times 56\text{ CSS px}$** (`min-h-[56px] min-w-[56px]`), exceeding standard 44 px for reliable operation with nitrile gloves or damp hands.
  - Critical safety triggers (Master E-Stop, Mulai Batch) enforce **$64 \times 64\text{ px}$** hit targets.
  - Adjacent buttons maintain $\ge 12\text{ px}$ physical separation (exceeding WCAG 24 px perimeter spacing requirement).
- **Top-Level Skip Navigation Link (SC 2.4.1 Level A):**
  - Mounted as the first focusable element in the DOM:
    ```html
    <a href="#main-cockpit" 
       class="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[110] focus:px-6 focus:py-3 focus:bg-blue-600 focus:text-white focus:font-bold focus:rounded-full focus:shadow-xl focus:outline-none focus:ring-4 focus:ring-blue-300">
      Lewati ke Konten Utama Cockpit
    </a>
    ```
- **Focus Visible & Focus Appearance (SC 2.4.7 Level AA, SC 2.4.13 Level AAA):**
  - All interactive elements exhibit high-contrast visible focus indicators:
    ```css
    focus-visible:ring-4 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white focus-visible:outline-none
    ```
- **Pessimistic UI & Action Feedback (SC 4.1.2 Level A, D-047, D-049):**
  - Mutation buttons set `aria-busy="true"` and `disabled` immediately upon actuation.
  - If a 3.0s timeout occurs, the button transitions to `aria-disabled="true"` with `aria-describedby` announcing `"Menunggu Rekonsiliasi Telemetri"`.

#### 3. Understandable: Gated Actions, Predictable Modals & Vocabulary
- **Gated Action Descriptions (SC 1.3.1 Level A, SC 3.3.2 Level A, D-019, D-048):**
  - Disabled safety controls link directly to the physical reason via `aria-describedby`:
    - `Reset Fault` button links to `#reset-fault-blocker-reason` rendering: `"Tombol E-Stop Fisik Masih Tertekan"` or `"Kuras Drum 2 hingga ≤ 8.0 L (Terukur: X L)"`.
    - Locked actuator jog buttons link to `#actuator-busy-reason` rendering: `"FSM Sedang Berjalan (Siklus Aktif)"`.
    - Standby tank pairs link to `#tank-standby-reason` rendering: `"Pasangan Tangki Belum Terpasang (Fase 1)"`.
- **Modal Dismissal & Focus Trapping Matrix (SC 2.1.2 Level A, SC 3.3.4 Level AA):**
  - **Routine Dialogs (UI-08, UI-12, UI-13, UI-14, UI-17, UI-21, UI-22, UI-23, UI-24):**
    - Focus trapped within modal container (`role="dialog"`, `aria-modal="true"`).
    - `Escape` key and backdrop touch safely cancel and close the dialog.
    - Focus automatically returns to the invoking trigger element upon closing.
  - **Safety Interlock Overlays (UI-16 Same-Day Confirm, UI-19 Pause Mode, UI-20 E-Stop Recovery):**
    - Focus trapped within overlay (`role="alertdialog"`, `aria-modal="true"`).
    - `Escape` key and backdrop touch are **strictly disabled** (`pointer-events: none` on backdrop).
    - The operator must intentionally choose an actionable button (`[Lanjutkan]`, `[Override]`, or `[Kuras & Batalkan]`).
- **Standardized Bilingual Vocabulary (D-021, brain/20_GLOSSARY.md):**
  - All operator-facing labels, dialog prompts, tooltips, and screen-reader announcements strictly use standardized Indonesian terminology centralized in `frontend/src/i18n/id.ts`.

#### 4. Robust: Live Telemetry vs ARIA-Live Stream Separation
- **Strict Stream Telemetry Boundary (SC 4.1.3 Level AA):**
  - **CRITICAL INVARIANT:** Real-time 1.0 Hz raw telemetry metrics (`tds_ppm`, `water_temp_c`, `drum2_volume_l`) are **strictly prohibited** from driving `aria-live` regions. Putting 1.0 Hz streaming values into live regions floods assistive speech synthesizers with 60 announcements per minute, rendering the interface unusable.
  - High-frequency telemetry metrics use static, query-on-focus semantic meters:
    - `<div role="meter" aria-label="Volume Distribution Drum (Drum 2)" aria-valuenow="140.0" ...>`
    - `<div role="status" aria-label="Konsentrasi TDS Drum 2: 1248 ppm, Dalam Toleransi">`
- **Three-Tier `aria-live` Announcer Architecture:**
  1. **Tier 1 — Assertive (`aria-live="assertive" role="alert"`):** Reserved strictly for latched hardware safety faults (`FAULT_*`) and physical/software emergency stops (`ESTOP`). Announced immediately, interrupting speech.
  2. **Tier 2 — Polite (`aria-live="polite"`):** Reserved for discrete FSM lifecycle state transitions (e.g. `Transisi: IDLE ke FILLING_WATER`), completed tolerance gate verdicts (`Evaluasi Gate: Lulus (1248 ppm)`), and schedule arming events. Announced at the next natural speech pause.
  3. **Tier 3 — Silent / Polled (Zero `aria-live`):** 1.0 Hz sensor ticks, wave physics canvas updates, and live stopwatch counters. Read only on user-directed virtual focus or touch probe.

---

### 6.5 Production-Grade Accessible Component Implementations

#### 1. Kiosk Master Emergency Stop Button (`KioskMasterEmergencyStop`)
```tsx
import React from 'react';

interface KioskMasterEmergencyStopProps {
  onTrigger: () => void;
  isPending: boolean;
}

export function KioskMasterEmergencyStop({ onTrigger, isPending }: KioskMasterEmergencyStopProps) {
  return (
    <button
      type="button"
      onClick={onTrigger}
      disabled={isPending}
      aria-label="Darurat: Hentikan Semua Aktuator Segera"
      aria-busy={isPending}
      className="relative z-[100] min-h-[56px] min-w-[56px] h-14 px-6 py-2.5 rounded-full bg-red-500 hover:bg-red-600 active:scale-95 text-white font-bold text-sm tracking-wide uppercase shadow-md focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-red-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150 flex items-center justify-center gap-2"
    >
      <span className="w-2.5 h-2.5 rounded-full bg-white animate-ping" aria-hidden="true" />
      <span>{isPending ? "Menghentikan..." : "STOP DARURAT"}</span>
    </button>
  );
}
```
- **Accessibility Tree:** Role: `button`, Name: `"Darurat: Hentikan Semua Aktuator Segera"`, Busy: `false` (or `true`), Focusable: `true`.
- **Physical Ergonomics:** $56\text{ px}$ height $\times$ min $140\text{ px}$ width, exceeding min $56 \times 56\text{ px}$.
- **WCAG Mapping:** SC 2.5.8 Target Size, SC 4.1.2 Name, Role, Value, SC 2.4.7 Focus Visible.

#### 2. Live Fluid Vessel Level Meter (`DrumLevelMeter`)
```tsx
import React from 'react';

interface DrumLevelMeterProps {
  label: string;
  volumeL: number;
  maxL: number;
  drumId: 'drum1' | 'drum2';
}

export function DrumLevelMeter({ label, volumeL, maxL, drumId }: DrumLevelMeterProps) {
  const percent = Math.min(100, Math.max(0, Math.round((volumeL / maxL) * 100)));
  const textValue = `${volumeL.toFixed(1)} Liter dari ${maxL.toFixed(1)} Liter (${percent} persen)`;

  return (
    <div
      role="meter"
      aria-label={label}
      aria-valuenow={parseFloat(volumeL.toFixed(1))}
      aria-valuemin={0}
      aria-valuemax={maxL}
      aria-valuetext={textValue}
      tabIndex={0}
      className="p-5 bg-white border border-slate-200 rounded-[28px] shadow-sm hover:shadow-md transition-shadow focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
    >
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-semibold text-slate-700">{label}</span>
        <span className="telemetry-numeral text-lg font-bold text-slate-900">
          {volumeL.toFixed(1)} <span className="text-xs font-normal text-slate-500">L</span>
        </span>
      </div>
      <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-200" aria-hidden="true">
        <div
          className="h-full bg-emerald-500 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
```
- **Accessibility Tree:** Role: `meter`, Name: `"Volume Distribution Drum (Drum 2)"`, Value: `140.0`, ValueText: `"140.0 Liter dari 140.0 Liter (100 persen)"`.
- **Physical Ergonomics:** Interactive container $\ge 56\text{ px}$ height with touch padding.
- **WCAG Mapping:** SC 1.1.1 Non-Text Content, SC 1.3.1 Info & Relationships, SC 1.4.3 Contrast.

#### 3. Gated Fault Reset Button with `aria-describedby` (`GatedFaultResetButton`)
```tsx
import React from 'react';

interface GatedFaultResetButtonProps {
  hwEstopPressed: boolean;
  drum2VolumeL: number;
  radarOnline: boolean;
  onReset: () => void;
  isPending: boolean;
}

export function GatedFaultResetButton({
  hwEstopPressed,
  drum2VolumeL,
  radarOnline,
  onReset,
  isPending
}: GatedFaultResetButtonProps) {
  const isEStopBlocked = hwEstopPressed;
  const isFluidBlocked = drum2VolumeL > 8.0;
  const isRadarBlocked = !radarOnline;
  const isLocked = isEStopBlocked || isFluidBlocked || isRadarBlocked || isPending;

  let reasonText = "";
  if (isEStopBlocked) {
    reasonText = "Tombol E-Stop Fisik Masih Tertekan — Putar tombol jamur di panel untuk melepas.";
  } else if (isFluidBlocked) {
    reasonText = `Drum 2 Belum Kosong (Terukur: ${drum2VolumeL.toFixed(1)} L) — Buka keran kuras manual hingga ≤ 8.0 L.`;
  } else if (isRadarBlocked) {
    reasonText = "Sensor Radar Offline — Periksa kabel UART radar sebelum reset.";
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={onReset}
        disabled={isLocked}
        aria-busy={isPending}
        aria-describedby={isLocked ? "reset-fault-blocker-reason" : undefined}
        className={`min-h-[56px] min-w-[56px] h-14 px-6 py-3 rounded-full font-bold text-sm tracking-wide transition-all duration-150 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white ${
          isLocked
            ? "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed opacity-70"
            : "bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white shadow-md shadow-emerald-500/20"
        }`}
      >
        {isPending ? "Memproses Reset..." : "[Reset Fault] Buka Kunci Sistem"}
      </button>

      {isLocked && reasonText && (
        <p
          id="reset-fault-blocker-reason"
          role="note"
          className="text-xs font-medium text-amber-800 bg-amber-50 border border-amber-200 p-2.5 rounded-2xl"
        >
          <span className="font-bold">Prasyarat Reset: </span>{reasonText}
        </p>
      )}
    </div>
  );
}
```
- **Accessibility Tree:** When blocked, announces: `"Reset Fault Buka Kunci Sistem, button, disabled, Prasyarat Reset: Tombol E-Stop Fisik Masih Tertekan — Putar tombol jamur di panel untuk melepas."`
- **WCAG Mapping:** SC 3.3.2 Labels or Instructions, SC 4.1.2 Name, Role, Value, SC 1.3.1 Info & Relationships.

#### 4. Accessible 12-State Pipeline Stepper (`PipelineStepper`)
```tsx
import React from 'react';

const FSM_STEPS = [
  { id: 'IDLE', label: 'Siaga' },
  { id: 'FILLING_WATER', label: 'Pengisian Air Bersih' },
  { id: 'CHECK_BASE', label: 'Pengecekan Air Baku' },
  { id: 'DOSING', label: 'Injeksi Nutrisi' },
  { id: 'MIXING', label: 'Pengadukan Homogen' },
  { id: 'STABILIZING', label: 'Stabilisasi Larutan' },
  { id: 'MEASURING_TDS', label: 'Pengukuran TDS' },
  { id: 'GATE_EVALUATE', label: 'Evaluasi Gate' },
  { id: 'TOPUP_DOSING', label: 'Dosis Tambahan' },
  { id: 'RECOVERY_MIX_EVALUATE', label: 'Pengadukan Ulang' },
  { id: 'DISTRIBUTING', label: 'Distribusi Nutrisi' },
  { id: 'BATCH_DEPLETED', label: 'Batch Selesai' },
];

export function PipelineStepper({ currentState }: { currentState: string }) {
  const currentIndex = FSM_STEPS.findIndex((s) => s.id === currentState);

  return (
    <nav aria-label="Tahapan Siklus Fertigasi" className="w-full py-3">
      <ol role="list" className="flex items-center justify-between gap-1 w-full overflow-x-auto">
        {FSM_STEPS.map((step, idx) => {
          const isCompleted = idx < currentIndex;
          const isCurrent = idx === currentIndex;
          const statusText = isCompleted ? "Selesai" : isCurrent ? "Sedang Berjalan" : "Belum Berjalan";

          return (
            <li
              key={step.id}
              aria-current={isCurrent ? "step" : undefined}
              className="flex-1 min-w-[70px] flex flex-col items-center"
            >
              <div
                aria-label={`Tahap ${idx + 1} dari 12: ${step.label}, ${statusText}`}
                tabIndex={0}
                className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs transition-all focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-500 ${
                  isCurrent
                    ? "bg-blue-600 text-white ring-4 ring-blue-500/20 scale-110 shadow-sm"
                    : isCompleted
                    ? "bg-emerald-500 text-white"
                    : "bg-slate-100 text-slate-400 border border-slate-200"
                }`}
              >
                {isCompleted ? "✓" : idx + 1}
              </div>
              <span className="text-[10px] font-medium text-slate-500 mt-1 text-center truncate max-w-[72px]" aria-hidden="true">
                {step.label}
              </span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
```
- **Accessibility Tree:** Role: `navigation`, Label: `"Tahapan Siklus Fertigasi"`, List items: `"Tahap 4 dari 12: Injeksi Nutrisi, Sedang Berjalan"`, `aria-current="step"`.
- **WCAG Mapping:** SC 1.3.1 Info and Relationships, SC 2.4.8 Location, SC 4.1.2 Name, Role, Value.

---

## 7. Playwright E2E `data-testid` Contract Registry

To eliminate test fragility across CI suites ([`13_TESTING.md`](file:///home/maria_zahra/Documents/projects/greenhouse/desanomia/brain/13_TESTING.md)), components expose standardized `data-testid` attributes:

| Category | Component / Node | `data-testid` Selector | Expected Value / Behavior |
| :--- | :--- | :--- | :--- |
| **Shell & Header** | Persistent Header Shell | `kiosk-header` | Outer header container |
| | Master Emergency Stop | `kiosk-master-estop` | Persistent $64 \times 64\text{ px}$ button at `z-[100]` |
| | Live FSM Status Pill | `kiosk-fsm-pill` | Text content equals FSM state name |
| | WebSocket Semaphore | `kiosk-ws-status` | `ONLINE`, `STALE`, or `OFFLINE` |
| | Admin Step-Up Timer | `kiosk-admin-timer` | Remaining elevation countdown |
| **Dashboard Bento**| FSM Status Card | `fsm-status-card` | Container card |
| | Live TDS Hero Value | `tds-hero-value` | Text content: e.g. `1248` |
| | Tolerance Gate Badge | `tds-gate-badge` | Text content: `Dalam Toleransi` etc. |
| | Multi-Tank Card | `tank-visualizer-card`| Tank manifold container |
| | Drum 1 Stock Readout | `drum1-volume-val` | Text content: e.g. `18.2 L` |
| | Drum 2 Level Readout | `drum2-volume-val` | Text content: e.g. `140.0 L` |
| | Actuator Panel | `actuator-bench` | Matrix container |
| | Actuator Relay 1 (SV1)| `relay-status-sv1` | `ON` or `OFF` |
| | Actuator Relay 2 (PP1)| `relay-status-pp1` | `ON` or `OFF` |
| | Actuator Relay 3 (M1) | `relay-status-m1` | `ON` or `OFF` |
| | Actuator Relay 4 (Dist)| `relay-status-dist` | `ON` or `OFF` |
| **Pipeline Stepper**| Pipeline Stepper Bar | `pipeline-stepper` | Stepper container |
| | Stepper Nodes (1..12) | `stepper-step-{1..12}` | Step node matching state |
| **Operational CTAs**| Mulai Batch Trigger | `batch-start-btn` | Opens UI-08 Setup Modal |
| | Batch Submit Button | `batch-modal-submit` | Dispatches `POST /batches` |
| | Reset Fault Button | `fault-reset-btn` | Gated recovery trigger |
| | Refill Confirm Trigger| `refill-confirm-btn` | Opens UI-21 Refill Modal |
| **Modals & Overlays**| Pause Mode Modal | `modal-pause-mode` | UI-19 cold-boot inspection |
| | E-Stop Recovery Modal| `modal-estop-recovery` | UI-20 tiered recovery |
| | Same-Day Confirm Modal| `modal-same-day-confirm`| UI-16 double distribution |
| | Same-Day Risk Box | `same-day-risk-checkbox`| Mandatory risk acknowledgement |
| | Same-Day Force Hold | `same-day-confirm-btn` | 3-second press-and-hold button |
| | Admin Elevation Modal | `modal-admin-elevate` | UI-22 step-up challenge |
| | Numpad Digit Keys | `numpad-key-{0..9}` | Digit touch buttons |
| | Numpad Decimal Key | `numpad-key-dot` | Decimal point key |
| | Numpad Submit | `numpad-submit` | PIN authentication commit |

---

## 8. Verification & Compliance Matrix

| Specification Item | Master Authority | Implementation Verification Standard |
| :--- | :--- | :--- |
| **No Next.js / RSC** | [`D-005`](file:///home/maria_zahra/Documents/projects/greenhouse/desanomia/brain/18_DECISIONS.md#L22) | Verified `frontend/package.json` contains `vite` and `react`, with zero `@next` or server dependencies. |
| **Display Tier Scope** | [`D-014`](file:///home/maria_zahra/Documents/projects/greenhouse/desanomia/brain/18_DECISIONS.md#L40), [`D-026`](file:///home/maria_zahra/Documents/projects/greenhouse/desanomia/brain/18_DECISIONS.md#L64), `D-050` | Tier 1 (15.6" Kiosk), Tier 2 (43" Gazebo TV 30/70 split), and Tier 3 (Mobile PWA) render distinct verified layouts. |
| **Touch Ergonomics** | [`D-019`](file:///home/maria_zahra/Documents/projects/greenhouse/desanomia/brain/18_DECISIONS.md#L50), `D-050` | Uniform $\ge 56 \times 56\text{ px}$ on Tier 1; E-Stop is $64 \times 64\text{ px}$ at `z-[100]`; $\ge 12\text{ px}$ clearance. |
| **Non-Inert E-Stop** | `D-050` | Radix UI dialogs leave top header un-inert; E-Stop remains clickable at all times. |
| **Pessimistic Timeout**| [`D-047`](file:///home/maria_zahra/Documents/projects/greenhouse/desanomia/brain/18_DECISIONS.md#L114), [`D-049`](file:///home/maria_zahra/Documents/projects/greenhouse/desanomia/brain/18_DECISIONS.md#L130) | 3.0s timeout enters `OUTCOME_UNKNOWN` keeping controls locked; retries reuse original `cmd_id`. |
| **Gated Fault Reset** | [09 §3.1](file:///home/maria_zahra/Documents/projects/greenhouse/desanomia/brain/09_ERROR_HANDLING.md#L209), [`D-048`](file:///home/maria_zahra/Documents/projects/greenhouse/desanomia/brain/18_DECISIONS.md#L119) | Reset button disabled until `hw_estop_pressed == false`, `drum2 <= 8.0L`, and `radar_online == true`. |
| **Same-Day Lockout** | [`D-039`](file:///home/maria_zahra/Documents/projects/greenhouse/desanomia/brain/18_DECISIONS.md#L94), `D-050` | HTTP 409 triggers UI-16; mandates risk checkbox + 3-second press-and-hold confirmation. |
| **Offline Autonomy** | [`04_TRD:TR-01`](file:///home/maria_zahra/Documents/projects/greenhouse/desanomia/brain/04_TRD.md#L45) | Build output contains zero references to external origins or CDNs. CI fails on remote URL grep. |
| **Numeric Typography** | `D-050` | `.telemetry-numeral` applies Space Grotesk tabular numerals preventing layout shift at 1.0 Hz. |
| **Contrast Ratios** | `D-050` | `--text-primary` #0F172A on #FFFFFF provides 15.8:1 contrast, satisfying WCAG AAA. |
| **Zero-Scroll Boundary**| `D-050` | Cockpit dashboard fits 1080px non-scrolling budget; tables on `/batches` scroll internally. |
| **Stream A11y Boundary**| `D-050`, `a11y-architect` | 1.0 Hz raw telemetry streaming strictly prohibited from driving `aria-live`; 3-tier announcer. |
| **Modal A11y Dismissal**| `D-050`, `a11y-architect` | Safety overlays (UI-16, UI-19, UI-20) non-dismissible via Escape/backdrop; routine modals dismissible. |
| **Audio-Visual Parity** | `D-050`, `a11y-architect` | All chimes $< 1.5\text{ s}$ non-looping; UI-17 audio mute toggle; 100% visual banner/toast parity. |
| **Skip Navigation & Focus**| `D-050`, `a11y-architect` | First DOM element is `#main-cockpit` skip link; focus rings use 4px blue-500 with 2px white offset. |
| **Gated Action A11y**   | `D-050`, `a11y-architect` | Blocked controls use `aria-describedby` linking to physical cause (`hw_estop_pressed`, etc.). |

