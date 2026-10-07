# 12 UI Spec

React + Vite + TypeScript + Tailwind + shadcn/ui + Apache ECharts. [SPEC stack] Component list follows SPEC FE-01 to FE-14, ids below are placeholders, map them to the SPEC numbering. Screen navigation and click outcomes are in 02_APPFLOW, colors, typography, components, and screen layouts are in 03_UI_UX_BRIEF.

## Target screens

Control-room monitor (primary): large wired-LAN screen, no internet, kiosk browser, read at distance. Operator laptop or phone over Tailscale (secondary). Design for 1920x1080 first, responsive down to phone width.

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
| UI-03 | Drum 2 tank | Tank graphic with level percent and liters of 140 |
| UI-04 | Actuator status panel | Each actuator on or off, source badge (FSM, manual, interlock) |
| UI-05 | Batch event timeline | Live list of state transitions and gate result for the active batch |
| UI-06 | TDS history chart | ECharts line, range selector (1 h, 6 h, 24 h, 7 d), gate band shaded |
| UI-07 | ESP32 connectivity indicator | Online, offline, stale with last-seen time |
| UI-08 | Mulai Batch button | Operator+, enabled only in IDLE with no fault and device online, confirmation dialog |
| UI-09 | Reset Fault button | Operator+, enabled only with latched fault, shows fault code and cause, confirmation dialog |
| UI-10 | Batch history table | Sortable, paginated, status and gate badges |
| UI-11 | Manual actuator controls | Per-actuator toggle, shows rejection reason from firmware verbatim |
| UI-12 | Schedule management | Create, edit, enable, delete, next-run preview |
| UI-13 | Login page | Error on bad credentials, no user enumeration |
| UI-14 | User management | Create, change role, deactivate, reset password |

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
