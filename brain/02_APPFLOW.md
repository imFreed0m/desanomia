# 02 Appflow

Screen navigation, user journeys, and what each click does. Functional behavior of each component is in 12_UI_SPEC, visuals in 03_UI_UX_BRIEF. [PROPOSED, SPEC defines roles, session login, dashboard and history features]

## Scope note

Desanomia has no splash screen, sign up, email verification, or onboarding wizard. Accounts are created by an Admin (see 08_SECURITY); there is no self-registration and no email.

Client authentication and access behave according to client tier:
- **Primary HMI Touchscreen Kiosk (Greenhouse Panel Room, 15.6" UPERFECT BE156PF on Beelink EQ12):** Automatically authenticates on boot or browser launch into a persistent local `Operator` session (zero keyboard or PIN typing required in the panel room). Provides immediate, permanent touchscreen access to batch control, modular drum animations, Refill Confirmation Gate, 1-tap E-Stop (min 56×56 px without modal), and manual testing. Navigating to Admin-only routes (`/users`) triggers an Admin Elevation modal prompting for Admin credentials.
- **Secondary Display Gazebo (Gazebo Monitoring, 43" Xiaomi TV A FHD 2026):** Operates 24/7 via Fully Kiosk Browser on Google TV™ in a passive, read-only mirror mode (`Viewer` role) over wired LAN / Gazebo DMZ. Displays live modular drum animations, process state, and telemetry. Interactive control mutations are omitted/disabled.
- **Remote Web & Mobile Clients (Smartphones / Laptops over WiFi / Tailscale):** Standard entry path: open URL, session check, login (`/login`) if unauthenticated, then Dashboard. E-Stop and batch mutation commands enforce confirmation dialogs (`aria-modal="true"`).

## Screen map

```mermaid
flowchart TD
  K[Primary HMI Kiosk Boot: 15.6" Panel Room] --> KD[Dashboard: Auto Operator Session]
  G[Secondary Display Boot: 43" Gazebo TV] --> GD[Dashboard: 24/7 Read-Only Viewer Mirror]
  S[Mobile Phone / Remote Web Start] --> C{Valid session?}
  C -- no --> L[Login]
  C -- yes --> D[Dashboard: 5-Tank Pairs & Calendar Timeline]
  L -- bad credentials --> L
  L -- ok, password change required --> PW[Change password]
  L -- ok --> D
  PW --> D
  KD --> D
  GD --> D
  D --> UBS[Unified Batch Setup: Recipe -> Timing 'Now/Later' -> Tank 1-5]
  UBS -- Timing 'Later' --> SC[Registered into Schedules & Dashboard Calendar]
  UBS -- Timing 'Now' & Same-Day Already Distributed? --> HC{Same-Day Distributed?}
  HC -- Yes --> HCD[Hard Confirmation Modal: Over-Fertigation Warning]
  HCD -- Cancel --> D
  HCD -- Hard Override Confirm --> PREP[Active Batch Preparation: Fill -> Dose -> Mix -> TDS Gate]
  HC -- No: First Run Today --> PREP
  PREP -- Gate Pass --> AD[100% Autonomous Distribution: Pump Runs Without 2nd Confirm]
  PREP -- Gate Fail --> GF[Latch Fault & Lock Pump: Manual Drain Needed]
  D --> PM[Pause Mode: Mid-Batch Interruption Modal]
  PM -- confirm resume / 30m timeout --> D
  D --> H[Batch history & Audit trail: /batches]
  H --> BD[Batch detail: /batches/:id]
  D --> SC[Schedules & Recurring Timetable]
  D --> MN[Manual control, Operator+]
  D --> AE{Kiosk?}
  AE -- yes --> EL[Admin Elevation Modal]
  EL -- valid admin --> US[Users, Admin]
  AE -- no, already Admin --> US
  D --> AC[Account: change password, logout]
  AC -- logout --> L
```

## Routes and access

| Route | Min role | Entered from | Leaves to |
| --- | --- | --- | --- |
| /login | none | Start, session expiry, logout | /change-password or Dashboard (or the page the user was on) |
| /change-password | any | Login when flagged, Account | Dashboard |
| / Dashboard | Viewer | Login, any nav item | History, Schedules, Manual, Users, Account |
| /batches | Viewer | Nav, active-batch link | Batch detail, Dashboard (has History & Audit tabs, date/status filters, CSV export) |
| /batches/:id | Viewer | History row, Dashboard timeline link | Back to History with filters kept (interactive TDS chart, metrics, step timeline) |
| /recipes | Viewer (edit Operator+) | Nav | Dashboard, Mulai Batch (Named preset library: add, edit default, archive; linked to batch history) |
| /schedules | Viewer (edit Operator+) | Nav | Dashboard |
| /manual | Operator | Nav | Dashboard |
| /users | Admin | Nav | Dashboard |
| /403, /404 | any | Guarded or unknown route | Dashboard |

Navigation shows only the routes the role may open. Direct URL access to a forbidden route goes to /403.

## Interaction functional requirements

- **UX-FR-01 (Modular Drum Liquid Animation Engine):** Render SVG/Canvas modular liquid surface animations for Drum 1 (virtual inventory 0.0–20.0 L) and Drum 2 (radar telemetry 0.0–140.0 L). Animations dynamically represent filling waves, dosing ripples, calm settling, and organic health glow states (cyan/blue normal, amber warning pulse when Drum 1 stock ≤ 2.8 L, red emergency/starved pulse) with zero reliance on text alert banners.
- **UX-FR-02 (Pessimistic Command Interaction & Zero Double-Dispatch):** Every mutation button (`Jadwalkan / Mulai Batch`, `Reset Fault`, `Resume Fill`, `Konfirmasi Isi Ulang`, `Emergency Stop`, and manual jogs) immediately locks to a disabled/pending state upon the initial tap (< 16 ms, within 1 browser animation frame). Generates a unique client-side UUID `cmd_id` and blocks further user input until positive MQTT acknowledgment or explicit timeout occurs.
- **UX-FR-03 (Greenhouse Panel Room Primary HMI Touchscreen Session):** Primary HMI Touchscreen (UPERFECT BE156PF 15.6" IPS FHD on 90 cm standing kiosk) automatically initializes on boot into a persistent local `Operator` session without login credentials or on-screen keyboards. All interactive tap targets on the kiosk interface maintain a strict minimum dimension of 56×56 px. Admin-only functions (e.g. `/users`) trigger a secure Admin Elevation modal.
- **UX-FR-04 (Dual Emergency Stop Interaction & Live Hardware Clearance Sensing):** Global, high-visibility red E-Stop button accessible on the persistent header across all screens. Local kiosk executes instant 1-tap dispatch without confirmation modal; remote web and mobile clients trigger a high-priority confirmation dialog with `aria-modal="true"`. De-energizes all 4 hardware relays on ESP32 in < 100 ms (`FAULT_ESTOP`). The physical panel door mushroom button connects via hardwired NC contact to an ESP32 GPIO interrupt pin. ESP32 continuously reports `hw_estop_pressed` boolean telemetry: while physical contacts remain open, UI `Reset Fault` is strictly locked with clear visual feedback ('Tombol E-Stop Fisik Masih Tertekan — Putar untuk Melepas'), unlocking dynamically the moment the physical switch is twisted out and released.
- **UX-FR-05 (Gated Fault Reset & Autonomous/Manual Resume Fill):** During latched faults, `Reset Fault` is physically and visually locked behind an inline drainage condition badge (*"Kuras drum hingga ≤ 5.0 L"*) whenever Drum 2 level exceeds 5.0 L, unlocking only when radar confirms ≤ 5.0 L. For fill faults (`FAULT_NO_WATER_SUPPLY`, `FAULT_FILL_TIMEOUT`), UI displays an active `Resume Fill` button on the Drum 2 widget, and backend background tasks monitor water line recovery to perform autonomous resume fill with Telegram notifications.
- **UX-FR-06 (Refill Confirmation Gate):** When Drum 1 concentrate is depleted or starved, batch initiation is interlocked (`STATION_LOCKED: CONCENTRATE_DEPLETED`). Operator must prepare 20 L / 2 kg NPK and tap `Konfirmasi Isi Ulang` on the Drum 1 widget (kiosk or mobile), opening a confirmation dialog that resets the virtual inventory counter to 20.0 L and commits an immutable backend audit record (`CONCENTRATE_REFILLED`).
- **UX-FR-07 (Named Recipe Presets Library, Custom Overrides & Historical Traceability):** Dedicated `/recipes` interface and interactive recipe picker on `Jadwalkan / Mulai Batch` and `/schedules`. Operators can manage named crop growth phase presets (e.g. *'Fase Vegetatif: 1100 ppm'*, *'Fase Generatif: 1250 ppm'*, *'Fase Panen: 1050 ppm'*), edit default target PPMs, create new custom presets, and archive obsolete ones. Starting a batch allows 1-click preset selection or numeric custom target entry. Every batch execution records an immutable snapshot of the active recipe name, target PPM, and tolerance gate band in PostgreSQL, ensuring historical batch traceability on `/batches/:id`.
- **UX-FR-08 (Fine-Grained Manual Actuator Calibration):** Dedicated `/manual` interface enables discrete peristaltic dosing bumps in +10 mL increments (1.07 s per 10 mL) and timed mixer runs specified per second. All manual toggles are strictly guarded by firmware safety interlocks and disabled during active batch FSM runs.
- **UX-FR-09 (Batch History, Interactive Time-Series & CSV Export):** `/batches` provides filtering by date and outcome status (ALL, COMPLETED, FAULTED, ABORTED) with one-click `Ekspor CSV`. `/batches/:id` renders an interactive time-series curve scrubber displaying TDS and level with the target tolerance band highlighted. Overarching `Audit Trail` tab inspects all system-wide commands.
- **UX-FR-10 (Error-Only Panel Buzzer Policy):** Acoustic buzzer is reserved strictly for hardware/firmware error and fault states. Zero acoustic alarms sound for normal batch readiness, pre-dispatch intervals, or routine distribution.
- **UX-FR-11 (Mid-Batch Interruption Pause Mode & Deficit Calculation):** On power restoration mid-batch with Drum 2 level > 5.0 L, the system boots into an un-energized `BATCH_PAUSED_INSPECTION` state. An elegant, dominating full-screen modal overlays both the panel monitor and remote web interfaces, locking interaction and displaying real-time volume, current PPM, calculated deficit concentrate (mL) needed to reach target PPM, and an acknowledgment button. If unacknowledged after 30 minutes and safety interlocks pass, the system automatically resumes dosing/distribution. Physical gravity drainage is required only during critical PPM spikes (> 500 ppm above target) or mechanical leaks.
- **UX-FR-12 (Autonomous Panel Room Operation & Multi-Tier Display Architecture):** The greenhouse panel room houses the Beelink EQ12 Mini-PC (server), Primary HMI Touchscreen (UPERFECT BE156PF 15.6"), and ESP32 operating 100% offline via local serial/LAN/HDMI. Core fertigation execution never stops regardless of internet availability. The Secondary Display (Xiaomi TV A 43" in Gazebo) functions as a 24/7 passive read-only mirror via Fully Kiosk Browser over Gazebo DMZ LAN, while remote mobile web access functions as a secondary control/monitoring client. During internet outages, mobile interfaces display last-known state and an offline indicator; upon reconnection, the UI hydrates a complete state snapshot in < 500 ms.
- **UX-FR-13 (Guided Sensor Calibration & Tank Maintenance Wizard):** Dedicated calibration wizard modal accessible via `/manual` for analog probes (DFRobot Gravity TDS probe and 60 GHz radar tank level). Because the TDS probe is tapped into the distribution tank (side/bottom), removal requires mandatory step-by-step guidance: (1) System safety verification that Drum 2 is fully drained (≤ 5.0 L) and FSM is IDLE; (2) Mechanical detachment instruction; (3) Live raw ADC voltage & noise stability readout; (4) 2-point buffer immersion (standard 1413 µS/cm buffer and reference baseline); (5) Water baseline calculation accounting for inherent raw water PPM; (6) Calibration commit to ESP32 non-volatile storage (NVS) with immutable audit logging.
- **UX-FR-14 (Schedule Conflict Arbitration & Mutual Exclusion):** Strict priority queue and mutual exclusion across batches. (1) Imminent Schedule Warning: If an operator initiates an ad-hoc batch while an automated schedule is due in < 15 minutes, the modal presents a prominent confirmation banner (*"Jadwal otomatis aktif dalam X menit — Memulai batch sekarang akan menunda atau menggantikan jadwal ini"*). (2) Active Run Deferral: If a batch is currently executing when a recurring schedule triggers, the scheduler defers the scheduled run until the active batch finishes and Drum 2 drains to ≤ 5.0 L (canceling if deferral exceeds 60 minutes).
- **UX-FR-15 (Unified Schedule-First Pipeline & Dynamic Baseline Reference):** All fertigation execution stems from manual operator setup. There is no unconfigured automation. Automated cycles run eternally in the background based on configured rules, unless an operator invokes an ad-hoc run ('Sekarang / Run Now'). When an operator runs an ad-hoc batch at an earlier time (e.g. at 10:00 when an automated run was scheduled for 11:00), the scheduled 11:00 run for that day is automatically deleted/suppressed to prevent over-watering, and the 10:00 execution timestamp is dynamically registered as the new baseline reference for the subsequent autonomous recurrence interval. Furthermore, batch initiation follows an upfront single-confirmation flow: Operator selects Recipe -> Sets Timing ('Now' or 'Later') -> Selects Target Tank Pair -> Confirms Start. Once water filling, dosing, mixing, and TDS measurement pass the gate, distribution into the beds executes **100% automatically** without requiring a second manual confirmation.
- **UX-FR-16 (Multi-Tank 5-Pair Visualization & Architectural Topology):** The system architecture accommodates 5 pairs of tanks: 5 Concentrate Drums (K1–K5, 20 L each) and 5 Distribution Drums (D1–D5, 140 L each). In Phase 1, Pair 1 (Concentrate Drum 1 and Distribution Drum 2 in physical nomenclature) is actively plumbed and sensored; Pairs 2–5 are visualized on the Dashboard with distinct 'Empty / Standby / Unassigned' visual states. Concentrate drums are rendered with smaller visual dimensions and dense, viscous fluid animations; Distribution drums are rendered with full dimensions and dynamic wave animations. The batch setup dialog provides explicit selection of the target tank pair.
- **UX-FR-17 (Same-Day Double Distribution Protection & Hard Confirmation Gate):** If a distribution cycle has already successfully completed on the greenhouse system on the current day, initiating an additional distribution on that day is strictly interlocked by default. An operator attempting an ad-hoc or secondary run must pass a high-friction Hard Confirmation Dialog with explicit warnings regarding the risk of root rot, plant asphyxiation, and fertilizer salt toxicity, requiring an intentional manual override confirmation that is logged to the backend audit trail (`SAME_DAY_FORCE_OVERRIDE`).
- **UX-FR-18 (Dashboard Schedule Calendar & Zero Hydraulic Conflict Invariant):** The Dashboard features an integrated Calendar and Timeline overview component displaying scheduled fertigation runs across dates and times, detailing target tank, assigned recipe, and target PPM. Because all distribution tanks share a unified high-pressure distribution pump and mainline manifold in Phase 1, no two distribution tanks can distribute on the same day or time (Zero Conflict Invariant). The calendar highlights active vs standby tanks and provides immediate visual conflict detection.


## Click behavior

| Action | What happens | Next |
| --- | --- | --- |
| Login submit, valid | Session cookie set, role loaded | Dashboard, or /change-password if flagged, or the page saved before expiry |
| Login submit, invalid | Generic error, field focus, rate limit applies | Stay on /login |
| Jadwalkan / Mulai Batch (Unified Setup) | Opens Unified Batch Setup modal: (1) Select Recipe (preset library or create custom), (2) Select Timing ('Sekarang / Run Now' vs 'Nanti / Scheduled' with date/time), (3) Select Target Tank Pair (Pair 1 [K1/D1 active], Pairs 2–5 [Standby/Empty]). If 'Sekarang' selected and a later schedule exists today, modal indicates later run will be canceled and 'now' set as new baseline reference. | Dialog |
| Confirm Batch Setup ('Sekarang / Run Now') | Button locks (Pessimistic UI). System inspects same-day distribution history. If already distributed today -> routes to Hard Confirmation Modal. If first run today -> commits POST /batches/start (target_ppm, recipe_id, tank_id=1, schedule_at='now'). Any later schedule today is canceled; execution timestamp registered as new baseline reference | See below / Hard Confirmation |
| Hard Confirmation (Same-Day Re-Run) | High-friction warning modal highlighting over-fertigation, root drowning, and EC shock risk. Requires deliberate operator override. On confirm, POST /batches/start with `force_same_day_override: true`. Commits audit record SAME_DAY_FORCE_OVERRIDE | Advances to active preparation FSM |
| Preparation FSM -> Autonomous Distribution | FSM executes FILLING_WATER -> CHECK_BASE -> DOSING -> MIXING -> STABILIZING -> MEASURING_TDS -> GATE_EVALUATE. Upon gate PASS, system **immediately and automatically transitions to DISTRIBUTING** without secondary operator confirmation (consent established upfront). Upon gate FAIL, locks pump and latches FAULT_PPM_OUT_OF_RANGE | DISTRIBUTING -> BATCH_DEPLETED -> IDLE |
| Confirm Batch Setup ('Nanti / Scheduled') | Button locks, validates zero hydraulic conflict on greenhouse manifold for specified date/time, POST /schedules (recipe, time, days, tank_id). Saves recurring schedule | Dialog closes, Dashboard Calendar and timeline update |
| Calendar Event / Day Tile Click | Clicking a scheduled run on Dashboard Calendar opens detail popover (target tank, assigned recipe, target PPM, scheduled time) with edit/cancel actions | Popover / Edit Dialog |
| command_result accepted | Dialog closes, success toast, FSM card moves to FILLING_WATER via WebSocket | Dashboard |
| command_result rejected | Dialog stays, shows firmware reason verbatim (interlock id, state, fault) | Dialog, user closes |
| command_result timeout | Dialog shows timeout and tells user to check device state | Dialog, user closes |
| Emergency Stop (Local Kiosk) | Persistent global header button (min 56×56 px, red). 1-tap instant trigger without dialog. POST /estop, ESP32 de-energizes all 4 relays in < 100 ms | FSM shifts to FAULT_ESTOP, drum animations pulse red emergency state, local panel buzzer/lamp activates |
| Emergency Stop (Remote Web) | Persistent global header button. Click opens urgent confirmation modal (aria-modal='true'). On confirm, POST /estop, relays de-energized | Dialog closes, FSM shifts to FAULT_ESTOP, drum animations pulse red emergency state |
| E-Stop Recovery & Hardware Clearance | Requires physical NC mushroom switch twist-release on hardware panel door. ESP32 GPIO interrupt/telemetry streams `hw_estop_pressed: false`. UI Reset Fault button remains locked with inline notice ('Tombol E-Stop Fisik Masih Tertekan — Putar untuk Melepas') until hardware switch contacts close, and requires Drum 2 level ≤ 5.0 L | Hardware relays re-enabled, drum emergency indicators clear, FSM returns to IDLE |
| Reset Fault | If `hw_estop_pressed == true`, locked with 'Tombol E-Stop Fisik Masih Tertekan — Putar untuk Melepas'. If Drum 2 > 5.0 L, locked with inline badge 'Kuras drum hingga ≤ 5.0 L'. Unlocks when physical E-stop switch is cleared and radar level ≤ 5.0 L. Dialog shows fault code and cause, locks on confirm, POST /fault/reset, waits for command_result | Dashboard, drum fault glow clears on success, FSM returns to IDLE |
| Resume Fill (Manual) | Triggered via fill-water action on Drum 2 animation widget during FAULT_NO_WATER_SUPPLY or FAULT_FILL_TIMEOUT. Dialog confirms re-opening fill valve without aborting batch, POST /batches/resume-fill | Dialog closes, fill solenoid re-energizes, Drum 2 animation resumes filling wave |
| Resume Fill (Autonomous) | Background monitoring detects water line pressure/flow restoration during fill fault; firmware/backend auto-retries fill without manual click | Dispatches Telegram alert for both original fault and autonomous resume; Drum 2 animation shifts to filling wave; zero in-app text banner |
| Konfirmasi Isi Ulang (Drum 1) | Available on Drum 1 animation widget (control screen or mobile) when stock is replenished. Dialog confirms 20.0 L (2 kg NPK) loaded. Resets virtual counter to 20.0 L, POST /concentrate/refill | Dialog closes, Drum 1 animation fills to 100% with normal glow, batch start unlocks, audit log records CONCENTRATE_REFILLED |
| Manual Dosing (+10 mL / custom) | On /manual, Operator taps '+10 mL' or enters target mL. Firmware energizes peristaltic pump at 0.107 s/mL (1.07 s per 10 mL) subject to safety interlocks | Inline progress indicator, real-time volume bump feedback, success toast |
| Manual Mixer Run (per second) | On /manual, Operator inputs run duration in seconds (e.g. 10 s, 30 s, 60 s) and presses Run Mix. Firmware runs mixer for exact duration then auto-shuts off | Inline timer countdown, mixer relay de-energizes at 0 s, toast |
| Sensor Calibration Wizard (Open) | On /manual, Operator clicks 'Kalibrasi Sensor TDS'. System checks Drum 2 volume. If > 5.0 L or FSM not IDLE, action locked with 'Kuras Drum 2 ≤ 5.0 L terlebih dahulu' | Interactive guided modal opens; live raw ADC voltage and radar level streamed |
| Sensor Calibration Wizard (Step 1-6) | Operator confirms tank drained -> unscrews/detaches TDS probe -> immerses probe in 1413 µS/cm buffer -> waits for 30s ADC stabilization -> calculates/records water baseline PPM offset -> clicks 'Simpan Kalibrasi ke ESP32' | ESP32 stores calibration slope/offset to NVS; modal displays success badge; audit log records SENSOR_CALIBRATED |
| History row click | Opens batch detail | /batches/:id |
| Filter Batch History | On /batches, select date range and status (ALL, COMPLETED, FAULTED, ABORTED). Table filters immediately | Stay on /batches |
| Ekspor CSV (Batches) | On /batches, click 'Ekspor CSV'. Downloads CSV file of filtered batch runs (timestamps, recipe target PPM, final measured PPM, volume, status, actor) | Browser file download |
| Audit Trail Tab | Click 'Audit Trail' tab on /batches to view immutable system log (logins, manual jogs, refills, resets, E-stops) | Stay on /batches?tab=audit |
| Acknowledge Pause Mode (Mid-Batch) | Prominent full-screen modal overlays display upon power recovery mid-batch (Drum 2 > 5.0 L). Displays calculated deficit concentrate mL and real-time status. Operator clicks 'Konfirmasi & Lanjutkan' | Modal dismisses, FSM resumes dynamic deficit dosing |
| Auto-Resume after Pause Timeout | If 30 min elapse without operator action in Pause Mode and safety interlocks pass, system resumes batch preparation/distribution automatically | Modal auto-clears, FSM advances to dosing/distribution, Telegram alert sent |
| Back from batch detail | Returns with previous filters and page | /batches |
| Active batch link on History | Opens live view | Dashboard |
| Recipe Presets: Select on Mulai Batch | Operator selects named preset (e.g. 'Fase Vegetatif: 1100 ppm') from dropdown or enters custom target; pre-populates target PPM and displays expected tolerance band [target-50, target+50] | Dialog updates target, operator confirms |
| Recipe Presets: Create / Edit / Archive | On /recipes, Operator+ adds new preset, modifies default target PPM, or archives obsolete preset. System validates target within 500–1800 ppm and commits change | Table refreshes, audit log records RECIPE_MODIFIED, active presets update across Mulai Batch and /schedules |
| Schedule save or delete | Configures scheduled run time, days of week, and recipe Target PPM. Next-run calculated and displayed on Dashboard | Stay on /schedules, Dashboard schedule indicator updates |
| Admin Elevation (Kiosk) | Opening /users or administrative settings on the persistent Operator kiosk prompts an elevation modal for Admin credentials. On valid password, temporary elevated session granted (15 min idle timeout) | /users, reverts to Operator on expiry or navigation away |
| Create, edit, deactivate user | Dialog form, toast, list refreshes | Stay on /users |
| Logout | Session invalidated server side (kiosk reloads into persistent Operator session; remote web returns to /login) | /login or Kiosk Dashboard |
| Session expired while on a page | Request returns 401, current path saved | /login, then back to saved path |

## In-App Notification Hub & 5W1H Operational Alert Matrix

In-app notifications are crafted with a minimalist, Apple-inspired glassmorphic aesthetic (subtle translucent frosted blurs, SF Pro/Inter typography, refined micro-borders, and high contrast legibility). The system pairs non-intrusive floating toasts with a persistent header notification center:

### 1. Delivery Surfaces (Where & How)
- **Header Notification Center:** A persistent bell icon with a live unread badge count in the top navigation bar. Tapping opens a sleek, slide-out frosted glass Notification Drawer categorizing alerts (*Semua*, *Kritis*, *Peringatan*, *Info*) with a 'Bersihkan Semua' action and timestamps.
- **Floating Interactive Toasts:** Rendered in the top-right (or top-center on mobile). Features smooth ease-in animations, clean status glyphs, and 1-tap interactive inline action buttons (e.g., `[Lihat Detail]`, `[Konfirmasi Refill]`, `[Kuras Drum]`).
- **Software Audio Chime Policy:** To maintain calm greenhouse operations without annoyance, subtle Apple-style UI audio chimes play on the Primary HMI Kiosk speakers *strictly for Critical and Warning events* (e.g., a gentle glass ping for warnings, a distinct double-tone chime for critical faults/E-stop). Routine Success and Info events are 100% silent. (Physical panel box buzzer is dedicated to hardware faults).

### 2. The 5W1H Operational Notification Matrix

| Severity | What (Event) | When (Trigger Condition) | Where (UI Surface) | How (Visual & Audio Behavior) | Why (Operational Purpose) |
| --- | --- | --- | --- | --- | --- |
| **CRITICAL** | Emergency Stop Tripped | Immediately upon hardware NC switch break or UI E-Stop tap | Persistent Sticky Toast + Drawer (Red Badge) + Header Alert Pulse | Red frosted glass toast, pulse outline, audible double chime, sticky until cleared with release guidance | Prevents mechanical damage and alerts panel operator instantly |
| **CRITICAL** | TDS Gate Failure (`FAULT_PPM_OUT_OF_RANGE`) | FSM evaluates TDS outside 1200–1300 ppm after recovery | Persistent Sticky Toast + Drawer + Red Drum Glow | Red frosted toast, inline `[Lihat Detail]` and `[Instruksi Kuras]` buttons, double chime | Locks distribution pump to protect crops from severe chemical burn |
| **CRITICAL** | Dry-Run / Sensor Loss (`FAULT_DRY_RUN`, `RADAR_LOST`) | Radar detects level < 5.0 L during run or loses UART frames for > 2 s | Sticky Toast + Drawer | Red frosted toast, locks pump in < 50 ms, audible chime | Protects distribution pump from dry cavitation burnout |
| **CRITICAL** | Mid-Batch Power Recovery (`BATCH_PAUSED_INSPECTION`) | Server boots mid-batch with liquid > 5.0 L in Drum 2 | Dominating Screen Modal + Sticky Toast + Drawer | Amber/red frosted banner, calculates deficit mL, prompts `[Konfirmasi & Lanjutkan]` | Prevents dumping half-mixed batch and enables deficit dosing |
| **WARNING** | Concentrate Stock Depletion / Starvation | Drum 1 stock ≤ 2.8 L (~2 batches) or post-dose TDS yield anomaly | Sticky Toast + Drawer (Amber Badge) + Drum 1 amber pulse | Translucent amber toast, gentle glass ping chime, inline `[Konfirmasi Isi Ulang]` button | Prevents running an unmixed water-only batch on next scheduled cycle |
| **WARNING** | Water Supply Slow Fill (`FAULT_FILL_TIMEOUT`) | Drum 2 fill rate < 5.0 L/min or timeout reached | Sticky Toast + Drawer + Drum 2 amber ripple | Amber frosted toast, gentle glass ping, inline `[Resume Fill]` button | Alerts operator to check greenhouse municipal line or booster valve |
| **WARNING** | Same-Day Double Distribution Attempt | Operator clicks 'Sekarang / Run Now' when batch completed today | Screen-Locking Hard Confirmation Modal + Toast | High-friction amber/red modal with explicit over-fertigation warnings | Protects tomato root systems from asphyxiation and EC toxicity |
| **WARNING** | Imminent Schedule Preemption Notice | Scheduled batch due in < 15 min when ad-hoc batch is initiated | Modal Inline Banner + Drawer | Amber notice warning that starting now will delete upcoming run | Informs operator of schedule preemption and dynamic baseline reset |
| **SUCCESS** | Batch Execution Completed | Distribution pump shuts off at BATCH_DEPLETED (Drum 2 ≤ 5.0 L) | Auto-dismiss Toast (5 s) + Drawer | Emerald green frosted toast, subtle checkmark, completely silent | Confirms crop irrigation delivery and logs recipe snapshot |
| **SUCCESS** | TDS Gate Passed | FSM gate evaluation confirms TDS within 1200–1300 ppm | Auto-dismiss Toast (5 s) + Stepper Green Highlight | Emerald green frosted toast, displays measured PPM, completely silent | Informs operator that automated distribution is commencing |
| **SUCCESS** | Concentrate Refilled (20.0 L) | Operator confirms 2 kg NPK addition via modal | Auto-dismiss Toast (5 s) + Drawer | Emerald green toast, unlatches batch start, completely silent | Confirms virtual stock counter reset to 20.0 L |
| **SUCCESS** | TDS Probe Calibration Committed | Sensor calibration wizard successfully commits to NVS | Auto-dismiss Toast (5 s) + Drawer | Emerald green toast, displays calibrated ADC slope/offset, completely silent | Confirms sensor maintenance completed |
| **INFO** | Schedule Queue Updated / Recalculated | Operator saves new schedule or dynamic baseline shifts | Drawer-only log (Zero popup interruption) | Neutral blue/slate entry in drawer history, completely silent | Maintains chronological traceability of timetable changes |
| **INFO** | Recipe Preset Saved / Modified | Operator creates or edits crop recipe on `/recipes` | Drawer-only log | Neutral entry in drawer history, completely silent | Confirms agricultural preset availability across forms |

---

## 12-State Visual Representation & Pipeline Stepper Specification

Every state in the greenhouse fertigation lifecycle is rendered with distinct visual clarity across two synchronized layers: (1) an **Apple-style Minimalist Horizontal Pipeline Stepper** mounted directly above the active tank card, and (2) **Dynamic Modular Fluid Surface Physics** inside the Drum animation canvas.

| FSM State | Visual Pipeline Stepper Element | Modular Drum Surface Physics & Graphic Animation | Visual Indicators & Telemetry Overlay |
| :--- | :--- | :--- | :--- |
| **IDLE** | Calm neutral dots with 'Siaga (IDLE)' label | Calm, glassy cyan/teal surface with subtle ambient breathing pulse (0.2 Hz) | Volume readout stable; recipe target PPM displayed |
| **FILLING_WATER** | Step 1 highlighted: glowing cyan node with fill-water icon & live counter | Dynamic rising fluid wave with incoming vertical flow ripples; level rises from ≤ 5.0 L to 140.0 L | Clean water inlet solenoid active badge; level in liters counting upward |
| **CHECK_BASE** | Step 2 highlighted: pulsing cyan node with probe wave icon | Gentle fluid settling ripples; soft circular pulse ring radiating from probe location | Source water raw baseline PPM displayed (expected 50–350 ppm) |
| **DOSING** | Step 3 highlighted: active violet/blue node with peristaltic pump icon | Expanding concentrated fluid rings from injection nozzle; Drum 1 (K1) emits subtle suction pulse | Concentrate volume delivered (mL) counting up; peristaltic pump active badge |
| **MIXING** | Step 4 highlighted: rotating vortex icon with countdown timer (120 s) | Active high-energy rotational vortex swirl with subtle aeration bubbles | Submersible mixer relay active badge; live mix timer counting down to 0 s |
| **STABILIZING** | Step 5 highlighted: decaying wave icon with settling countdown (15 s) | Fluid vortex smoothly slows into mirror-like glassy calm surface | Settling timer countdown; relays de-energized to eliminate ADC electrical noise |
| **MEASURING_TDS** | Step 6 highlighted: glowing cyan probe node with sampling pulse | Crystal-clear glassy surface; probe location illuminates soft neon glow | Live multi-sample ADC voltage and rolling average TDS ppm pulsing |
| **GATE_EVALUATE** | Step 7 highlighted: verification badge evaluating against tolerance band | Surface illuminates glowing green outline on PASS (1200–1300 ppm); amber/red on FAIL | Tolerance band [1200–1300 ppm] highlighted; status badge flashes 'MEMENUHI SYARAT' |
| **TOPUP_DOSING** | [Recovery Branch] Highlighted with top-up badge (+X mL) | Secondary discrete injection wave ripples; Drum 1 pulses amber | Top-up volume delivered (max 300 mL); pump runtime active |
| **RECOVERY_MIX_EVALUATE** | [Recovery Branch] Highlighted with secondary mix timer (60 s) | Gentle rotational circulation followed by second settling and probe pulse | Re-evaluating solution uniformity and final PPM confirmation |
| **DISTRIBUTING** | Step 8 highlighted: vivid green node with irrigation pump icon | Outflow draining wave; fluid surface drops smoothly towards bottom suction sump | High-pressure distribution pump active; volume counting down; delivery flow rate displayed |
| **BATCH_DEPLETED** | Step 9 highlighted: completed green checkmark node | Drum empty (≤ 5.0 L suction sump); fluid surface calm and resting | Batch completed badge; transitions cleanly back to IDLE; links recipe snapshot |
| **BATCH_PAUSED_INSPECTION** | Stepper paused with amber warning stripe | Fluid surface pulses gentle amber; screen dominated by intrusive recovery modal | Displays measured volume, current PPM, and dynamically calculated deficit concentrate (mL) |
| **FAULT (Latched)** | Stepper halted with red error node and fault code | Entire drum frame and liquid outline pulse vivid red hazard glow | Inline drainage requirement badge (*"Kuras drum hingga ≤ 5.0 L"*); fault cause verbatim |

## State-driven Dashboard

| Condition | Jadwalkan / Mulai Batch | Reset Fault | Manual controls | Visual Multi-Tank Drum Animations & Calendar Indication |
| --- | --- | --- | --- | --- |
| IDLE, normal stock, device online (First run today) | enabled (Operator+) | hidden | enabled | Pair 1 (K1/D1) calm blue/teal surfaces at measured levels; Pairs 2–5 show distinct Standby/Empty badges |
| Same-day distribution already completed | enabled with Hard Confirm gate | hidden | enabled | Active pair shows 'Selesai Hari Ini' badge; attempting ad-hoc run triggers Hard Confirmation modal; Calendar shows completed icon |
| Drum 1 stock ≤ 2 batches (~2.8 L) | enabled (warning) | hidden | enabled | Drum 1 (K1) surface shifts to amber pulse; Telegram alert sent |
| Drum 1 depleted / starved | locked (Refill required) | hidden | disabled | Drum 1 (K1) empty with red pulse; 'Konfirmasi Isi Ulang' button active |
| Batch preparation running (Fill -> Dose -> Mix -> TDS Gate) | disabled | hidden | disabled | Selected pair reflects active fluid movement (filling wave, dosing ripple); Calendar shows active in-progress indicator |
| Gate Passed -> Autonomous Distribution | disabled | hidden | disabled | Selected Distribution Drum pulses green; pump active; distributes autonomously without extra operator confirmation |
| Mid-Batch Interruption (Pause Mode) | locked | locked | disabled | Intrusive full-screen modal overlays UI; Drum 2 pulses amber with deficit mL display |
| FAULT_ESTOP latched | disabled | locked until HW switch released | disabled | All drums pulse vivid red outline; relays de-energized |
| Fault latched (Drum 2 > 5.0 L) | disabled | disabled (locked, 'Kuras drum ≤ 5.0 L') | disabled | Drum 2 displays red hazard glow with physical drain requirement badge |
| Fault latched (Drum 2 ≤ 5.0 L) | disabled | enabled (Operator+) | disabled | Drum 2 displays amber fault outline; Reset Fault button unlocked |
| Water supply fault (FAULT_NO_WATER_SUPPLY / TIMEOUT) | disabled | enabled (Abort) | disabled | Drum 2 fill wave pauses with amber ripple; 'Resume Fill' active on widget |
| Panel room core (Offline LAN) | enabled (Operator+) | normal | enabled | Core greenhouse panel runs 100% offline; direct monitor & ESP32 unaffected |
| Remote Web / Kiosk Internet Down | disabled (read-only) | disabled | disabled | Displays last-known state with offline badge; restores snapshot in < 500 ms on reconnect |
| WebSocket down | disabled | disabled | disabled | Header connectivity indicator pulses yellow; drums hold last state |
| Viewer role | hidden | hidden | hidden | Read-only visual drum animations, calendar view, and telemetry |

## UX and operational success metrics

1. **Zero Double-Dispatch:** 100% of mutation commands prevent duplicate execution via client-side Pessimistic UI button locking within < 16 ms (within 1 browser animation frame).
2. **Local Kiosk Touch Latency:** Interactive touch-to-visual response time on the Primary HMI 15.6" touchscreen (UPERFECT BE156PF) is strictly < 50 ms.
3. **Fluid Animation Frame Rate:** Modular drum SVG/Canvas liquid animations maintain a steady ≥ 60 fps on the Beelink EQ12 Intel N100 GPU without exceeding 15% CPU utilization.
4. **Telemetry & State Synchronization Latency:** Live WebSocket process state and telemetry updates reflect on the UI within < 250 ms of arrival on the local greenhouse LAN.
5. **Reconnection Snapshot Restoration:** Following network reconnection or edge server reboot, the frontend restores a complete, fresh telemetry and state snapshot within < 500 ms with zero manual page reload required.
6. **Touch Ergonomics Compliance:** 100% of interactive controls and touch targets on the Primary HMI touchscreen kiosk meet or exceed the mandatory 56×56 px physical touch target threshold.
7. **Zero In-App Banner Clutter:** 0 text alert banners rendered in the web UI across all screens; 100% of operational alerts are conveyed through drum modular visual cues and Telegram notifications.

## User journeys

## User journeys

Operator, unified batch setup with recipe, timing & tank selection leading to autonomous distribution: Operator opens Dashboard, reviews the 5-tank pair visualizer (Pair 1 [K1/D1 active], Pairs 2–5 [Standby/Empty]), and checks the Schedule Calendar widget. Operator clicks 'Jadwalkan / Mulai Batch'. The modal guides the upfront flow: (1) Select Recipe (picks 'Fase Generatif: 1250 ppm', switches preset, or enters custom target), (2) Select Timing (chooses 'Sekarang / Run Now' for immediate execution or 'Nanti / Scheduled'), (3) Select Target Tank Pair (Pair 1 active). If 'Sekarang' is selected:
- If a distribution already completed on the greenhouse today, the Hard Confirmation modal intervenes to prevent crop drowning, requiring explicit operator override.
- If first run today, system confirms start. If an automated schedule was due later that day (e.g. 11:00 when running at 10:00), the backend automatically deletes the scheduled 11:00 run for that day to prevent over-watering, and registers 10:00 as the new baseline reference for the subsequent autonomous recurrence interval.
- FSM advances through FILLING_WATER, CHECK_BASE, DOSING, MIXING, STABILIZING, and MEASURING_TDS. Upon passing the TDS gate, **the system automatically transitions to DISTRIBUTING and irrigates the beds immediately without requiring a secondary manual confirmation**, as operator consent was established upfront during setup. Batch completes at BATCH_DEPLETED, returns to IDLE, and links the recipe and tank used.

Operator, scheduled automated fertigation & eternal recurrence: Operator configures the recurring timetable via /schedules or the Unified Setup modal ('Nanti / Scheduled'). All schedules stem from operator manual setup. Once configured, the automated scheduler runs eternally in the background without requiring daily human intervention. Dashboard Schedule Calendar visualizes upcoming runs with date, time, target tank, and assigned recipe. At scheduled time, system executes batch preparation unattended under the 7 firmware safety interlocks. Solution distributes automatically upon passing gate evaluation—with zero waiting delay and zero readiness buzzer (acoustic buzzer sounds strictly on error/fault states).

Operator, same-day double distribution hard confirmation: Morning automated distribution completed successfully at 08:30. In the afternoon, an operator attempts an ad-hoc batch ('Sekarang / Run Now') for Tank Pair 1. The Dashboard immediately intercepts the action and displays the screen-locking Hard Confirmation modal. The modal warns that crops have already received their daily nutrient allotment and details the risks of root rot, plant asphyxiation, and fertilizer salt toxicity. To proceed, the operator must deliberately confirm the override. The system commits POST /batches/start with `force_same_day_override: true`, writes `SAME_DAY_FORCE_OVERRIDE` to the immutable audit trail, and begins batch preparation.

Operator, multi-tank dashboard monitoring & calendar overview: Operator navigates to the Dashboard to review greenhouse state. All 5 pairs of tanks are rendered: 5 Concentrate Drums (K1–K5, rendered in compact proportions with denser, viscous fluid animations) and 5 Distribution Drums (D1–D5, rendered in full scale with dynamic wave animations). Pair 1 displays active fluid levels and recipe binding; Pairs 2–5 display clear 'Standby / Belum Terpasang' badges. Below the tanks, the Schedule Calendar widget displays the operational timeline across the week, confirming that only one distribution tank is scheduled per irrigation window, verifying zero hydraulic line conflict.

Operator, recipe preset management on /recipes: Operator navigates to /recipes to inspect or modify the greenhouse fertigation recipe library. The screen presents existing crop presets ('Fase Vegetatif: 1100 ppm', 'Fase Generatif: 1250 ppm', 'Fase Panen: 1050 ppm') alongside historical batch linkages. Operator clicks 'Tambah Resep' to create a custom mixture (e.g. 'Bibit Muda: 800 ppm'), edits default targets for existing presets, or archives an unused recipe. Changes are validated against the safe operating window (500–1800 ppm), saved to the backend, logged in the audit trail (`RECIPE_MODIFIED`), and immediately made available in the 'Jadwalkan / Mulai Batch' dropdown and `/schedules` configuration.

Operator, fine manual control on /manual: Outside active batches, Operator navigates to /manual to calibrate or test equipment. Operator taps '+10 mL' on the peristaltic dosing card (running pump for 1.07 s per 10 mL) or runs mixer by entering exact seconds (e.g. 15 s timer). Toggles are guarded by hardware interlocks (distribution pump locked if Drum 2 level ≤ 5.0 L; fill valve locked if level ≥ 140 L).

Operator, sensor maintenance & TDS calibration wizard: Operator notices drift or routine maintenance schedule for the DFRobot Gravity analog TDS probe. On /manual, Operator taps 'Kalibrasi Sensor TDS'. System checks Drum 2 volume; if liquid > 5.0 L is present or FSM is non-IDLE, wizard remains locked with guidance ('Kuras Drum 2 hingga ≤ 5.0 L sebelum melepas sensor'). Once empty and safe, the wizard guides the operator step-by-step: (1) Mechanically detach probe from distribution tank fitting; (2) Inspect raw ADC voltage and electrical noise stability in real-time; (3) Immerse probe in standard 1413 µS/cm buffer solution; (4) Wait 30 seconds for live ADC stability; (5) Record baseline water PPM offset (accounting for the inherent mineral PPM of the greenhouse source water); (6) Tap 'Simpan Kalibrasi ke ESP32'. ESP32 commits new ADC slope and offset to NVS, UI confirms success, and backend audit log records SENSOR_CALIBRATED. Operator reattaches probe securely to the tank before starting new batches.

Operator, concentrate refill & starvation recovery: When virtual stock reaches ≤ 2 batches (~2.8 L) or if post-dose TDS yield anomaly flags starvation, Telegram alert is dispatched and the Drum 1 modular animation pulses amber/red. Batch initiation is strictly locked (STATION_LOCKED: CONCENTRATE_DEPLETED). Operator prepares 2 kg NPK dissolved into 20 L water in Drum 1. Via control room kiosk or mobile web app, operator taps 'Konfirmasi Isi Ulang' on the Drum 1 modular animation widget, confirming the refill dialog. System resets virtual counter to 20.0 L, Drum 1 animation reflects 100% full with calm teal surface, batch start unlocks, and backend audit log records CONCENTRATE_REFILLED.

Operator, gate failure: Telegram alert arrives, physical buzzer and red pilot lamp trip on the local panel box. Drum 2 modular animation pulses red hazard glow. Reset Fault button remains locked with 'Kuras drum hingga ≤ 5.0 L' badge until the operator physically drains Drum 2 via the gravity drain valve. Once radar sensor registers level ≤ 5.0 L, Reset Fault unlocks. Operator presses Reset Fault, confirms, state returns to IDLE, and batch is logged as faulted in History. No re-dose is offered by the app.

Operator, water supply outage & recovery: Water supply drops during filling, triggering FAULT_NO_WATER_SUPPLY. Operator receives Telegram alert and Drum 2 fill wave pauses with amber ripple. If supply pressure returns automatically, the system attempts autonomous resume fill and notifies the operator via Telegram. Alternatively, operator inspects supply valve and clicks 'Resume Fill' on the Drum 2 widget to continue filling the current batch without draining or resetting.

Operator, emergency stop & recovery: Operator detects mechanical or electrical hazard in greenhouse, hits the red Emergency Stop button (1-tap instant on kiosk header, or confirmation modal on remote web). System instantly de-energizes all 4 relays via FAULT_ESTOP in < 100 ms, local panel buzzer and red pilot lamp trip, and both drum animations pulse vivid red outline. To recover, operator inspects greenhouse and physically twists out/releases the panel mushroom switch. The ESP32 immediately streams `hw_estop_pressed: false` via GPIO interrupt telemetry. On the Dashboard, the Reset Fault button—which was actively locked with 'Tombol E-Stop Fisik Masih Tertekan'—unlocks (provided Drum 2 is ≤ 5.0 L if drained). Operator clicks Reset Fault, confirms dialog, and the FSM safely returns to IDLE.

Operator, primary HMI touchscreen kiosk (Greenhouse Panel Room): UPERFECT BE156PF 15.6" touchscreen starts up automatically into Dashboard with a persistent Operator session on boot (zero keyboard typing in the panel room). Touchscreen provides immediate access to modular drum animations, Jadwalkan / Mulai Batch, Refill confirmation, 1-tap E-Stop (min 56×56 px without modal), and manual controls. If an administrator needs to manage accounts on the kiosk, navigating to /users opens the Admin Elevation dialog.

Operator, mid-batch power interruption recovery & dynamic deficit dosing: Greenhouse power trips mid-batch with 70 L half-mixed solution in Drum 2. Upon power restoration, system initializes safely into un-energized Pause Mode (`BATCH_PAUSED_INSPECTION`). Both the panel monitor and remote web interfaces display an intrusive, screen-dominating modal locking user interaction. The modal shows real-time volume (70 L), current measured TDS, and dynamically calculated deficit concentrate (e.g. +450 mL needed to reach target 1250 ppm). Operator physically inspects greenhouse pipes and tanks, then taps 'Konfirmasi & Lanjutkan' on the modal. The system energizes the peristaltic pump for the calculated deficit volume, runs the submersible mixer, validates TDS against the gate band, and unlocks distribution. If 30 minutes elapse without operator touch and all 7 firmware safety interlocks pass, the system automatically resumes preparation and distribution. (If a catastrophic spike > 500 ppm above target occurs or pipe leaks are detected, the modal mandates physical drainage via the manual valve to ≤ 5.0 L before reset unlocks).

Admin, new user: Users, New user, username and role, temporary password, user logs in and is sent to /change-password before reaching the Dashboard.

## First run bootstrap [PROPOSED]

A CLI command on the Beelink EQ12 Mini PC creates the first Admin (`python -m app.cli create-admin`). That account is flagged to change its password at first login. No default credentials ship in the image.

## Edge flows

### Mid-Batch Power Interruption, Pause Mode & Dynamic Deficit Dosing

- When mains AC power returns following an outage during an active batch, the ESP32 and Beelink EQ12 boot into safe cold-boot hold. If radar telemetry indicates Drum 2 contains liquid (> 5.0 L), the FSM transitions to `BATCH_PAUSED_INSPECTION`.
- **Intrusive Screen-Locking Modal:** Both the local control monitor and remote web clients display an elegant, prominent modal overlay that dominates the screen, locking interaction until acknowledged. The modal displays real-time telemetry (volume, measured PPM) alongside calculated deficit milliliters of concentrate needed to reach optimal recipe PPM (e.g., if only half the dose was injected before power dropped).
- **Operator Acknowledgment vs 30-Minute Auto-Resume:** Operator can inspect physical plumbing and tap 'Konfirmasi & Lanjutkan' to execute deficit dosing and continue batch execution without dumping water. If 30 minutes elapse without operator intervention and all firmware safety interlocks pass (water baseline valid, radar level stable, no leak detected), the system automatically resumes preparation and distribution.
- **Catastrophic Spike & Drainage Threshold:** If measured solution exceeds 500 ppm above recipe target (e.g. > 1750 ppm on a 1250 ppm target) or physical pipe failure occurs, automated resumption is hard-blocked. The modal mandates manual gravity drainage to ≤ 5.0 L before the Gated Fault Reset protocol unlocks.

### Three Display & Controller Access Tiers: Primary HMI Kiosk, Secondary Gazebo Display & Mobile Web

- **100% Offline Greenhouse Panel Core & Primary HMI Touchscreen:** The greenhouse panel room houses the Beelink EQ12 Mini PC (edge server), the ESP32 microcontroller, and the Primary HMI Touchscreen (UPERFECT BE156PF 15.6" FHD 10-Point Capacitive Touch mounted on a 90 cm standing kiosk). The monitor connects directly to the Mini PC (HDMI 2.0 + USB-C for touch data) and the ESP32 communicates with the Mini PC over local offline LAN/serial. **The core system runs 100% offline and never halts operations due to internet loss.** Dedicated internet connectivity is not required for autonomous greenhouse batch mixing, safety interlock enforcement, scheduled fertigation, or local touch control with instant 1-tap E-stop.
- **Secondary Display Gazebo (Passive Monitoring Mirror):** The Xiaomi TV A 43" FHD 2026 (Google TV™) in the gazebo functions as an auxiliary display and monitoring screen mounted via VESA 200×200 bracket. It connects via wired LAN RJ45 to the Telkomsel Orbit Star H2 modem (Gazebo DMZ) and reaches the greenhouse server across the 156.5m Tenda O1 2.4GHz PTP bridge. Running Fully Kiosk Browser 24/7 from the official Play Store, it displays live modular drum animations and telemetry in a passive, read-only mirror mode without local control authority.
- **Remote Mobile Web & Internet Outage Resilience:** When external internet drops, remote access via mobile web browsers outside the greenhouse LAN becomes temporarily unavailable. The mobile web UI displays the last known telemetry state combined with a prominent offline status badge, transparently indicating that the panel room server is disconnected from the internet.
- **Instant Snapshot Hydration (< 500 ms):** The moment external internet connectivity is restored, the mobile web application and remote viewers execute instant state reconciliation, restoring a complete, live telemetry and process snapshot in < 500 ms without requiring manual browser reload.

### Concurrent Users & Safety Command Arbitration

- **State Broadcast:** Every state transition executed on the local panel or remote clients is broadcast to all active sessions via WebSockets in < 250 ms.
- **Pessimistic Collision Prevention:** If two operators attempt to command the system concurrently (e.g. one clicks Mulai Batch while another triggers E-Stop), the firmware's local safety interlock unconditionally prioritizes Emergency Stop (`FAULT_ESTOP`). The start command receives `COMMAND_REJECTED: FAULT_ESTOP_ACTIVE` verbatim.
- **Role Permission Enforcement:** Role changes executed by an Admin take effect on the user's next HTTP request; API endpoints return 403 Forbidden with automatic UI permission refresh.

### Unified Schedule-First Architecture, Dynamic Baseline Reference & Preemption

- **Manual Root Foundation:** All automated executions originate strictly from manual operator setup (configured timetables and recipe presets). Automation runs eternally in the background based on configured rules.
- **Immediate Execution as Scheduled 'Now':** Invoking 'Sekarang / Run Now' registers an ad-hoc batch into the schedule engine with `schedule_at = NOW`.
- **Preemption & Later Schedule Cancellation:** If an operator triggers an ad-hoc run at 10:00 when an automated schedule is set for 11:00 on the same day:
  1. The 11:00 scheduled execution is automatically removed/suppressed for that day to prevent double irrigation and hydraulic flooding.
  2. The 10:00 completion timestamp is registered dynamically as the new baseline reference for the subsequent autonomous recurrence interval.
  3. An informative Telegram notification is dispatched: *"Batch ad-hoc selesai pukul 10:00 — Jadwal rutin 11:00 dibatalkan untuk mencegah over-fertigasi. Titik acuan siklus berikutnya diperbarui."*
- **Deferral During Active Execution:** If an automated schedule triggers while an ad-hoc batch is actively preparing or distributing:
  1. The scheduler places the scheduled run into a deferral queue until the active batch finishes and Drum 2 radar level reaches empty (≤ 5.0 L).
  2. If the deferral window exceeds 60 minutes beyond planned time, the scheduler cancels the delayed run to prevent crop over-saturation, logging `SCHEDULE_SKIPPED_OVERDUE`.

### Same-Day Double Distribution Protection & Hard Confirmation Gate

- **Daily Fertigation Ceiling:** Agronomic safety dictates that tomato crops must not receive uncoordinated multiple nutrient deliveries in a single 24-hour cycle.
- **Automatic Interlock:** Once a batch completes distribution on the greenhouse system on any calendar day (00:00–23:59 local time), subsequent batch starts for that day are interlocked by default.
- **Hard Confirmation Gate Modal:** If an operator attempts an additional ad-hoc distribution on the same day:
  1. The UI blocks direct execution and presents a high-friction Hard Confirmation Modal with a red hazard accent.
  2. The modal states explicitly: *"Peringatan Keras: Greenhouse telah menerima distribusi nutrisi hari ini pada [Timestamp]. Melakukan distribusi ulang berisiko menyebabkan pembusukan akar (root rot) dan toksisitas salinitas EC."*
  3. The operator must check an explicit risk acknowledgment checkbox and click 'Konfirmasi Paksa Distribusi' (`force_same_day_override: true`).
  4. The override event is committed to the backend audit log (`SAME_DAY_FORCE_OVERRIDE`) with operator user ID and IP address.

### Multi-Tank 5-Pair Topology & Zero-Conflict Hydraulic Arbitration

- **5-Pair Architectural Roadmap:** The system visualizes 5 pairs of tanks: Concentrate Drums K1–K5 (20 L each) and Distribution Drums D1–D5 (140 L each). In Phase 1, Pair 1 (Concentrate Drum 1 and Distribution Drum 2 in physical nomenclature) is actively plumbed; Pairs 2–5 are displayed in 'Standby / Belum Terpasang' status.
- **Zero-Conflict Hydraulic Invariant:** All distribution drums feed into a shared high-pressure pump and single main delivery line to the 6 raised beds. Therefore, **no two distribution tanks may distribute on the same day or overlapping time window**.
- **Dashboard Schedule Calendar Arbitration:** The Dashboard Calendar visually maps and validates all planned runs across all 5 tank pairs. Attempting to schedule two tanks on the same calendar slot triggers an immediate validation rejection: *"Konflik Hidrolik: Jalur distribusi sedang dialokasikan untuk Tangki [X]. Jadwal tidak dapat tumpang tindih."*
