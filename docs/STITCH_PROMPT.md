# Stitch UI Generation Prompt: Desanomia Fertigation Dashboard

Copy and paste the entire block below into the Google Stitch prompt box:

```markdown
Generate a high-fidelity, ultra-clean modern web dashboard for the Desanomia greenhouse fertigation IoT system.

Target Display & Fixed Canvas Invariants:
- Target Hardware: UPERFECT BE185EF 15.6" IPS FHD Touchscreen (1920×1080 resolution, 355×223×11/6 mm).
- STRICT NON-SCROLLABLE INVARIANT: The entire UI must be completely fixed within a 1920×1080 viewport (`w-[1920px] h-[1080px] overflow-hidden`).
- ZERO VERTICAL SCROLL: Absolutely no page-level scrolling, no overflow, no tall layouts, and no footer ribbons extending past 1080px. Every card, metric, chart, and button must be visible simultaneously on the fixed screen.

Aesthetic & Style (Strictly Match Reference Style):
- Style Stance: Light, clean, sleek Scandinavian/Apple-inspired minimalist design with generous whitespace.
- Theme: Light Mode only. Absolutely no dark mode or dark slate theme.
- Canvas Background: Soft warm off-white / light neutral canvas (#F8FAFC to #F4F5F7).
- Card Surfaces: Brilliant crisp pure white cards (#FFFFFF) with generous rounded-3xl corners (border-radius: 28px).
- Card Elevation: Soft, diffuse ambient drop shadow (box-shadow: 0 10px 30px -4px rgba(0, 0, 0, 0.04)) with faint hairline borders (#E2E8F0).
- Typography: Large clean sans-serif typography with massive bold hero numbers, clean subtle labels (#64748B), and tabular monospace numerals for real-time timers.
- Visual Feel: Airy, uncluttered, easy to scan at a glance, breathing room between cards, zero industrial visual noise.

Header & Navigation:
- Top Header Bar:
  - Left: Clean minimalist brand logo "desanomia" with a small organic leaf/droplet mark, followed by a soft pill badge "GH-01".
  - Center Navigation: Pill-style category tabs:
    * "Overview" (Active: bold text with subtle blue indicator)
    * "Fertigasi"
    * "Jadwal"
    * "Diagnostik"
  - Right Controls:
    * Search icon button in a soft rounded circle
    * Live Date & Time: "11 Oktober • 06:15 WIB"
    * Connection status pill: Soft green dot with text "Online 1.0Hz"
    * Circular notification bell icon with a small notification dot
    * Emergency Stop Button: Sleek, high-contrast coral-red rounded pill button (bg-rose-500 text-white font-medium px-5 py-2.5 rounded-full shadow-sm) labeled "E-Stop" with a clean warning triangle icon.

Dashboard Layout (Bento Grid):
1. Left Main Hero Card ("EC / TDS Nutrisi"):
   - Top of card: Title "EC / TDS Nutrisi" with a circular icon action button on the top right.
   - Hero Metric: Massive bold numeral "1248" with light unit subscript "ppm".
   - Status Badge: Soft mint-green pastel pill badge labeled "Dalam Toleransi" (Target: 1250 ± 50 ppm).
   - Data Chart: A smooth, fluid dual-tone cubic spline area wave chart:
     * Top stroke line is vibrant royal blue (#2563EB).
     * Gradient fill underneath smoothly transitions from soft sky-blue to warm pastel apricot/salmon (#FED7AA / #FFEDD5) before fading out cleanly.
     * Subtle horizontal dotted reference line indicating clean water baseline (104 ppm).
     * Time labels along the bottom: 14:40, 16:30, 19:30, 20:30, 20:45.
   - Bottom Controls:
     * Primary action button: Solid Royal Blue rounded pill button (bg-blue-600 text-white font-medium px-8 py-3 rounded-full shadow-sm) labeled "Mulai Batch".
     * Secondary action button: Soft light-gray outline pill button (bg-slate-100 text-slate-700 font-medium px-6 py-3 rounded-full) labeled "Detail Resep".

2. Right Bento Grid (2×2 Rounded White Cards):
   - Top-Left Card ("Tahap Siklus FSM"):
     * Header: "Tahap Proses" with a circular refresh step icon.
     * Main Value: "Step 4 / 12" with subtitle "Injeksi Nutrisi (DOSING)".
     * Timer: "00:01:14 berjalan".
     * Graphic: Vertical rounded-pill bar chart showing progression across the 12 lifecycle steps with alternating soft blue and light gray bars.
   - Top-Right Card ("Volume Air Drum 2"):
     * Header: "Volume Drum 2 (140L)" with a droplet icon pill and arrow.
     * Main Value: "140.0" with unit "Liter" (100% Penuh).
     * Graphic: Diagonal striped rounded bar chart visualizer representing water capacity.
   - Bottom-Left Card ("Stok Nutrisi Drum 1"):
     * Header: "Stok Konsentrat A+B" with flask icon.
     * Main Value: Large soft mint-green status pill labeled "18.2 L (Aman)" (91% kapasitas).
     * Graphic: Smooth soft ocean-blue wave curve representing fluid level.
   - Bottom-Right Card ("Status Pompa & Katup"):
     * Header: "Relai & Pompa" with toggle icon.
     * Main Value: "1 Aktif" with 3 standby.
     * Clean list with soft circular status badges:
       - Pompa Peristaltik (PP1): Soft blue badge "Aktif (+10 mL)"
       - Katup Solenoid Air (SV1): Muted gray "Standby"
       - Pompa Mixer (M1): Muted gray "Standby"
       - Pompa Distribusi: Soft amber badge "Terkunci (Belum Matang)"

3. Action & Filter Bar (Top of Bento Grid):
   - Pill buttons for time filtering: [Hari Ini] [Kustomisasi] [Analisis] with soft borders and clean icons.

Ensure the entire layout looks airy, harmonious, and effortlessly readable, matching high-end modern minimalist IoT product design.
```
