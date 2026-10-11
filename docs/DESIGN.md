# DESIGN.md — Desanomia Light & Sleek Minimalist UI

> **Visual Authority:** Single Source of Truth (SOTT) for Desanomia's visual design system, token dictionary, component anatomy, and interaction choreography. Modeled on high-end Scandinavian minimalist IoT interfaces (Aeros design reference).

---

## 1. Design Vision & Philosophy

Desanomia Version 1 rejects dark, cluttered, and intimidating industrial dashboards. It establishes a **Light Scandinavian Minimalist** stance: an airy, welcoming, and high-legibility interface where complex fertigation processes feel effortless, calm, and immediately understandable.

### Core Principles
1. **Light, Clean & Open Atmosphere:** Pure white rounded cards floating on a warm off-white canvas. Zero visual noise, zero heavy dark textures.
2. **Generous Breathing Room:** Open whitespace prioritizes cognitive focus. Every metric has room to be scanned from several meters away.
3. **Typographic Authority:** Massive bold metric numerals (`text-6xl font-normal text-slate-900`) paired with whisper-quiet semantic labels (`text-sm font-medium text-slate-500`).
4. **Organic Fluid Visualizations:** Fluid hydrodynamics rendered through dual-gradient cubic spline curves, smooth pastel area fills, and rounded-pill progress meters.
5. **Tactile Touch Controls:** Soft, pill-shaped primary action buttons (`rounded-full`) and circular icon badges engineered for intuitive touch on a 15.6" Full HD kiosk screen.

---

## 2. Color System & Semantic Tokens

### Canvas & Surface Tokens
| Token | CSS Variable | Hex Value | Role / Usage |
| :--- | :--- | :--- | :--- |
| **Canvas Background** | `--color-bg-canvas` | `#F8FAFC` | Soft warm off-white foundation (Slate 50) |
| **Card Surface** | `--color-surface-card` | `#FFFFFF` | Pure brilliant white container |
| **Surface Secondary** | `--color-surface-subtle` | `#F1F5F9` | Pill backgrounds, inactive tabs, icon circle fills |
| **Border Hairline** | `--color-border-hairline`| `#E2E8F0` | Subtle, crisp structural dividers |
| **Border Active** | `--color-border-active`  | `#3B82F6` | Keyboard focus ring & selected container |

### Text & Typographic Hierarchy
| Token | CSS Variable | Hex Value | WCAG Contrast | Role / Usage |
| :--- | :--- | :--- | :--- | :--- |
| **Text Primary** | `--color-text-primary` | `#0F172A` | 15.8:1 (AAA) | Big hero values, screen titles, primary headings |
| **Text Secondary** | `--color-text-secondary`| `#64748B` | 4.8:1 (AA) | Metric units, card subtitles, timestamps |
| **Text Muted** | `--color-text-muted`   | `#94A3B8` | 3.2:1 (Large) | Axis guidelines, inactive state labels |

### Brand Accents & Interactive Actions
| Token | CSS Variable | Hex Value | Role / Usage |
| :--- | :--- | :--- | :--- |
| **Brand Primary CTA** | `--color-brand-primary` | `#2563EB` | Royal Blue solid pill buttons (`[Mulai Batch]`), active tabs |
| **Brand Primary Hover**| `--color-brand-hover`   | `#1D4ED8` | Tactile press/hover state |
| **Brand Subtle Fill**  | `--color-brand-subtle`  | `#EFF6FF` | Active pill background (Blue 50) |

### Process Status Semaphores (Soft Pastel Language)
| Status | Text Token | Background Token | Usage Context |
| :--- | :--- | :--- | :--- |
| **In Tolerance (OK)** | `#10B981` (Mint 600) | `#DCFCE7` (Mint 100) | TDS in target range `1250 ± 50 ppm`, stable operation |
| **Warning / Deficit** | `#F97316` (Peach 600) | `#FFEDD5` (Peach 100) | Calculated deficit recovery, low concentrate warning |
| **Critical / Fault** | `#EF4444` (Coral 600) | `#FEE2E2` (Coral 100) | Safety interlock trip, radar timeout, chemical lock |
| **Emergency Stop** | `#FFFFFF` (White) | `#EF4444` (Coral 500) | Dedicated top header Master E-Stop rounded pill button |

