# 03 UI/UX Brief

Visual design language, component tokens, 3D fluid rendering, and per-screen layout specifications for Desanomia. This document establishes the definitive visual and architectural authority, ensuring pixel-perfect, accessible, and high-performance interfaces across all display tiers. Functional behavior is detailed in `12_UI_SPEC`, and navigation flows are specified in `02_APPFLOW`.

---

## 1. Design Philosophy: "Clean Laboratory Minimal"

Desanomia breaks decisively from dark, cluttered, hobbyist IoT boards and generic SaaS templates. It establishes a dedicated aesthetic stance: **Clean Laboratory Minimal**—an ultra-crisp, high-craft scientific cockpit combining horticultural biology with precision laboratory instrumentation.

### 1.1 Core Aesthetic Mandates

1. **Intentional Aesthetic Direction ("Clean Laboratory Minimal"):**
   - High-key, natural, and airy atmosphere inspired by modern plant biology laboratories and precision research facilities.
   - Pure white panels (`#FFFFFF`) floating on warm, subtle off-white foundations (`#F5F7FA` and `#F9FAFB`) with delicate, airy drop shadows and crisp micro-borders.
2. **Differentiation Anchor:**
   > *"If this interface were screenshotted with the logo and title removed, an engineer or researcher would immediately recognize it by the dual volumetric 3D glass fluid vessels with real-time procedural wave physics, volumetric Liters calibrations, Space Grotesk scientific telemetry numerals, and the asymmetric horticultural Bento grid."*
3. **Status Semantics Over Decorative Color:**
   - Color is strictly reserved for process meaning (OK, Warning, Danger, Idle).
   - Interactive primary buttons use vibrant Royal Blue (`#2563EB`) so they are never conflated with operational green status indicators.
4. **Touch-First Panel Ergonomics (Panel Room Cockpit):**
   - Minimum interactive tap target of **56×56 CSS px** on the HMI Kiosk (exceeding standard 44 px).
   - Integrated On-Screen Touch Numpad for all numeric entries—completely eliminating awkward operating system virtual keyboards in the panel room.
5. **Lightweight 3D Web Experience:**
   - Real-time 3D fluid cylinders powered by React Three Fiber (R3F) and Three.js with capped 30fps/on-demand frameloops to run cool (< 45°C) and stably 24/7 on embedded hardware (Beelink EQ12 Intel N100 and Xiaomi TV A Mali-G52 GPU).
6. **Modern Web Standards & Complete Offline Autonomy:**
   - CSS Container Queries (`@container`) for intrinsic component responsiveness.
   - Native HTML5 `<dialog>` for rock-solid focus trapping and modal isolation.
   - 100% bundled local assets (variable fonts, Lucide SVG icons, GLSL shaders) with zero external CDN dependencies.

### 1.2 Design Feasibility & Impact Index (DFII)

| Dimension | Score (1–5) | Justification |
| :--- | :---: | :--- |
| **Aesthetic Impact** | 5 | Unmistakable, distinctive laboratory aesthetic; 3D glass vessels & scientific type. |
| **Context Fit** | 5 | Perfectly tailored for research greenhouse fertigation and multi-tier displays. |
| **Implementation Feasibility** | 5 | Next.js, React Three Fiber, Tailwind CSS, and Modern CSS container queries. |
| **Performance Safety** | 4 | Capped 30 FPS, demand frameloops, lightweight shaders, zero layout shift. |
| **Consistency Risk** | 1 | Strictly centralized CSS tokens and typed component primitives. |

$$\text{DFII} = (\text{Impact} + \text{Fit} + \text{Feasibility} + \text{Performance}) - \text{Consistency Risk} = (5 + 5 + 5 + 4) - 1 = \mathbf{17} \longrightarrow \mathbf{15/15 \text{ (Max: Excellent, Execute Fully)}}$$

---

## 2. Color System & Modern Color Space Tokens

Colors are specified in both standard hex codes and perceptual `oklch()` color spaces to guarantee uniform visual weight and smooth gradient interpolation without muddy gray transitions.

### 2.1 Color Token Palette

