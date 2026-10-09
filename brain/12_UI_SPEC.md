# 12 UI Spec

React + Vite + TypeScript + Tailwind + shadcn/ui + Apache ECharts. [SPEC stack] Component list follows SPEC FE-01 to FE-14, ids below are placeholders, map them to the SPEC numbering. Screen navigation and click outcomes are in 02_APPFLOW, colors, typography, components, and screen layouts are in 03_UI_UX_BRIEF.

## Target screens & display tiers

1. **Primary HMI Touchscreen Kiosk (Greenhouse Panel Room):**
   - **Hardware:** UPERFECT BE156PF 15.6" FHD (1920×1080) IPS, 10-point capacitive touch, mounted on 90 cm standing kiosk, powered by UGREEN GaN 30W via USB-C.
   - **Connectivity:** Direct HDMI 2.0 + USB-C touch data to on-site Beelink EQ12 Mini PC. Operates 100% offline.
   - **UI Behavior:** Fullscreen, cursor hidden (touch-first), persistent local `Operator` session on boot, instant 1-tap E-stop (min 56×56 px without modal), full control (batches, manual jogs, calibration wizard). Auto-reload on socket outage > 60 s. Dashboard fits one screen without scrolling.
2. **Secondary Display Gazebo (Gazebo Monitoring):**
   - **Hardware:** Xiaomi TV A 43" FHD 2026 (Google TV™), 1920×1080, 60Hz, VESA 200×200 wall bracket.
   - **Connectivity:** Wired LAN RJ45 to Orbit Star H2 modem (Gazebo DMZ) across 156.5m Tenda O1 2.4GHz PTP bridge.
   - **UI Behavior:** Fully Kiosk Browser 24/7 passive read-only mirror (`Viewer` role). Displays live modular drum animations, FSM state, and telemetry. Interactive controls hidden.
3. **Mobile Client (Smartphone Operator/Admin):**
   - **Platform:** Responsive Web App (PWA) accessed via smartphone browsers over local Wi-Fi or Tailscale VPN.
   - **UI Behavior:** Responsive layout down to mobile width (360–430 px). E-Stop and protected mutations require modal confirmation (`aria-modal="true"`). Telegram integration for push alerts and inline callback actions.

## Offline rule

Bundle all assets. No CDN scripts, remote fonts, analytics, or external images. Self-host fonts. CI check fails the build if the dist output references an external origin. [PROPOSED]

## Pages

| Route | Role | Content |
| --- | --- | --- |
| /login | none | Username and password |
| / (Dashboard) | V | Live process view |
| /batches | V | History table, filters |
| /batches/:id | V | Batch detail: timeline, TDS trace, gate result |
| /schedules | V view, O edit | Schedule list and editor |
| /manual | O | Manual actuator controls |
| /users | A | User management |

## Dashboard components

| ID | Component | Behavior |
| --- | --- | --- |
| UI-01 | FSM status card | Current state of 10, active batch id, elapsed time in state, fault banner when latched |
| UI-02 | TDS live card | Large ppm value and gauge, green 550 to 650, yellow near either bound, red outside, target marker at 600. "Near" threshold is a setting, default 25 ppm [PROPOSED] |
| UI-03 | Multi-Tank 5-Pair Visualizer | Visualizes 5 Concentrate Drums (K1–K5, 20 L each, compact scale, viscous fluid glow) and 5 Distribution Drums (D1–D5, 140 L each, full scale, fluid wave/ripple animations). Pair 1 active with live radar/virtual stock telemetry; Pairs 2–5 rendered with 'Standby / Belum Terpasang' badges |
| UI-04 | Actuator status panel | Each actuator on or off, source badge (FSM, manual, interlock) |
| UI-05 | Batch event timeline | Live list of state transitions and gate result for the active batch |
| UI-06 | TDS history chart | ECharts line, range selector (1 h, 6 h, 24 h, 7 d), gate band shaded |
| UI-07 | ESP32 connectivity indicator | Online, offline, stale with last-seen time |
| UI-08 | Jadwalkan / Mulai Batch (Unified Setup) | Operator+, initiates unified modal: (1) Recipe picker/creator, (2) Timing ('Sekarang' vs 'Nanti'), (3) Target Tank Pair (1–5). On 'Sekarang', preparation runs and upon TDS pass, transitions to DISTRIBUTING automatically without 2nd confirmation |
| UI-09 | Reset Fault button | Operator+, enabled only with latched fault, shows fault code and cause, confirmation dialog |
| UI-10 | Batch history table | Sortable, paginated, status and gate badges |
| UI-11 | Manual actuator controls | Per-actuator toggle, shows rejection reason from firmware verbatim |
| UI-12 | Schedule management | Create, edit, enable, delete, next-run preview |
| UI-13 | Login page | Error on bad credentials, no user enumeration |
| UI-14 | User management | Create, change role, deactivate, reset password |
| UI-15 | Dashboard Schedule Calendar & Timeline | Calendar/timeline overview widget on Dashboard displaying scheduled runs by date, time, tank pair, and recipe. Visualizes non-overlapping allocation and enforces Zero Conflict Invariant |
| UI-16 | Same-Day Hard Confirmation Modal | High-friction screen-locking modal intervening when an operator attempts a secondary distribution on a calendar day where distribution already ran; requires explicit over-fertigation/root-rot risk acknowledgment |
| UI-17 | In-App Notification Hub & Drawer | Persistent header bell with live unread badge count, slide-out frosted glass drawer with categorized history, and floating interactive toasts with 1-tap action buttons; enforces 4-tier model with subtle audio chimes on Kiosk for Critical/Warning |
| UI-18 | Pipeline Stepper Component | Minimalist Apple-style horizontal progress stepper mounted above active tank card displaying the 12 FSM lifecycle steps, active node glow, completed ticks, and live step countdown/count-up timers |

## Behavior rules

1. All live values come from one WebSocket store. Components never poll.
2. When the device is offline or the socket is down, show values greyed with a stale banner and disable all command buttons.
3. Protected buttons require a confirmation dialog stating the action and consequences. Disable the confirm button until the command response arrives, then show accepted, rejected with reason, or timeout.
4. Viewer never sees command controls. Hidden, not just disabled.
5. Never imply the UI can override an interlock. Rejections show the interlock id and text.
6. Color is never the only signal: gauge also shows text such as In range, Near limit, Out of range.
7. UI labels in Bahasa Indonesia where SPEC uses them (for example "Mulai Batch"), otherwise label language set in 18_DECISIONS D-021.
8. Timestamps display in the greenhouse timezone, stored in UTC.

## Control-room kiosk

Fullscreen, cursor hidden, auto-reload after socket outage over 60 s, session kept alive with a long-lived view-only account or session renewal. Dashboard fits one screen without scrolling.