---

## 3. Elevation, Radii & Shadows

```css
/* Card Elevation */
--radius-card: 28px;               /* rounded-3xl / 28px organic curvature */
--radius-pill: 9999px;             /* rounded-full pill buttons and badges */
--radius-icon: 9999px;             /* circular action icon buttons */

/* Diffuse Ambient Shadows */
--shadow-card: 0 10px 30px -4px rgba(15, 23, 42, 0.04), 0 2px 8px -2px rgba(15, 23, 42, 0.02);
--shadow-card-hover: 0 16px 36px -6px rgba(15, 23, 42, 0.07), 0 4px 12px -2px rgba(15, 23, 42, 0.03);
--shadow-pill-cta: 0 4px 14px -1px rgba(37, 99, 235, 0.25);
```

---

## 4. Typography Scale

- **Hero Metric Display:** Plus Jakarta Sans / Space Grotesk Bold, 64px (`font-normal tracking-tight text-slate-900`).
- **Section & Card Titles:** Inter / Plus Jakarta Sans Medium, 22px (`font-medium text-slate-900`).
- **Card Subtitles & Labels:** Inter / Plus Jakarta Sans Regular, 14px (`text-slate-500 font-medium`).
- **Real-Time Telemetry & Timers:** Tabular Numbers (`font-mono tabular-nums`) to prevent horizontal layout shift during 1.0 Hz live streaming.

---

## 5. Signature Component Anatomy

### 1. Top Navigation Shell (Height: 64px)
- **Brand Identity:** Lowercase wordmark `desanomia` with a modern geometric organic leaf mark, followed by a soft gray pill badge `GH-01`.
- **Primary View Tabs:** Pill-shaped category group:
  - `Overview` (Active: Bold slate text with royal blue indicator bar or soft blue pill).
  - `Fertigasi`
  - `Jadwal`
  - `Diagnostik`
- **Utility Group:**
  - Search trigger: Circular icon button (`w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center`).
  - Date & Time: `11 Oktober • 06:15 WIB` (`text-sm font-medium text-slate-600`).
  - WebSocket Telemetry Dot: Soft green pastel circle + text `Online 1.0Hz`.
  - Notification Bell: Circular icon button with unread indicator badge.
  - Master Emergency Stop (E-Stop): Solid coral-red pill button (`bg-red-500 hover:bg-red-600 text-white font-medium px-5 py-2.5 rounded-full shadow-sm flex items-center gap-2`).

### 2. Main Hero Metric Card (Left Column — 50% Width)
- **Header:** Title `EC / TDS Nutrisi` with circular chevron/refresh action button.
- **Hero Value:** Massive bold numeral `1248` with subscript `ppm`.
- **Status Pill:** Soft pastel mint badge `Dalam Toleransi Target (1250 ± 50 ppm)` with green circular dot.
- **Data Wave Visualizer:** Smooth cubic spline dual-gradient area curve:
  - Line stroke: Royal Blue (`#2563EB`, 2.5px width).
  - Fill gradient: Translucent sky-blue fading into warm soft peach/salmon (`#FFEDD5`) at the baseline before disappearing.
  - Subtle reference line: Clean water baseline (`104 ppm`).
  - Bottom time axis: `14:40`, `16:30`, `19:30`, `20:30`, `20:45`.
- **Action Group:**
  - Primary CTA: Royal Blue solid pill button (`[Mulai Batch]`, `px-8 py-3.5 text-white font-semibold rounded-full shadow-md`).
  - Secondary CTA: Soft slate outline pill button (`[Detail Resep]`, `px-6 py-3.5 text-slate-700 bg-slate-100 rounded-full`).

### 3. Right Bento Grid (2×2 Rounded Cards — 50% Width)
- **Card 1: Tahap Siklus FSM**
  - Header: `Tahap Proses` with circular refresh icon.
  - Value: `Step 4 / 12` with subtitle `Injeksi Nutrisi (DOSING)`.
  - Micro-chart: Vertical rounded-pill bar sparklines with alternating blue/slate tints.
  - Timer: `00:01:14 berjalan` in tabular numerals.