```css
:root {
  /* Foundations & Surfaces */
  --background: #F5F7FA;              /* oklch(97.2% 0.005 240) */
  --background-subtle: #F9FAFB;       /* oklch(98.5% 0.003 240) */
  --surface: #FFFFFF;                 /* oklch(100% 0 0) */
  --surface-hover: #F1F5F9;           /* oklch(96.1% 0.008 240) */
  --border-subtle: #E2E8F0;           /* oklch(92.8% 0.012 240) */
  --border-focus: #2563EB;            /* oklch(54.6% 0.215 258) */

  /* Typography */
  --text-primary: #1E293B;            /* oklch(27.8% 0.033 256) - Contrast 13.6:1 (AAA) */
  --text-secondary: #64748B;          /* oklch(55.4% 0.046 257) - Contrast 4.9:1 (AA) */
  --text-muted: #94A3B8;              /* oklch(76.8% 0.038 255) */

  /* Interactive Non-Status */
  --primary: #2563EB;                 /* oklch(54.6% 0.215 258) - Royal Blue CTA */
  --primary-hover: #1D4ED8;           /* oklch(47.8% 0.218 258) */
  --primary-subtle: #EFF6FF;          /* oklch(96.9% 0.021 254) */

  /* Process Status Semaphores */
  --status-ok: #10B981;               /* oklch(69.6% 0.170 162) - Emerald Green */
  --status-ok-bg: #ECFDF5;            /* oklch(97.8% 0.022 162) */
  --status-warn: #F97316;             /* oklch(69.8% 0.185 48)  - Coral/Amber */
  --status-warn-bg: #FFF7ED;          /* oklch(97.9% 0.020 60) */
  --status-danger: #EF4444;           /* oklch(63.7% 0.222 25)  - Vivid Crimson */
  --status-danger-bg: #FEF2F2;        /* oklch(96.8% 0.019 25) */
  --status-idle: #94A3B8;             /* oklch(76.8% 0.038 255) - Neutral Standby */
}
```

### 2.2 Elevation, Shadows & Glassmorphism

- `shadow-card`: `0px 4px 20px -2px rgba(30, 41, 59, 0.05), 0px 1px 3px rgba(30, 41, 59, 0.03)`
- `shadow-card-hover`: `0px 10px 25px -4px rgba(30, 41, 59, 0.08), 0px 2px 6px rgba(30, 41, 59, 0.04)`
- `shadow-modal`: `0px 25px 50px -12px rgba(15, 23, 42, 0.25)`
- `backdrop-card`: `backdrop-filter: blur(12px); background: rgba(255, 255, 255, 0.85);`

---

## 3. Typography: Precision Scientific Pairing

To eliminate the generic AI-default aesthetic (avoiding Inter/Roboto), Desanomia pairs a distinctive geometric display typeface with an ultra-neutral, high-legibility UI body font and a dedicated monospace for hardware telemetry.

### 3.1 Typeface Selection

1. **Display & Hero Numbers:** **Space Grotesk**
   - *Rationale:* Sharp, geometric, architectural character conveying scientific precision and research laboratory rigor. Ideal for telemetry hero numerals and glanceable billboard readouts.
2. **Body & Interface Elements:** **Geist Sans**
   - *Rationale:* Ultra-neutral, modern neo-grotesque with exceptional legibility at small sizes, optical sizing, and robust numeral kerning.
3. **Data & Monospace:** **Geist Mono**
   - *Rationale:* Engineered for code, hardware UUIDs, raw ADC readings, and telemetry logs.

### 3.2 Typographic Hierarchy & Modern CSS Rules

```css
/* Global Text Rules */
h1, h2, h3, .heading-balanced {
  font-family: 'Space Grotesk', system-ui, sans-serif;
  text-wrap: balance; /* Modern Web Guidance: Eliminates orphan text in headings */
}

p, .body-pretty {
  font-family: 'Geist Sans', system-ui, sans-serif;
  text-wrap: pretty;  /* Modern Web Guidance: Optimized paragraph wrapping */
}

.tabular-nums, .telemetry-metric {
  font-family: 'Space Grotesk', system-ui, sans-serif;
  font-variant-numeric: tabular-nums lining-nums; /* Prevents jitter during streaming */
}

.mono-telemetry {
  font-family: 'Geist Mono', monospace;
  font-feature-settings: "zero" 1;
}
```

