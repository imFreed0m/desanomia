# 12 UI Specification

> **Authority Notice:** Single Source of Truth (SOTT) for Desanomia's Industrial Cockpit user interface architecture, multi-tier display environments, component registry (`UI-01` to `UI-18`), client state management, WebSocket telemetry ingestion, touch ergonomics, and accessibility. Governed by [00_MASTER_RULES.md](file:///home/maria_zahra/Documents/projects/greenhouse/desanomia/brain/00_MASTER_RULES.md), [03_UI_UX_BRIEF.md](file:///home/maria_zahra/Documents/projects/greenhouse/desanomia/brain/03_UI_UX_BRIEF.md), [04_TRD.md](file:///home/maria_zahra/Documents/projects/greenhouse/desanomia/brain/04_TRD.md), [08_SECURITY.md](file:///home/maria_zahra/Documents/projects/greenhouse/desanomia/brain/08_SECURITY.md), [09_ERROR_HANDLING.md](file:///home/maria_zahra/Documents/projects/greenhouse/desanomia/brain/09_ERROR_HANDLING.md), [10_FIRMWARE_SPEC.md](file:///home/maria_zahra/Documents/projects/greenhouse/desanomia/brain/10_FIRMWARE_SPEC.md), [11_API_CONTRACT.md](file:///home/maria_zahra/Documents/projects/greenhouse/desanomia/brain/11_API_CONTRACT.md), and [18_DECISIONS.md](file:///home/maria_zahra/Documents/projects/greenhouse/desanomia/brain/18_DECISIONS.md).

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
- **Forbidden Regressions (D-005):** Next.js, React Server Components (RSC), and Server Actions are strictly prohibited. The system must operate fully decoupled from node runtime servers.
- **Styling & Design System:** Tailwind CSS 3.4+ configured with modern `oklch()` color spaces, CSS Container Queries (`@container`), and custom industrial cockpit tokens.
- **Component Primitives:** shadcn/ui built on headless Radix UI accessible primitives.
- **Data Visualization:** Apache ECharts 5+ for historical time-series telemetry charts with canvas-accelerated rendering.
- **Fluid Surface Physics Engine (D-046):** Dual-layer HTML5 Canvas 2D procedural sine-wave engine rendering fluid hydrodynamics at 60 FPS without WebGL/Three.js overhead.
- **Icons & Visuals:** Lucide React icons bundled locally as SVG vectors.
- **Client State Management:** Zustand 4+ with fine-grained selector discipline and immer middleware.
- **Network Ingestion:** Native WebSocket client with auto-reconnection and exponential backoff, coupled with Axios/Fetch for CQS HTTP REST command dispatch.

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

