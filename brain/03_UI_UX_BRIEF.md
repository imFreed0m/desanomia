# 03 UI/UX Brief

Visual language and per-screen layout so generated UI is consistent. Behavior lives in 12_UI_SPEC, navigation in 02_APPFLOW. [PROPOSED, change values here first, then in code]

## Principles

1. Glanceable: the control-room monitor is read from a distance, key numbers must be readable at 3 m.
2. Status over decoration: color carries process meaning only (ok, warning, fault), never branding.
3. Safe by design: dangerous actions look and feel deliberate (confirmation, clear consequences).
4. Quiet: no animation that is not conveying a change of state, the Pi kiosk must stay smooth.
5. Offline: fonts, icons, images all bundled.

## Color tokens

Define as CSS variables for shadcn/ui and Tailwind. Dark is the default for the control room, light follows `prefers-color-scheme` or a user toggle.

| Token | Dark | Light | Use |
| --- | --- | --- | --- |
| background | #0B1210 | #F6F8F7 | page |
| surface | #121C18 | #FFFFFF | cards |
| surface-2 | #1A2722 | #EDF2EF | table headers, inset areas |
| border | #2A3A33 | #D5DED9 | dividers, card edges |
| text | #E8F0EC | #14201B | primary text |
| text-muted | #9DB0A7 | #5B6B63 | labels, secondary |
| primary | #38BDF8 | #0284C7 | links, primary buttons, focus ring |
| status-ok | #22C55E | #15803D | TDS in band, online, completed |
| status-warn | #F59E0B | #B45309 | near limit, stale, running with caution |
| status-danger | #EF4444 | #B91C1C | out of band, fault, offline, destructive |
| status-idle | #64748B | #64748B | IDLE, disabled states |

Primary is blue so it never reads as a status color. Verify WCAG AA contrast for text and status colors on both themes in CI or manually before release.

## Typography

Self-hosted Inter (variable) with a system-ui fallback stack, plus a monospace for ids and logs. Tabular numerals on all measurements.

| Role | Size and weight | Use |
| --- | --- | --- |
| Hero number | 96 px on 1080p, 700 | TDS ppm on the Dashboard |
| H1 | 28 px, 600 | page title |
| H2 | 20 px, 600 | card title |
| Body | 16 px, 400 | text, table cells |
| Label | 13 px, 500, uppercase off | field and card labels |
| Mono | 14 px | batch id, cmd_id, fault code |

## Spacing, shape, elevation

4 px base unit, scale 4, 8, 12, 16, 24, 32, 48. Card padding 24, grid gap 16 (24 on the control-room layout). Radius 8 for cards and inputs, 6 for buttons, full for badges. Elevation by border and surface color, no heavy shadows. Touch targets at least 44 px on phone and kiosk touch.

## Components

| Component | Rules |
| --- | --- |
| Buttons | Primary (filled primary), secondary (outline), ghost, destructive (status-danger). Mulai Batch is primary, Reset Fault is secondary with danger outline. Disabled uses status-idle and a tooltip stating why. |
| Form inputs | Visible label above, helper text below, inline error in status-danger with icon, never placeholder-only labels. Password field with show toggle. |
| Cards | Surface with border, title row (label left, status badge right), content, optional footer. |
| Tables | Sticky header on surface-2, row height 48, zebra off, status badges in cells, sortable columns marked with an arrow, pagination footer. |
| Navigation | Left sidebar on desktop (icons plus labels), bottom tab bar on phone, current route highlighted with primary, hidden items for forbidden routes. |
| Overlays | Centered dialog for confirmation and forms, max width 480, focus trapped, Esc closes except while a command is pending. |
| Feedback | Toasts bottom right, 5 s, for results. Persistent banners at the top of the page for fault, stale, and reconnecting. |
| Badges | FSM state, batch status, gate result, role. Text plus color, never color alone. |
| Data displays | TDS gauge, tank graphic, timeline, ECharts line chart, described below. |

## Data displays

TDS gauge: arc or bar from 0 to 1000 ppm, band 550 to 650 filled status-ok, near zone (default 25 ppm each side) status-warn, outside status-danger, marker at 600, current value pointer, text label In range, Near limit, or Out of range. Tank: vertical tank outline with fill level, percent and liters (of 140) as text, fill color primary, danger color below a low-level threshold from settings. Timeline: vertical list, state name, time, duration, current item highlighted, gate result entry with ppm and pass or fail badge. Chart: single line for TDS, band shaded status-ok at low opacity, tooltip with ppm and time, range buttons 1 h, 6 h, 24 h, 7 d.

## Screen layouts

Dashboard (1920x1080, no scroll):

```
+--------------------------------------------------------------+
| Banner area: fault / stale / reconnecting                     |
+--------------------+-----------------------+-----------------+
| FSM status card    | TDS hero + gauge      | Drum 2 tank     |
| Mulai Batch/Reset  |                       |                 |
+--------------------+-----------------------+-----------------+
| Actuator panel     | Batch event timeline  | Connectivity    |
+--------------------+-----------------------+-----------------+
| TDS history chart (full width, 6 h default)                   |
+--------------------------------------------------------------+
```

Phone: single column in this order: banner, FSM card with buttons, TDS, tank, actuators, timeline, chart.

Other screens:

| Screen | Layout |
| --- | --- |
| Login | Centered card, logo, username, password, submit, error line under the form |
| Batch history | Filter bar (date range, status, gate result), table, pagination |
| Batch detail | Header with batch id, status, gate badge, who started it, key numbers row, TDS trace chart, event timeline |
| Schedules | Table of schedules with enable switch, New button opens a dialog with days, time, name, next-run preview |
| Manual | One card per actuator with state, toggle, and last rejection reason, warning strip that interlocks still apply |
| Users | Table with role badge and active switch, New user dialog, row menu for role change and password reset |
| 403, 404 | Short message and a button to the Dashboard |

## Content and tone

Short, literal, no jargon beyond process terms. Error messages say what happened and what to do next. Language rule in 18_DECISIONS D-021. Units always shown: ppm, %, L, seconds.

## Accessibility

Keyboard reachable controls, visible focus ring in primary, labels linked to inputs, color never the only signal, respects reduced motion, text scalable to 200 percent without breaking layout.

## Implementation notes

Map tokens to shadcn/ui CSS variables in `index.css` and to `tailwind.config`. Icons from lucide-react, bundled. Components in `frontend/src/components/ui` (shadcn) and `frontend/src/components/dashboard`. A `design-tokens.ts` mirrors the table above for ECharts theming.