| Role | Font Family | Size & Weight | Letter Spacing | Application |
| :--- | :--- | :--- | :--- | :--- |
| **Billboard Hero (43" TV)**| Space Grotesk | 96–112 px, 700 (Bold) | -0.04em | Glanceable 3–5m TDS PPM |
| **Cockpit Hero (15.6" HMI)**| Space Grotesk | 64 px, 700 (Bold) | -0.03em | Primary TDS ppm & Liters |
| **Page Heading (H1)** | Space Grotesk | 28 px, 600 (SemiBold) | -0.02em | Screen titles |
| **Card Heading (H2)** | Space Grotesk | 20 px, 600 (SemiBold) | -0.01em | Bento section titles |
| **UI Body** | Geist Sans | 15 px, 400 (Regular) | Normal | Descriptions, table cells |
| **Caption / Label** | Geist Sans | 13 px, 500 (Medium) | +0.01em | Micro-captions, status labels |
| **Hardware Code / Log** | Geist Mono | 13 px, 500 (Medium) | Normal | UUID, `cmd_id`, ADC mV |

---

## 4. Spacing, Shapes & Container Queries

### 4.1 Touch Ergonomics & Spatial Rules
- **Base Grid:** 4 px (scale: 4, 8, 12, 16, 20, 24, 32, 40, 48, 64).
- **Corner Radii:** Bento Cards & Modals: `rounded-3xl` (24 px); Inputs & Numpad: `rounded-xl` (12 px); Action Buttons & Pills: `rounded-full` (9999 px).
- **Touch Target Safeguards (UX-FR-03):**
  - Minimum **56×56 CSS px** touch target for all interactive elements on HMI Kiosk.
  - Critical buttons (`Mulai Batch`, `Konfirmasi Isi Ulang`, `E-Stop`) have a minimum height of **64 px** and min width of **140 px**.
  - Minimum 12 px physical separation between adjacent mutation buttons to prevent mis-touches.

### 4.2 Modern CSS Container Queries (`@container`)

Per `modern-web-guidance`, Bento grid components use CSS Container Queries (`container-type: inline-size`) so each card intrinsically adapts its layout based on available space rather than rigid viewport media queries:

```css
.bento-card-container {
  container-type: inline-size;
  container-name: bento-card;
}

@container bento-card (max-width: 320px) {
  .hero-metric { font-size: 2.5rem; }
  .metric-badge { display: none; }
  .chart-sparkline { height: 48px; }
}

@container bento-card (min-width: 480px) {
  .hero-metric { font-size: 4rem; }
  .metric-badge { display: inline-flex; }
  .chart-sparkline { height: 96px; }
}
```

---

## 5. React Three Fiber (R3F) 3D Drum Liquid Engine

Per `3d-web-experience`, `UX-FR-01`, and the physical industrial reference (`id-11134207-7r98p-lxp8w56k0dv280.webp`), drums are rendered as authentic **Industrial HDPE Blue Barrels** with a **Dynamic View-Dependent Camera-Facing X-Ray Transparency Shader**, allowing the operator to peer inside the drum from any viewing angle.

```
+-----------------------------------------------------------------------+
|              AUTHENTIC INDUSTRIAL HDPE BLUE DRUM (3D)                 |
|                                                                       |
|              [  Black Molded Lid + Silver Clamp Ring Collar  ]        |
|            /---------------------------------------------------\      |
|           /   Outer Silhouette: Deep Blue HDPE Barrel (#1D4ED8) \     |
|          |                                                       |    |
|          |    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~    |    |
|          |    Camera-Facing Dynamic X-Ray Translucent Facet: |    |
|          |    - Surface facing camera becomes clear acrylic   |    |
|          |    - Liquid & waves fully visible inside           |    |
|          |    - Opaque blue rear wall provides deep contrast  |    |
|          |    - Etched volumetric Liters graduation lines    |    |
|          |                                                       |    |
|          |    - - - - - - - - - - - - - - - - - - - - - - - -    |    |
|          |    Safe Drain Threshold Guideline (<= 5.0 L Mark)     |    |
|           \                                                     /     |
|            \---------------------------------------------------/      |
|                        Molded Base Ribbing Ring                       |
+-----------------------------------------------------------------------+
```

### 5.1 Geometry & Material Specifications

1. **Vessel Geometry (Industrial HDPE Drum Profile):**
   - Modeled after standard 20 L / 140 L open-top chemical barrels:
     - Characteristic subtle barrel curvature (gentle middle bulge tapered toward top rim and base).
     - Molded top lid in matte dark charcoal (`#1E293B`, `roughness: 0.6`).
     - Galvanized steel lever-lock clamp ring collar (`#94A3B8`, `metalness: 0.85`, `roughness: 0.25`).
     - Circumferential body ribbing rings providing structural visual depth.
2. **Dynamic View-Dependent Camera-Facing X-Ray Shader:**
   - Rather than an artificial static cutout, the drum shell uses a custom GLSL fragment shader evaluating the facing ratio between the surface normal $\vec{N}$ and camera view direction $\vec{V}$:
     ```glsl
     float facingRatio = max(0.0, dot(vNormal, vViewPosition));
     // Front-facing facet transitions smoothly into clear glass/acrylic
     float frontAlpha = mix(0.12, 1.0, 1.0 - pow(facingRatio, 1.8));
     ```
   - **Front-Facing Surface (Facing User):** Becomes crystal-clear acrylic (`transmission: 0.88`, `roughness: 0.08`, `opacity: 0.12`), revealing the inner liquid, wave dynamics, and graduation lines. As the drum is rotated 360°, the transparent inspection window dynamically follows the user's eye line.
   - **Rear & Side Walls (Curving Away):** Transition smoothly into solid, opaque Industrial Blue HDPE plastic (`#1D4ED8` to `#1E40AF`, `roughness: 0.35`, `metalness: 0.05`), creating a high-contrast dark blue backdrop that makes the internal fluids visually pop.
3. **Procedural Liquid Mesh & Custom GLSL Wave Shader:**
   - Inner fluid volume scaled along Y-axis matching live telemetry volume (`uLevel` normalized 0.0 to 1.0).
   - **Wave Motion (Vertex Shader):**
     - Wave turbulence frequency and amplitude driven by FSM state uniforms (`uState: IDLE, FILLING, MIXING, DOSING, DISTRIBUTING`).
     - *IDLE:* Gentle, calm surface breathing (`amplitude: 0.02`, `frequency: 1.2`).
     - *FILLING / DOSING:* Concentric ripples emanating from concentrate/water injection inlet.
     - *MIXING:* High-frequency shearing wave turbulence (`amplitude: 0.08`, `frequency: 4.5`).
     - *DISTRIBUTING:* Smooth draining vortex / whirlpool depression at bottom center.
   - **Internal Fluid Color & Contrast:**
     - **Drum 1 (Concentrate 20 L):** Translucent golden-amber liquid (`#F59E0B` to `#D97706`), glowing warmly against the dark blue interior backing. Soft pulsing coral/amber rim emission (`#F97316`) when stock $\le$ 2.8 L; emergency red glowing base ring (`#EF4444`) when starved.
     - **Drum 2 (Distribution 140 L):** Luminous translucent azure-blue liquid (`#0284C7` to `#38BDF8`), with illuminated white graduation lines (20L, 50L, 100L, 140L), a red guideline at $\le 5.0\text{ L}$ (safe fault drain threshold), and an emerald line at $140.0\text{ L}$ (target batch fill).

### 5.2 Device Optimization & Accessibility Integration

- **Framerate Cap:** Capped at **30 FPS** on Xiaomi TV A (Mali-G52 GPU) and Beelink EQ12 (Intel N100) to keep hardware temperatures low (< 45°C) 24/7.
- **Frameloop Mode:** `frameloop="demand"` when liquid is calm and static; switches to dynamic loop only during active telemetry changes or user rotation.
- **Accessibility & DOM Reflection (Modern Web Guidance):**
  Assistive technology and automated testing tools cannot inspect WebGL canvas pixels. Every R3F Canvas is paired with an accessible semantic DOM element:
  ```html
  <div class="drum-canvas-wrapper" style="position: relative;">
    <canvas id="drum-2-canvas" aria-hidden="true"></canvas>
    <!-- Semantic Accessible Mirror -->
    <div role="meter"
         aria-label="Volume Tangki Distribusi Drum 2"
         aria-valuenow="140.0"
         aria-valuemin="0.0"
         aria-valuemax="140.0"
         aria-valuetext="140.0 Liter (Penuh, Siap Distribusi)"
         class="sr-only">
      140.0 L (100%)
    </div>
  </div>
  ```

---

## 6. Multi-Tier Display Layout Strategies

### 6.1 Secondary Display Gazebo (43" Xiaomi TV A FHD — 1920×1080)

**Role:** 24/7 Passive Billboard & Research Showcase. Zero interactive touch buttons; read-only mirror.

```
+-------------------------------------------------------------------------------------------------------------------------+
| [LOGO] desanomia              GAZEBO MONITORING BILLBOARD             October 9, 2026 • 04:25:10        STATUS: NORMAL  |
+-------------------------------------------------+-----------------------------------------------------------------------+
| LEFT PANEL (30% Width): SHOWCASE & 3D CAROUSEL  | RIGHT PANEL (70% Width): PASSIVE OPERATIONAL BENTO GRID               |
|                                                 |                                                                       |
| +---------------------------------------------+ | +-----------------------------------+ +-----------------------------+ |
| | Greenhouse Ambient Visual / Bay Camera Feed | | | ACTIVE PROCESS STATE              | | HERO TDS PPM (Glanceable 3m)| |
| | High-key, bright daylight natural setting   | | | [BADGE: BATCH ID #1042]           | |                             | |
| +---------------------------------------------+ | | PREPARING: DOSING NPK             | |       612 ppm               | |
|                                                 | | Target: 600 ppm | Step 3 of 6      | |  Target: [550 - 650 ppm]    | |
| +---------------------------------------------+ | +-----------------------------------+ +-----------------------------+ |
| | 3D TURNTABLE DRUM CAROUSEL                  | |                                                                       |
| | (Auto-cycles every 10s across Drum A, B,    | | +---------------------+ +---------------------+ +-----------------+ |
| |  and Standby Pairs 2-5)                     | | | DRUM 1 (NPK CONC.)  | | DRUM 2 (DISTRIBUT.) | | LIVE ACTUATORS    | |
| |                                             | | | 18.4 L / 20.0 L     | | 140.0 L / 140.0 L   | | Solenoid: OFF     | |
| | Active: Drum 2 (Distribution 140L)          | | | Wave: Stable        | | Wave: Mixing Ripple | | Peristaltic: RUN  | |
| +---------------------------------------------+ | +---------------------+ +---------------------+ +-----------------+ |
|                                                 |                                                                       |
| [Pill: Pair 1 Active] [Pair 2] [Pair 3] [..]    | +-------------------------------------------------------------------+ |
|                                                 | | TDS & EC HISTORICAL TELEMETRY (Full Width Area Chart)             | |
+-------------------------------------------------+-----------------------------------------------------------------------+
```

- **Typography Scaling:** Space Grotesk Hero TDS reads at 112 px Bold for effortless legibility across the 3–5 meter gazebo perimeter.
- **Auto-Cycle Animation:** Every 10 seconds, the 3D showcase smoothly transitions between Drum 1 (NPK), Drum 2 (Distribution), and Standby Pairs 2–5 with a subtle cross-fade.

---

### 6.2 Primary HMI Touchscreen Kiosk (15.6" UPERFECT BE156PF — 1920×1080)

**Role:** High-Ergonomics Panel Room Command Center. Standing operator, zero physical keyboard, full-width functional Bento Grid.

```
+-------------------------------------------------------------------------------------------------------------------------+
| [LOGO] desanomia    [Pair 1: Active] [Pairs 2-5: Standby]     Operator: Auto-Auth   [HW E-STOP: CLEAR]  [!! E-STOP BUTTON] |
+-------------------------------------------------------------------------------------------------------------------------+
| +-----------------------------+ +-----------------------------+ +-----------------------------+ +---------------------+ |
| | PROCESS STATE & DISPATCH    | | HERO TDS & GATE TELEMETRY   | | DRUM 1 CONCENTRATE (3D)     | | DRUM 2 WATER (3D)   | |
| | State: IDLE                 | |        600 ppm              | |      18.4 L (92%)           | |      0.0 L (Empty)  | |
| | Next: 06:00 (Vegetatif)     | | In Tolerance Band           | | Status: Healthy             | | Status: Ready Fill  | |
| |                             | | [~~~~~~~~ Wave Chart ~~~~~] | | [  3D R3F Interactive Cyl ] | | [ 3D R3F Cyl ]      | |
| | [JADWALKAN / MULAI BATCH]   | | Baseline Ref: 104 ppm       | | [Konfirmasi Isi Ulang (20L)]| | [Manual Drain]      | |
| +-----------------------------+ +-----------------------------+ +-----------------------------+ +---------------------+ |
|                                                                                                                         |
| +-----------------------------------------------------------+ +-------------------------------------------------------+ |
| | TODAY'S TIMELINE & FERTI-SCHEDULE CALENDAR                | | ACTUATOR TEST BENCH & INTERLOCK MONITOR               | |
| | 06:00 - Pair 1 (Fase Vegetatif: 1100 ppm) [Scheduled]     | | Fill Solenoid (SV1):      [OFF] [Jog 5s]             | |
| | 12:00 - Pair 1 (Fase Generatif: 1250 ppm) [Standby]       | | Peristaltic Pump (PP1):   [OFF] [+10 mL Bump]         | |
| | Single-Run Invariant: No double fertigation today         | | High-Shear Mixer (M1):    [OFF] [Mix 10s]             | |
| |                                                           | | Distribution Pump (P1):   [LOCKED - DRUM EMPTY]       | |
| +-----------------------------------------------------------+ +-------------------------------------------------------+ |
|                                                                                                                         |
| +---------------------------------------------------------------------------------------------------------------------+ |
| | FULL-WIDTH 6-HOUR SENSOR TRACE (TDS ppm, Water Level cm, Temp °C)                                                   | |
+-------------------------------------------------------------------------------------------------------------------------+
```

- **Zero Vertical Scrolling:** 1920×1080 canvas strictly locked (`overflow: hidden`).
- **Touch Target Safeguards:** Every button is min 56×56 px; `Mulai Batch` is 64 px tall with full-width primary accent.
- **Top Right Header E-Stop:** 64×64 px vibrant red pill button (`#EF4444`). 1-tap instant software trip (< 16 ms pessimistic latch) with zero confirmation modal on Kiosk.

---

### 6.3 Mobile PWA & Remote Web Clients (360–430px Viewports)

**Role:** Remote Supervision & Mobile Control via WiFi / Tailscale. Responsive single-column vertical stack with fixed bottom pill tab bar and confirmation modals on destructive triggers.

---

## 7. Component Specifications & Interactive Controls

### 7.1 Buttons & Interactive Controls

| Variant | Styling & Tokens | Min Touch Size | Usage / Examples |
| :--- | :--- | :--- | :--- |
| **Primary Pill** | `bg-[#2563EB] text-white hover:bg-[#1D4ED8] rounded-full shadow-pill` | 56×56 px (Kiosk) | `Jadwalkan / Mulai Batch`, `Simpan Resep` |
| **Secondary Pill**| `bg-white text-[#1E293B] border border-[#E2E8F0] hover:bg-[#F1F5F9] rounded-full` | 56×56 px (Kiosk) | `Batal`, `Tutup`, `Filter Tanggal` |
| **Danger Pill** | `bg-[#EF4444] text-white hover:bg-[#DC2626] rounded-full` | 64×64 px (Kiosk) | `Emergency Stop`, `Batalkan Batch` |
| **Warning Pill** | `bg-[#F97316] text-white hover:bg-[#EA580C] rounded-full` | 56×56 px (Kiosk) | `Konfirmasi Isi Ulang`, `Override Hari Sama` |
| **Jog / Bump Btn**| `bg-[#F1F5F9] text-[#1E293B] active:bg-[#2563EB] active:text-white rounded-xl` | 56×56 px (Kiosk) | `+10 mL`, `Mix 5s`, `Jog Valve` |

### 7.2 Integrated On-Screen Touch Numpad

To prevent OS virtual keyboards from obstructing the screen on the HMI Kiosk, all numeric fields (Target PPM, Calibrate ADC, Manual mL) spawn an integrated clean touch numpad:

```
+---------------------------------------+
| TARGET PPM NUTRISI                    |
| [              600                  ] |
+---------------------------------------+
| [   1   ]   | [   2   ]   | [   3   ] |  <- Keys: 72×72 px
| [   4   ]   | [   5   ]   | [   6   ] |  <- Font: 24 px Bold Space Grotesk
| [   7   ]   | [   8   ]   | [   9   ] |  <- Background: White with
| [   C   ]   | [   0   ]   | [  <--  ] |     soft border & shadow
+---------------------------------------+
| [       KONFIRMASI NILAI (Pill)     ] |  <- 56 px Height Primary Pill
+---------------------------------------+
```

---

## 8. Modal, Overlay & Safety Friction System (Native HTML5 `<dialog>`)

Modals leverage the modern HTML5 `<dialog>` API with `::backdrop` styling for native focus trapping, keyboard handling (Esc), and accessibility:

### 8.1 Tier 1: Standard Operational Dialogs
- **Applies to:** Unified Batch Setup, New Recipe Preset, Numeric Numpad Entry.
- **Implementation:** Native `<dialog>` with `::backdrop { backdrop-filter: blur(8px); background: rgba(15, 23, 42, 0.25); }`. Floating pure white card (`#FFFFFF`), `rounded-3xl` (24 px).

### 8.2 Tier 2: Hard Warning Modal (Same-Day Double Distribution — UX-FR-17)
- **Applies to:** Attempting an ad-hoc or secondary batch when distribution has already run today.
- **Styling & Friction:** Warm coral border (`border-2 border-[#F97316]`), warning icon with pulsating aura, explicit danger text:
  > *"Peringatan Asfiksia & Over-Fertigasi: Bed tanaman sudah menerima nutrisi hari ini. Distribusi kedua berisiko menyebabkan busuk akar dan keracunan garam pupuk."*
- **3-Second Delay:** The `Konfirmasi Override & Jalankan` button is **disabled for 3 seconds** upon open with a visible countdown timer to prevent involuntary double-click accidents. Commits `SAME_DAY_FORCE_OVERRIDE` to backend audit trail.

### 8.3 Tier 3: Critical Domination Overlay (Pause Mode & E-Stop Recovery — UX-FR-11 & UX-FR-04)
- **Applies to:** Mid-Batch Power Restoration Inspection or Active Emergency Stop.
- **Styling:** Full-screen dominating dark frosted backdrop (`backdrop-filter: blur(16px); background: rgba(15, 23, 42, 0.85);`).
- **Pause Mode Content:** Real-time volume in Drum 2, measured PPM, calculated concentrate deficit (mL) required to reach target PPM, and single confirmation resume button.
- **E-Stop Recovery Checklist:**
  - Live hardware switch status check: If `hw_estop_pressed: true`, displays flashing yellow-red stripe bar: *"TOMBOL JAMUR FISIK MASIH TERTEKAN — PUTAR UNTUK MELEPAS"*.
  - Drain condition check: If Drum 2 > 5.0 L, displays amber lock: *"Kuras drum hingga ≤ 5.0 L sebelum me-reset fault"*.
  - Reset button remains strictly locked until both hardware conditions report green.

---

## 9. Guided Sensor Calibration Wizard (UX-FR-13)

Accessible via `/manual` for analog probes (DFRobot Gravity TDS & 60 GHz Radar). Formatted as a high-clarity 6-step modal card:

```
+-------------------------------------------------------------------------------+
| WIZARD KALIBRASI SENSOR TDS & RADAR                               [X Tutup]   |
| [Step 1: Drain] -> [Step 2: Detach] -> [3: Raw ADC] -> [4: Buffer] -> [5: Commit]|
+-------------------------------------------------------------------------------+
| LANGKAH 3: PEMBACAAN RAW ADC & STABILITAS SINYAL                              |
|                                                                               |
| Celupkan probe TDS ke dalam larutan standar kalibrasi 1413 µS/cm.              |
|                                                                               |
| Raw ADC Voltage:       1.418 V  (Target: 1.410 - 1.430 V)                     |
| Signal Noise (p-p):    ± 4 mV   [STATUS: STABIL & BERSIH]                     |
|                                                                               |
| [~~~~~~~~~~~~~~~~ Live Waveform Scrubber (500 ms window) ~~~~~~~~~~~~~~~~~]   |
|                                                                               |
| Air Baku Baseline: 104 ppm terdeteksi dari pasokan air pipa.                  |
+-------------------------------------------------------------------------------+
| [< Kembali]                                        [Lanjutkan: Simpan NVS >]  |
+-------------------------------------------------------------------------------+
```

---

## 10. Screen Hierarchy & Per-Screen Layouts

| Screen Route | Primary Layout Structure | Key Components |
| :--- | :--- | :--- |
| **`/` Dashboard** | Bento Grid (1920×1080 fixed on Kiosk; Split Showcase on TV; 1-Col Stack on Mobile) | 3D Drum Vessels, Hero TDS PPM, FSM Status, 5-Tank Selector, Actuator bench, Schedule timeline. |
| **`/batches`** | Data Table on `#F5F7FA` with sticky header | Filter pills (Status, Date), Search, Status Badges, CSV Export button, Pagination. |
| **`/batches/:id`** | Detailed Analytical Card + Timeline | Summary metrics row, Interactive ECharts time-series scrubber (TDS & Level), FSM Step Timeline. |
| **`/recipes`** | Modern 3-Column Card Grid | Recipe Cards (*Vegetatif 1100*, *Generatif 1250*, *Panen 1050*), Target PPM Pill, On-Screen Numpad Editor, "+ Resep Baru". |
| **`/schedules`** | Weekly Timetable & Calendar Card | Enable switch pills, conflict-free visual indicators, countdown to next trigger, target tank pair tag. |
| **`/manual`** | Diagnostic Grid with Interlock Badges | Peristaltic +10 mL bump btn, Mixer jog btn, Valve toggle, Sensor Calibration Wizard Launcher. |
| **`/users`** | Admin Security Table (Protected by Elevation) | Operator list, Role pills, Password reset dialog, Admin Elevation modal on Kiosk. |
| **`/403`, `/404`** | Minimalist Centered Error Card | Clear explanation, Return to Dashboard primary pill button. |

---

## 11. Frontend Design & Modern Web Compliance Matrix

| Requirement | Standard Source | Implementation Verification in Desanomia |
| :--- | :--- | :--- |
| **Non-Default Typography** | `frontend-design` | **Space Grotesk** (Display/Hero) + **Geist Sans** (Body) + **Geist Mono** (Hardware/Logs). Zero generic Inter/Roboto. |
| **Differentiation Anchor** | `frontend-design` | 3D volumetric glass vessels with procedural waves + Space Grotesk scientific telemetry numerals + horticultural bento grid. |
| **Container Queries** | `modern-web-guidance` | `@container` used on Bento cards for intrinsic scaling across Kiosk, Gazebo TV, and Mobile drawers. |
| **Accessible 3D Canvas** | `modern-web-guidance` | Semantic `<div role="meter">` mirrored alongside R3F `<canvas>` for screen readers and deterministic testing. |
| **Modern Color Spaces** | `modern-web-guidance` | `oklch()` definitions for smooth fluid shader gradient interpolation without muddy grays. |
| **Native Dialog API** | `modern-web-guidance` | Native HTML5 `<dialog>` with `::backdrop` for Tier 1, 2, and 3 modals. Zero external dialog library bloat. |
| **Touch Ergonomics** | Industrial Spec | Strict minimum 56×56 px targets on HMI Kiosk, 64 px critical buttons, custom On-Screen Touch Numpad. |