Per decisions [`D-014`](file:///home/maria_zahra/Documents/projects/greenhouse/desanomia/brain/18_DECISIONS.md#L16), [`D-019`](file:///home/maria_zahra/Documents/projects/greenhouse/desanomia/brain/18_DECISIONS.md#L21), and [`D-026`](file:///home/maria_zahra/Documents/projects/greenhouse/desanomia/brain/18_DECISIONS.md#L33), Desanomia serves three distinct hardware display tiers with tailored behavioral profiles:

| Specification Parameter | Tier 1: Primary HMI Kiosk | Tier 2: Gazebo Monitoring TV | Tier 3: Mobile PWA Client |
| :--- | :--- | :--- | :--- |
| **Target Hardware** | UPERFECT BE156PF 15.6" IPS FHD (1920×1080) | Xiaomi TV A 43" Google TV FHD (1920×1080) | Smartphone Browsers (Safari / Chrome, 360–430px) |
| **Physical Mounting** | Standing console (90 cm height) in Greenhouse Panel Room | VESA 200×200 wall bracket in Gazebo Dining/Lounge | Handheld field operator mobile device |
| **Windowing / Runtime** | Cage Wayland compositor running Chromium kiosk | Fully Kiosk Browser on Android TV (Wired LAN) | Mobile Safari / Chrome running as standalone PWA |
| **Network Path** | Direct HDMI 2.0 + USB-C touch loopback (`127.0.0.1:8080`) | Wired Ethernet (`192.168.1.50`) via PTP bridge | Tailscale Mesh VPN (`100.x.y.z`) or Greenhouse Wi-Fi |
| **User Role & Session** | Persistent `Operator` session; 15-min Admin step-up | Locked `Viewer` role (auto-authenticated by IP) | Authenticated `Operator` or `Admin` (8h sliding / 7d max) |
| **Emergency Stop (E-Stop)**| **Instant 1-Tap Pill** ($56 \times 56\text{ px}$ min, no modal) | **Hidden** (Passive billboard display) | **2-Step Gated Confirmation Modal** (`aria-modal="true"`) |
| **Interaction Mode** | 10-point capacitive touch (cursor hidden) | Read-only passive billboard (remote D-pad disabled) | Responsive mobile touch / scrollable stack |
| **Screen Budget** | Fixed 1920×1080 viewport (**Zero vertical scrolling**) | Fixed 1920×1080 viewport (**Zero vertical scrolling**) | Fluid vertical stack with sticky bottom control pill |
| **Outage Recovery** | Auto-reload page if WebSocket down $> 60\text{ s}$ | Auto-reload page if WebSocket down $> 120\text{ s}$ | Stale indicator pill with manual tap-to-reconnect |

### 2.1 Panel Room Touch Ergonomics Invariant (D-019)

Greenhouse operators frequently operate the HMI kiosk while wearing nitrile gloves or with damp, soil-stained hands. The interface strictly enforces tactile touch geometry:
- **Emergency Stop Button:** Minimum touch bounding box of **$56 \times 56\text{ CSS px}$** (Kiosk top right header renders a $64 \times 64\text{ px}$ pill). Touching this button immediately trips software E-stop within $< 16\text{ ms}$ without modal friction.
- **Routine Operational Controls:** Minimum touch bounding box of **$48 \times 48\text{ CSS px}$** (`min-h-[48px] min-w-[48px]`), with standard buttons engineered at **$56\text{ px}$** height.
- **Button Spacing:** Adjacent operational buttons maintain a minimum physical clearance of **$12\text{ px}$** to eliminate accidental neighboring triggers.
- **Integrated On-Screen Touch Numpad (UI-13 / Sub-component):** All numeric input fields (Target TDS PPM, calibration offsets, manual jog volumes) spawn an integrated on-screen numpad with $72 \times 72\text{ px}$ tactile digit keys, completely preventing operating system on-screen keyboards from obscuring the viewport.

---

## 3. Page Route Map & Navigation Architecture

The application is structured into focused operational views governed by client-side routing (`react-router-dom` v6):

| Route Path | View Title | Permitted Roles | Primary Function & View Composition |
| :--- | :--- | :--- | :--- |
| `/login` | Masuk Sistem | All (Public) | Secure login interface with credentials entry or on-screen keypad PIN. |
| `/` | Dashboard Cockpit | `Viewer`, `Operator`, `Admin` | Primary Bento Grid: 5-pair visualizer, hero TDS, FSM status, live timeline, actuator bench. |
| `/batches` | Riwayat Batch | `Viewer`, `Operator`, `Admin` | Searchable, paginated audit table of historical batch executions with gate evaluation badges. |
| `/batches/:id` | Detail Batch | `Viewer`, `Operator`, `Admin` | Deep forensic view of single batch: time-series sensor traces, FSM transition logs, dosing record. |
| `/recipes` | Manajemen Resep | `Viewer` (view), `Admin` (edit)| Recipe cards (Vegetatif 1100, Generatif 1250, Panen 1050), target PPM limits, formula editor. |
| `/schedules` | Jadwal Fertigasi | `Viewer` (view), `Operator`/`Admin` | 5-tank conflict-free calendar view, cron configuration, next-trigger previews. |
| `/manual` | Uji Diagnostik | `Operator`, `Admin` | Manual actuator jog controls (+10 mL peristaltic, 10s mixer), calibration wizard launcher. |
| `/users` | Kelola Pengguna | `Admin` (Elevated) | User account administration, role assignment, credential resets, audit trail review. |
| `/403` | Akses Ditolak | All | Role-elevation prompt or permission denied notice with return CTA. |
| `/404` | Halaman Tidak Ditemukan | All | Fallback 404 view with 1-tap navigation back to `/`. |

### 3.1 Persistent Industrial Cockpit Shell

The layout shell wraps all protected views in a unified, non-scrolling industrial frame:

```
+-------------------------------------------------------------------------------------------------------------------------------------+
| [LOGO] desanomia    [Pair 1: Aktif] [Pairs 2-5: Standby]    [FSM: PREPARING_DOSING]    [WS: ONLINE 1.0Hz]    [BELL: 2]    [E-STOP (!!)] |
+-------------------------------------------------------------------------------------------------------------------------------------+
|                                                                                                                                     |
|                                                     MAIN CONTENT VIEWPORT CANVAS                                                    |
|                                       (Fixed 1920x1080 on Kiosk, Container Queried Bento Grid)                                      |
|                                                                                                                                     |
+-------------------------------------------------------------------------------------------------------------------------------------+
| [SYSTEM FOOTER: Edge Beelink EQ12 • Firmware v1.4.2 • Core 1: 100Hz • DB Sync: 0ms • OT LAN: 192.168.10.1 • 2026-10-10 17:05:00]   |
+-------------------------------------------------------------------------------------------------------------------------------------+
```

1. **Top Navigation Header:**
   - **System Identity:** Desanomia wordmark with greenhouse identifier badge (`GH-01`).
   - **Tank Allocation Badge:** Indicates current active hardware pair (`Pair 1: Aktif`) and standby pairs (`Pair 2–5: Standby`).
   - **Live FSM State Pill:** Color-coded status badge showing current finite state machine state and elapsed state duration.
   - **Network & Engine Pill:** Real-time WebSocket connection state (`ONLINE`, `STALE`, or `OFFLINE`) with 1 Hz pulse dot.
   - **Notification Bell Hub (UI-17):** Slide-out drawer trigger displaying unread notification count badge.
   - **Admin Step-Up Timer Banner (D-026):** If operator is elevated to Admin, displays a countdown banner (`Elevasi Admin: 14m 22s tersisa [Kunci]`).
   - **Master E-Stop Button:** High-contrast crimson button for instantaneous software shutdown.
2. **Main Content Viewport:**
   - On Tier 1 (HMI Kiosk) and Tier 2 (Gazebo TV), the viewport strictly enforces `h-screen overflow-hidden` to guarantee a non-scrolling single-screen cockpit experience.
   - On Tier 3 (Mobile PWA), the viewport adopts a single-column flex-column layout with smooth touch scrolling and sticky top/bottom bars.
3. **Bottom Notification & Toast Surface:**
   - Floating interactive toast notifications spawn in the lower-right quadrant without occluding primary operational controls.

---

## 4. Comprehensive Component Registry (`UI-01` to `UI-18`)

The Desanomia dashboard interface is composed of eighteen signature industrial components:

```
+-----------------------------------------------------------------------------------------------------------------------------------------+
| TOP NAVIGATION BAR: [Logo]  [Pair 1 Active]  [FSM: DOSING]  [WS: 1.0Hz]  [Bell: 2]                                 [E-STOP BUTTON (!!)] |
+-----------------------------------------------------------------------------------------------------------------------------------------+
| [UI-18: PIPELINE STEPPER COMPONENT]                                                                                                     |
| [1:IDLE] -> [2:FILL] -> [3:CIRC] -> [4:DOSE*] -> [5:MIX] -> [6:STAB] -> [7:MEAS] -> [8:GATE] -> [9:DIST] -> [10:FLUSH] -> [11:DRAIN]   |
+-----------------------------------------------------------------------------------------------------------------------------------------+
| +-----------------------------------+ +-----------------------------------+ +---------------------------------------------------------+ |
| | UI-01: FSM STATUS CARD            | | UI-02: LIVE TDS GAUGE & GATE CARD | | UI-03: MULTI-TANK 5-PAIR VISUALIZER                     | |
| | State: PREPARING_DOSING           | |        1248 ppm                   | | +---------------------------+ +-----------------------+ | |
| | Batch: #20261010-01               | | [======== Gate Band ========]     | | | Drum 1 (Konsentrat 20L)   | | Drum 2 (Distrib. 140L) | | |
| | Elapsed: 00:04:12                 | | Target: 1250 ± 50 ppm (1200-1300) | | | 18.2 L (91%)              | | 140.0 L (100%)        | | |
| | Step: 4 of 12 (Dosing NPK)        | | Status: DALAM TOLERANSI (OK)      | | | Wave: Tenang              | | Wave: Pusaran Mixer   | | |
| | [UI-08: Mulai Batch] [UI-09: Reset] | | Baseline Air Baku: 104 ppm        | | | [Konfirmasi Refill]       | | [Manual Drain]        | | |
| +-----------------------------------+ +-----------------------------------+ +---------------------------+ +-----------------------+ | |
|                                                                             | Standby: [Pair 2] [Pair 3] [Pair 4] [Pair 5]            | |
|                                                                             +---------------------------------------------------------+ |
| +-------------------------------------------------------------------------+ +---------------------------------------------------------+ |
| | UI-06: INTERACTIVE TDS HISTORY CHART (Apache ECharts)                   | | UI-04: ACTUATOR STATUS PANEL & TEST BENCH               | |
| | [1h] [6h*] [24h] [7d]  --- Toleransi 1200-1300 ppm                      | | Katup Air Masuk (SV1)     : [OFF]     [Manual Jog 5s]   | |
| | ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~        | | Pompa Peristaltik (PP1)   : [RUNNING] [+10 mL Bump]     | |
| | Live Stream Point: 1248 ppm | Temp: 27.2°C | EC: 2.49 mS/cm             | | Pompa Mixer (M1)          : [RUNNING] [Mixer Jog 10s]   | |
| +-------------------------------------------------------------------------+ | Katup Distribusi (SV2)    : [LOCKED]  (Belum Matang)    | |
| +-------------------------------------------------------------------------+ | Pompa Sirkulasi (P1)      : [OFF]     [Jog 5s]          | |
| | UI-05: BATCH EVENT TIMELINE & AUDIT LOG                                 | +---------------------------------------------------------+ |
| | 17:01:00 - Transisi IDLE -> FILLING_WATER (Sukses, 140.0 L)             | | UI-15: DASHBOARD SCHEDULE CALENDAR & TIMELINE           | |
| | 17:03:15 - Transisi PREPARING_DOSING (Injeksi 380 mL NPK)               | | 06:00 - Pair 1 (Vegetatif 1100 ppm) [SELESAI]           | |
| | 17:05:00 - Target Tercapai: 1248 ppm (Delta: -2 ppm)                    | | 12:00 - Pair 1 (Generatif 1250 ppm) [BERJALAN]          | |
+---------------------------------------------------------------------------+-----------------------------------------------------------+ |
```

### 4.1 UI-01: FSM Status Card

- **Purpose:** Primary state indicator communicating the real-time operational phase of the greenhouse finite state machine.
- **Visual Presentation:** Prominent card in the primary Bento row. Renders a glowing status beacon: Emerald for normal processing, Amber for `BATCH_PAUSED_INSPECTION`, Red for latched fault states, Slate for `IDLE`.
- **Displayed Metrics:** Current FSM state name (e.g. `PREPARING_DOSING`), active `batch_id`, human-readable state phase (e.g. `Tahap 4 dari 12`), and elapsed duration stopwatch (`mm:ss`) formatted via `font-mono tabular-nums`.
- **Error Presentation:** If a fault is latched, displays a pulsating red alert banner displaying the exact firmware fault code (e.g. `FAULT_TDS_STABILIZATION_TIMEOUT`), trigger timestamp, and root-cause description.
- **Role Permissions:** Visible to all roles. Command buttons gated to `Operator` and `Admin`.

### 4.2 UI-02: Live TDS Gauge & Gate Card

- **Purpose:** Displays live water-nutrient electrical conductivity and TDS measurements evaluated against active recipe tolerance gates.
- **Hero Numeral:** Space Grotesk 64 px Bold display numeral rendering live PPM (e.g. `1248 ppm`) with zero layout shift via `font-mono tabular-nums`.
- **Dynamic Tolerance Gate Bands:**
  - **In Tolerance (OK):** $[ \text{Target} - 50, \text{Target} + 50 ]\text{ ppm}$ (e.g. 1200–1300 ppm for default 1250 ppm recipe). Rendered in vibrant Emerald (`text-emerald-400`, `bg-emerald-500/10`).
  - **Deficit Recovery Band (Amber):** $[ \text{Target} - 250, \text{Target} - 50 )\text{ ppm}$. Rendered in Coral Amber (`text-amber-400`, `bg-amber-500/10`). Indicates automated top-up dosing or pause recovery needed.
  - **Starved / Out of Band (Red):** $< \text{Target} - 250\text{ ppm}$ or $> \text{Target} + 50\text{ ppm}$. Rendered in Vivid Crimson (`text-red-500`, `bg-red-500/10`).
- **Water Baseline Offset (D-036):** Displays reference municipal/well raw water baseline reading (e.g. `Baseline Air Baku: 104 ppm`).
- **Accessible Text Mirror:** In compliance with WCAG 2.2 AA non-color contrast mandates, explicit text labels accompany colors: `"Dalam Toleransi"`, `"Kurang Nutrisi (Defisit)"`, or `"Melebihi Batas Toleransi"`.

### 4.3 UI-03: Multi-Tank 5-Pair Visualizer & Fluid Physics (D-040, D-046)

- **Purpose:** Visual representation of the greenhouse fertigation vessel manifold across 5 physical tank pairs (Concentrate Drum 1 + Distribution Drum 2).
- **Tank Pair Allocation Display:**
  - **Pair 1 (Aktif):** Live radar telemetry driving Distribution Drum 2 level (140 L capacity) and virtual stock decrement tracking Concentrate Drum 1 level (20 L capacity).
  - **Pairs 2–5 (Standby):** Rendered with industrial hatched pattern and `Standby / Belum Terpasang` status badges. Clicking standby pairs opens the zero-conflict schedule assignment inspector.
- **Procedural Fluid Hydrodynamics Engine (D-046):** Dual HTML5 `<canvas>` elements running procedural sine-wave algorithms at 60 FPS ($< 5\%$ CPU utilization on Intel N100):
  - `IDLE`: Gentle breathing wave ($A = 2.0\text{ px}, \omega = 0.02$).
  - `FILLING_WATER`: High-amplitude filling wave with surface foaming ($A = 8.0\text{ px}, \omega = 0.08$).
  - `CIRCULATING` / `MIXING`: High-frequency rotational vortex shear ripples ($A = 6.0\text{ px}, \omega = 0.12$).
  - `STABILIZING`: Glassy mirror calm decay ($A \to 0.5\text{ px}$).
  - `MEASURING_TDS`: Neon probe pulse emission expanding from probe sensor coordinates.
  - `DISTRIBUTING`: Draining outflow surface suction wave ($A = 4.0\text{ px}$).
  - `BATCH_PAUSED_INSPECTION`: Pulsating amber deficit warning wave.
  - `FAULT_*` / `ESTOP`: Pulsating crimson hazard ripple.
- **Accessibility Mirror:** Each canvas pairs with an accessible screen-reader element:
  ```html
  <div role="meter" aria-label="Volume Drum 2 Distribusi" aria-valuenow="140.0" 
       aria-valuemin="0.0" aria-valuemax="140.0" aria-valuetext="140.0 Liter (Penuh)" class="sr-only">
    140.0 L (100%)
  </div>
  ```

### 4.4 UI-04: Actuator Status Panel

- **Purpose:** Diagnostic matrix displaying active electrical status of all 5 system actuators driven by active-LOW relay modules (`IL-01` to `IL-07`).
- **Monitored Actuators:**
  1. Katup Solenoid Air Bersih (SV1) — GPIO 4
  2. Pompa Peristaltik Nutrisi (PP1) — GPIO 5
  3. Motor Pengaduk / Mixer (M1) — GPIO 6
  4. Katup Solenoid Distribusi (SV2) — GPIO 7
  5. Pompa Sirkulasi (P1) — GPIO 15
- **Source Badges:** Every actuator displays an origin pill:
  - `[FSM Otomatis]` — Commanded by firmware state machine sequence.
  - `[Manual Operator]` — Commanded via manual diagnostic jog.
  - `[Interlock Locked]` — Hardware or firmware interlock actively inhibiting actuation (e.g. `P1 Locked: Dry-Run Guard`).
- **Verbatim Interlock Reason:** Hovering or tapping a locked actuator presents the exact firmware rejection rule (e.g. `IL-03: Pompa dilarang aktif saat volume air < 20.0 L`).

### 4.5 UI-05: Batch Event Timeline

- **Purpose:** Real-time chronological audit trail of state transitions and sensor gates for the active batch.
- **Event Log Entries:** Displays event timestamp, state transition (`IDLE -> FILLING_WATER`), automated dosing volumes injected (e.g. `Dosed: 380 mL NPK A+B`), stabilization settling times, and tolerance gate evaluation results.
- **Telemetry Pinning:** Each historical entry displays a snapshot of TDS, temperature, and water level captured at the moment of transition.

### 4.6 UI-06: Interactive TDS History Chart

- **Purpose:** Interactive time-series telemetry visualization powered by Apache ECharts.
- **Data Series:**
  - Primary Line: Temperature-compensated TDS (ppm) in bold sky blue (`#38BDF8`).
  - Secondary Line: Drum 2 Water Volume (L) in translucent emerald (`#34D399`).
  - Reference Shaded Band: Upper and lower tolerance gate boundaries (e.g. 1200–1300 ppm) shaded in subtle green (`rgba(16, 185, 129, 0.1)`).
  - Baseline Line: Horizontal dotted line indicating raw water baseline reading (104 ppm).
- **Time Window Scrubber:** Interactive range pills for `1 Jam`, `6 Jam`, `24 Jam`, and `7 Hari`.
- **Performance Invariant:** Rendered in canvas mode with downsampling (`lttb` algorithm) to maintain silky 60 FPS scrubbing on low-power devices.

### 4.7 UI-07: ESP32 Connectivity Indicator

- **Purpose:** Real-time hardware health and bridge connectivity monitor.
- **Three-State Semaphore:**
  - **ONLINE (Hijau):** Heartbeat packets received within $< 3.0\text{ s}$. Renders pulsing emerald beacon and live latency readout (`Ping: 12ms`).
  - **STALE (Kuning):** No telemetry packet received for $3.0\text{ s} \le t \le 10.0\text{ s}$. Displays amber warning banner: `"Data Usang: Menunggu Respons ESP32..."`.
  - **OFFLINE (Merah):** No packet for $> 10.0\text{ s}$ or MQTT broker disconnected. Dims dashboard telemetry, displays red banner, and locks all mutating control buttons.
- **Hardware Telemetry Flyout:** Tapping the indicator reveals ESP32 internal vitals: Free SRAM (KB), Free PSRAM (KB), Uptime (`hh:mm:ss`), Wi-Fi RSSI (dBm), and Active Safety Interlocks status.

### 4.8 UI-08: Jadwalkan / Mulai Batch (Unified Setup Modal)

- **Purpose:** Unified workflow modal for configuring, scheduling, or immediately initiating a fertigation batch without double-confirmation friction.
- **Three-Step Integrated Flow:**
  1. **Pemilihan Resep (Recipe Selection):** Dropdown selector featuring active presets (`Vegetatif 1100 ppm`, `Generatif 1250 ppm`, `Panen 1050 ppm`) or custom recipe target entry via on-screen numpad.
  2. **Waktu Pelaksanaan (Timing Dispatch):** Choice between `Sekarang` (Immediate execution) and `Jadwalkan Nanti` (Time-picker for scheduled cron dispatch).
  3. **Alokasi Tangki (Target Tank Pair):** Selection of target tank pair (`Pair 1` to `Pair 5`).
- **Autonomous Execution Invariant:** When `Mulai Sekarang` is selected, the system initiates water filling and dosing. Upon passing the TDS gate evaluation, the system **automatically transitions to DISTRIBUTING** without demanding a second confirmation click from the operator.

### 4.9 UI-09: Reset Fault Button & Recovery Protocol

- **Purpose:** Safety-critical recovery button for clearing latched firmware faults (`FAULT_ESTOP`, `FAULT_DRY_RUN`, `FAULT_LEAK_OVERFLOW`, etc.).
- **Dual Hardware Interlock Gating (`TR-10`, `D-012`, `D-019`):**
  The Reset Fault button is **disabled and visually locked** until both hardware preconditions evaluate to `true` in live telemetry:
  1. **Physical E-Stop Switch Twist-Released:** Telemetry must report `hw_estop_pressed: false`. If switch is still physically depressed, the button displays: `"TOMBOL JAMUR MASIH TERTEKAN - PUTAR UNTUK MELEPAS"`.
  2. **Drum 2 Fluid Level Cleared:** Level sensor must report fluid volume $\le 5.0\text{ L}$. If fluid remains in Drum 2, the button displays: `"KURAS DRUM HINGGA ≤ 5.0 L SEBELUM RESET"`.
- **Friction Confirmation:** When both preconditions are satisfied, tapping the button opens a modal requiring password/PIN confirmation before dispatching `POST /api/v1/commands/reset-fault`.

### 4.10 UI-10: Batch History Table

- **Purpose:** Comprehensive historical audit table for past fertigation runs.
- **Columns:** ID Batch, Tanggal & Jam Mulai, Resep, Pasangan Tangki, Target TDS, TDS Akhir, Status Evaluasi (`LULUS`, `GAGAL`, `DIBATALKAN`), Durasi Total, Operator Penanggung Jawab.
- **Filters & Search:** Filter by date range, recipe preset, target pair, and pass/fail outcome.
- **Data Export:** 1-tap `Ekspor CSV` button generating client-side CSV files formatted with standard semicolon/comma delimiters.

### 4.11 UI-11: Manual Actuator Controls & Test Bench

- **Purpose:** Low-level diagnostic engineering interface for jogging individual actuators during commissioning or maintenance.
- **Tactile Jog Triggers:**
  - Solenoid SV1: `[Buka 5 Detik]` momentary pulse.
  - Peristaltic PP1: `[Injeksi +10 mL]` micro-jog pulse.
  - Mixer M1: `[Aduk 10 Detik]` jog pulse.
  - Solenoid SV2: `[Buka 5 Detik]` momentary pulse (strictly interlocked to volume $\ge 5.0\text{ L}$).
- **Interlock Transparency:** If an operator attempts an illegal jog (e.g. firing PP1 while SV1 is filling), the UI immediately displays a toast with the verbatim firmware rejection code: `REJECTED: IL-01 Interlock Active`.

### 4.12 UI-12: Schedule Management Dialog

- **Purpose:** Calendar timetable interface for creating and modifying automated fertigation schedules.
- **Conflict Prevention Engine:** Validates proposed schedules against existing bookings across all 5 tank pairs. Rejects overlapping allocations to guarantee the Zero Conflict Invariant.
- **Schedule Parameters:** Days of week (Senin–Minggu), Start Time (`hh:mm`), Target Tank Pair (`Pair 1` to `Pair 5`), Recipe Preset, Active/Inactive switch toggle.

### 4.13 UI-13: Login Page & On-Screen Numpad

- **Purpose:** Access control interface authenticating operators and administrators.
- **Layout:** Centered industrial authentication card featuring username/PIN inputs.
- **On-Screen Numpad Integration:** Tapping the PIN field opens tactile $72 \times 72\text{ px}$ numeric touch buttons for rapid PIN authentication without bringing up native OS virtual keyboards.
- **Security Compliance:** Implements rate-limiting feedback (locks for 60s after 5 failed attempts) and eliminates user enumeration by displaying a generic `"Nama pengguna atau PIN salah"` alert.

### 4.14 UI-14: User Management Table

- **Purpose:** Administrative interface for managing operator and viewer credentials.
- **Admin Elevation Required (D-026):** View is accessible only when an active session possesses verified `Admin` rights or has completed 15-minute step-up authentication.
- **Operations:** Create user account, assign role (`Viewer`, `Operator`, `Admin`), deactivate account, trigger password/PIN reset.

### 4.15 UI-15: Dashboard Schedule Calendar & Timeline Widget

- **Purpose:** Glanceable horizontal timeline mounted on the main dashboard showing today's fertigation timeline.
- **Visual Display:** 24-hour horizontal band with color-coded schedule blocks:
  - Grey: Past completed runs.
  - Pulsing Blue: Currently active running batch.
  - Green / Amber: Upcoming scheduled runs with countdown pills (`Mulai dalam 42 menit`).
- **Same-Day Visual Alert:** If a batch has already executed today, the remaining calendar band displays a subtle warning badge denoting same-day distribution lock.

### 4.16 UI-16: Same-Day Hard Confirmation Modal (UX-FR-17)

- **Purpose:** High-friction protective modal intervening when an operator attempts an ad-hoc or secondary batch on a calendar day where distribution has already completed.
- **Agronomic Safety Mandate:** Prevents accidental over-fertigation, fertilizer salt toxicities, and root rot resulting from double-watering greenhouse crops on the same day.
- **Friction Design:**
  - High-visibility warning border (`border-2 border-amber-500`).
  - Prominent alert text: *"Peringatan Asfiksia & Over-Fertigasi: Bed tanaman sudah menerima nutrisi hari ini. Distribusi kedua berisiko menyebabkan busuk akar dan keracunan garam pupuk."*
  - **3-Second Forced Button Lock:** The confirmation button (`Konfirmasi Override & Jalankan`) is **disabled for 3 seconds** with a visible countdown timer (`Aktif dalam 3s...`) to prevent reflexive double-tapping.
  - Commits `SAME_DAY_FORCE_OVERRIDE` event to audit trail with operator username and timestamp.

### 4.17 UI-17: In-App Notification Hub & Frosted Glass Drawer (D-025)

- **Purpose:** Centralized operational alerting hub uniting real-time banners, drawer history, and floating action toasts.
- **Header Bell Hub:** Persistent bell icon in top navigation displaying an unread counter badge.
- **Slide-Out Frosted Glass Drawer:** Clicking the bell smoothly slides out a right-side drawer styled with frosted glass backdrop (`backdrop-filter: blur(12px); background: rgba(15, 23, 42, 0.85);`). Categorizes alerts across 4 tiers:
  - **Critical (Merah):** E-Stop trips, sensor faults, pipe leak alarms.
  - **Warning (Kuning):** Stock concentrate low ($\le 3.0\text{ L}$), TDS stabilization delay.
  - **Info (Biru):** Batch completed, schedule armed.
  - **Success (Hijau):** Calibration committed, system restored.
- **Interactive Action Toasts:** Real-time toast notifications include 1-tap contextual action buttons:
  - Stock low alert: Includes `[Konfirmasi Isi Ulang]` action button.
  - Batch pause alert: Includes `[Lihat Detail Inspeksi]` action button.
- **Auditory Signaling:** Critical and Warning alerts emit a subtle, pleasant localized audio chime on the HMI Kiosk via Web Audio API.

### 4.18 UI-18: Pipeline Stepper Component (D-042)

- **Purpose:** Minimalist Apple-style horizontal process stepper tracking the 12 finite state machine lifecycle steps.
- **Physical Mounting:** Mounted directly above the active tank card spanning the width of the process section.
- **Visual Node States:**
  1. `IDLE` (Siaga)
  2. `FILLING_WATER` (Pengisian Air Bersih)
  3. `CIRCULATING` (Sirkulasi Awal)
  4. `PREPARING_DOSING` (Injeksi Nutrisi)
  5. `MIXING` (Pengadukan Homogen)
  6. `STABILIZING` (Stabilisasi Larutan)
  7. `MEASURING_TDS` (Pengukuran TDS & Suhu)
  8. `EVALUATING_GATE` (Evaluasi Ambang Toleransi)
  9. `DISTRIBUTING` (Distribusi ke Tanaman)
  10. `POST_DIST_FLUSH` (Pembilasan Pipa)
  11. `DRAINING_RESIDUE` (Pengosongan Sisa)
  12. `BATCH_DEPLETED` (Batch Selesai)
- **Node Semantics:**
  - **Completed Steps:** Solid emerald circle with white checkmark icon (`emerald-500`).
  - **Active Step:** Pulsing sky blue circle with glowing outer halo and live count-up/countdown timer.
  - **Upcoming Steps:** Muted slate circle with step sequence number (`slate-700`).
  - **Fault / Paused:** Amber or Red flashing node reflecting abnormal interruption.

---

## 5. Client State Architecture & WebSocket Data Ingestion

The frontend architecture strictly adheres to single-source unidirectional data flow. Components never poll HTTP endpoints for live telemetry.

```
                                +-----------------------------+
                                |  FastAPI Backend (Edge PC)  |
                                |  WebSocket: /ws/telemetry   |
                                +--------------+--------------+
                                               |
                                               | 1.0 Hz JSON Frames
                                               v
                                +-----------------------------+
                                |  Telemetry Ingestion Layer  |
                                |  useTelemetryStore (Zustand)|
                                +--------------+--------------+
                                               |
                +------------------------------+------------------------------+
                |                              |                              |
                v                              v                              v
    Fine-Grained Selector          Fine-Grained Selector          Fine-Grained Selector
  useTelemetryStore(s => s.tds)   useTelemetryStore(s => s.fsm)  useTelemetryStore(s => s.drum2)
                |                              |                              |
                v                              v                              v
      [UI-02: Live TDS Card]        [UI-01: FSM Status Card]       [UI-03: Tank Visualizer]
```

### 5.1 Zustand Store Architecture

State is partitioned into four decoupled stores:

1. **`useTelemetryStore`:**
   - Holds 1.0 Hz real-time sensor metrics: `tds_ppm`, `temperature_c`, `drum1_volume_l`, `drum2_volume_l`, `flow_rate_lpm`, `fsm_state`, `active_batch_id`, `actuators`, `safety_interlocks`, `hw_estop_pressed`, `timestamp`.
   - Updated strictly via incoming WebSocket frames.
2. **`useBatchStore`:**
   - Holds active batch configuration, historical timeline transitions, recipe parameters, and execution progress.
3. **`useNotificationStore`:**
   - Manages toast queue, unread notification counts, and slide-out drawer history.
4. **`useAuthStore`:**
   - Holds current authenticated user identity, role (`Viewer`, `Operator`, `Admin`), JWT token, and 15-minute admin step-up countdown.

### 5.2 Selector Discipline & Render Optimization

To ensure seamless 60 FPS performance on the low-power Intel N100 processor, components must **never subscribe to the root store**. Subscribing to the entire store triggers full-dashboard re-renders every 1.0 second.

**Strict Implementation Rule:**
```typescript
// FORBIDDEN: Causes entire component to re-render at 1.0 Hz
const { tds_ppm, fsm_state, actuators } = useTelemetryStore();

// MANDATORY: Fine-grained atomic selectors prevent unnecessary re-renders
const tdsPpm = useTelemetryStore((state) => state.tds_ppm);
const fsmState = useTelemetryStore((state) => state.fsm_state);
```

### 5.3 WebSocket Lifecycle & Exponential Reconnection

The client establishes a persistent connection to `ws://127.0.0.1:8080/ws/telemetry` (or via TLS remotely):
1. **Initial Hydration Frame ($< 500\text{ ms}$):** Upon connection establishment, the backend immediately pushes a full system state snapshot before commencing 1.0 Hz delta frames.
2. **Heartbeat & Liveness Watchdog:** Client expects a packet every $1.0\text{ s} \pm 200\text{ ms}$. If no packet arrives for $3.0\text{ s}$, status shifts to `STALE`. If no packet for $10.0\text{ s}$, connection is marked `OFFLINE`.
3. **Exponential Backoff Strategy:** When disconnected, reconnection attempts follow: $1\text{s} \to 2\text{s} \to 4\text{s} \to 8\text{s} \to \text{max } 15\text{s}$.
4. **Kiosk Auto-Recovery Watchdog:** If the WebSocket remains offline for $> 60\text{ s}$ continuously on the Tier 1 HMI Kiosk, the browser runtime executes a hard page reload (`window.location.reload()`) to recover from stalled network sockets.

### 5.4 Pessimistic UI Mutation Discipline (`usePessimisticMutation`)

In safety-critical greenhouse automation, optimistic UI updates (anticipating backend success) are **strictly forbidden**. Operators must never see a simulated state change before hardware confirms actuation.

**The Pessimistic Mutation Protocol:**
1. When an operator taps an action button (e.g. `Mulai Batch` or `Jog Solenoid`), the button immediately enters a disabled spinner state (`loading: true`).
2. The client dispatches HTTP `POST /api/v1/commands/...` with a unique UUID `cmd_id`.
3. The button remains disabled until either:
   - A correlated WebSocket frame arrives with `command_result` matching `cmd_id` (transitioning the button to success and releasing lock).
   - A $3.0\text{ s}$ timeout elapses without confirmation (reverting the button and presenting an error toast: `"Timeout: Hardware tidak merespons"`).

---

## 6. Design Tokens, Typography & Accessibility Standards

### 6.1 Industrial Cockpit Color Tokens

All styling tokens are declared in `frontend/src/index.css` leveraging standard hex and perceptual `oklch()` color definitions:

```css
:root {
  /* Foundations & Cockpit Surfaces */
  --cockpit-bg: #020617;              /* Tailwind slate-950 - Root foundation */
  --card-surface: #0F172A;            /* Tailwind slate-900 - Bento card panels */
  --card-surface-elevated: #1E293B;   /* Tailwind slate-800 - Modals and popovers */
  --border-subtle: #1E293B;           /* Tailwind slate-800 - Panel outlines */
  --border-active: #38BDF8;           /* Tailwind sky-400 - Focused element ring */

  /* Operational Status Semaphores */
  --status-normal: #10B981;           /* Tailwind emerald-500 - Process OK / Nominal */
  --status-normal-glow: rgba(16, 185, 129, 0.25);
  --status-warning: #F59E0B;          /* Tailwind amber-500 - Inspection / Deficit */
  --status-warning-glow: rgba(245, 158, 11, 0.25);
  --status-danger: #EF4444;           /* Tailwind red-500 - Critical Fault / E-Stop */
  --status-danger-glow: rgba(239, 68, 68, 0.35);
  --status-standby: #64748B;          /* Tailwind slate-500 - Idle / Standby pairs */

  /* Typography Colors */
  --text-primary: #F8FAFC;            /* Tailwind slate-50 - Hero text & numerals */
  --text-secondary: #94A3B8;          /* Tailwind slate-400 - Labels & secondary info */
  --text-muted: #64748B;              /* Tailwind slate-500 - Inactive captions */
}
```

### 6.2 Typographic Hierarchy & Tabular Invariant

1. **Display & Telemetry Numerals:** **Space Grotesk**
   - Sharp, geometric, precision scientific character. Used for all large telemetry figures, TDS readouts, and tank volume gauges.
   - **Mandatory Tabular Formatting:** All numerical readouts must specify `font-mono tabular-nums` (or `font-variant-numeric: tabular-nums lining-nums;`) to prevent character width jitter during real-time 1 Hz updates.
2. **Body & User Interface:** **Geist Sans**
   - High-neutrality grotesque font engineered for optimal legibility at compact sizes across desktop and mobile screens.
3. **Hardware Identifiers & Logs:** **Geist Mono**
   - Fixed-pitch typeface used for UUIDs, `cmd_id` hashes, firmware error codes, and raw ADC voltage readouts.

### 6.3 Accessibility & Glare Readability (WCAG 2.2 AA)

Greenhouse environments experience severe ambient light variations, ranging from direct blinding tropical sunlight glare to dark nighttime operations:
- **Contrast Ratios:** Text-to-background contrast maintains a minimum of **$7.0:1$** for primary text and **$4.5:1$** for secondary captions (exceeding WCAG AAA). Graphical elements and active borders maintain a minimum of **$3.0:1$**.
- **No Color-Alone Signaling:** Color is never the sole communicator of state. Every green, amber, or red indicator is paired with an explicit typographic label (e.g. `[LULUS]`, `[PERINGATAN]`, `[BAHAYA]`).
- **Focus Ring Trapping:** Native HTML5 `<dialog>` elements manage focus trapping for all modals with visible high-contrast focus rings (`outline: 2px solid #38BDF8; outline-offset: 2px;`).
- **Screen Reader Announcements (`aria-live`):** FSM state transitions and fault alerts are routed through a dedicated `<div aria-live="assertive" class="sr-only">` element so screen readers immediately announce critical process events.

---

## 7. Verification & Compliance Matrix

| Specification Item | Master Authority | Implementation Verification Standard |
| :--- | :--- | :--- |
| **No Next.js / RSC** | `D-005` | Verified `frontend/package.json` contains `vite` and `react`, with zero `@next` or server dependencies. |
| **Display Tier Scope** | `D-014`, `D-026` | Tier 1 (15.6" Kiosk), Tier 2 (43" Gazebo TV), and Tier 3 (Mobile PWA) render distinct verified layouts. |
| **Touch Ergonomics** | `D-019`, `03_UI_UX_BRIEF` | E-Stop hit target is $\ge 56 \times 56\text{ px}$; routine buttons are $\ge 48 \times 48\text{ px}$ with $\ge 12\text{ px}$ spacing. |
| **Offline Autonomy** | `04_TRD:TR-01` | Build output contains zero references to external origins or CDNs. CI fails on remote URL grep. |
| **Procedural Fluids** | `D-046` | HTML5 Canvas 2D engine renders 60 FPS wave physics without WebGL, paired with semantic `<div role="meter">`. |
| **Gated Fault Reset** | `TR-10`, `D-012` | Reset button disabled until live telemetry confirms `hw_estop_pressed == false` and `drum2_volume <= 5.0L`. |
| **Tabular Numbers** | `design-system` | All live telemetry figures apply `font-mono tabular-nums` to eliminate numeral jitter at 1.0 Hz. |
| **Pessimistic Mutations** | `react-patterns` | Mutation controls disable immediately on tap, awaiting correlated WebSocket ACK or 3.0s timeout. |