- **Card 2: Volume Air Drum 2 (140L)**
  - Header: `Volume Drum 2` with water droplet icon.
  - Value: `140.0` `Liter` (`100% Penuh`).
  - Micro-chart: Diagonal striped rounded bar chart visualizer.
- **Card 3: Stok Konsentrat Pupuk (Drum 1 — 20L)**
  - Header: `Stok Konsentrat A+B` with flask icon.
  - Value: Soft mint pastel pill `18.2 L (Aman)` (91% kapasitas).
  - Micro-chart: Smooth soft ocean-blue wave curve.
- **Card 4: Status Pompa & Relai**
  - Header: `Relai & Pompa` with toggle icon.
  - Clean list with soft circular status badges:
    * Pompa Peristaltik (PP1): Soft blue badge `Aktif (+10 mL)`
    * Katup Solenoid Air (SV1): Muted gray `Standby`
    * Pompa Pengaduk (M1): Muted gray `Standby`
    * Pompa Distribusi: Soft peach `Terkunci (Belum Matang)`

---

## 6. Target Hardware & Fixed Zero-Scroll Kiosk Budget

### 6.1 Target Display Hardware (Tier 1 Primary HMI Kiosk)
- **Model:** UPERFECT BE185EF
- **Screen Size:** 15.6 inches IPS FHD
- **Native Resolution:** 1920 × 1080 pixels (16:9 aspect ratio, 141.2 PPI)
- **Physical Product Dimensions:** 355 mm (W) × 223 mm (H) × 11/6 mm (D)
- **Mounting:** Fixed standing console console in Greenhouse Panel Room (90 cm operator eye level)
- **Input:** 10-point capacitive multi-touch (zero physical mouse/keyboard required)

### 6.2 Strict Non-Scrollable Viewport Invariant (Zero-Scroll Boundary)
The primary operator dashboard is **strictly non-scrollable** (`overflow-hidden`, fixed 1920×1080 canvas budget). Operators wearing wet or nitrile gloves must never need to swipe, scroll, or hunt for controls.

#### Vertical Arithmetic Budget (1080 px Total Height):
```text
+-------------------------------------------------------------------------------+
| Top Header Shell (Height: 64 px, y: 0 -> 64)                                  |
+-------------------------------------------------------------------------------+
| Vertical Margin / Gap: 16 px (y: 64 -> 80)                                    |
+-------------------------------------------------------------------------------+
| Main Bento Cockpit Workspace (Height: 952 px, y: 80 -> 1032)                  |
|                                                                               |
|  [Left Column: 50% Width / 936 px]      [Right 2x2 Bento: 50% Width / 936 px] |
|  - Card Header & Badge: 56 px           - Row 1 (Cards 1 & 2): 464 px         |
|  - Big Hero Numeral: 88 px                * Tahap Proses (FSM)                |
|  - Fluid Spline Wave Chart: 640 px        * Volume Air Drum 2 (140L)          |
|  - Action Buttons (Mulai Batch): 56 px  - Gap: 24 px                          |
|  - Engine Status Micro-strip: 44 px     - Row 2 (Cards 3 & 4): 464 px         |
|                                           * Stok Pupuk A+B (20L)              |
|                                           * Relai & Status Pompa              |
+-------------------------------------------------------------------------------+
| Bottom Spacing / Inset Margin: 48 px (y: 1032 -> 1080)                        |
+-------------------------------------------------------------------------------+
Total Canvas Height = 64 + 16 + 952 + 48 = 1080 px (100% Fixed, Zero Scroll)
```

### 6.3 Touch Ergonomics & Kiosk Invariants
- **Minimum Hit Targets:** All interactive buttons enforce `min-h-[56px] min-w-[56px]` with generous touch padding for gloved/wet greenhouse operators.
- **Button Spacing:** Adjacent buttons enforce $\ge 12\text{ px}$ physical separation.
- **Master E-Stop:** Top header mounts a prominent coral-red pill button ($56\text{ px}$ height $\times$ min $140\text{ px}$ width, `z-[100]`) accessible at all times without scrolling.
- **Fixed Container Classes:** Root viewport applies `w-[1920px] h-[1080px] max-w-[1920px] max-h-[1080px] overflow-hidden select-none`.
