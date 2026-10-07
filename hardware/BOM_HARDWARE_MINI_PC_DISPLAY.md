# BILL OF MATERIALS (BOM) & SPESIFIKASI PENGADAAN PERANGKAT
## Server Edge Mini PC, Sistem HMI Touchscreen, Display Gazebo & Jaringan PTP
**Proyek:** Greenhouse V2 DESANOMI — Sistem Otomasi Fertigasi Presisi  
**Status Dokumen:** **LOCKED IN / FROZEN (FINAL DEFINITIF)**  
**Tanggal Kunci:** 27 September 2026  
**Dokumen Anggaran Terkait:** `docs/hardware/RAB_HARDWARE_MINI_PC_DISPLAY.md`  

---

## 1. Ringkasan Arsitektur & Keputusan Desain (Design Invariants)

Berdasarkan tinjauan rekayasa sistem (`docs/CONSTITUTION.md` & `docs/DECISIONS.md` ADR 0005):

1. **Batas Arsitektur & Supremasi Kontroler (Pilar 1 Konstitusi):**  
   * **ESP32 Controller** memegang otoritas deterministik tertinggi untuk keselamatan fisik. Seluruh logika FSM 10-tahap, kalibrasi sensor, timer dosis, dan 5 gerbang interlock fisik berjalan independen di firmware ESP32.
   * **Mini PC Beelink EQ12** bertindak sebagai *Edge Gateway, Data Logger, Local Application Server (FastAPI + Docker + TimescaleDB), dan Operator HMI Engine*.
   * **Aliran Data:** `ESP32 ──(MQTT)──> Backend FastAPI ──> PostgreSQL/Timescale ──> Dashboard Web`. Frontend tidak pernah menulis langsung ke aktuator ESP32 tanpa melewati validasi backend.
2. **Platform Komputasi Edge:**  
   Menggunakan **Beelink EQ12 (Intel 12th Gen Alder Lake-N N100, 16GB DDR5, 500GB NVMe SSD, Dual 2.5GbE LAN)**. Dikonfigurasi UEFI BIOS dengan fitur **`Restore on AC Power Loss: Power On`** sehingga otomatis boot dan menjalankan container Docker tanpa intervensi manusia pasca mati listrik.
3. **Primary Operator HMI (Greenhouse Kiosk):**  
   Menggunakan **UPERFECT BE156PF 15.6" Full HD (1920×1080) IPS 10-Point Capacitive Touchscreen** dengan dudukan **Standing Monitor Touchscreen Tinggi 90 cm** (tiang lengkung plat besi tebal). Memiliki pola **VESA 4-Lubang resmi** (include 4 baut M3) yang terpasang *plug-and-play* pada plat standing kiosk. Catu daya disuplai mandiri oleh **UGREEN Mini GaN 30W Fast Charger** via kabel UGREEN C-to-C Elbow 100W 2m.
4. **Secondary Monitoring Display & Public DMZ (Gazebo):**  
   Menggunakan **Xiaomi TV A 43" FHD 2026 (Google TV™)** yang terpasang pada **Bracket Dinding TV Swivel/Tilt (VESA 200×200)**. TV terhubung ke port LAN modem **Telkomsel Orbit Star H2** melalui kabel UTP 5m. Menjalankan *Fully Kiosk Browser* untuk menampilkan telemetri fertigasi 24/7 secara pasif (*read-only mirror*), terisolasi dari jaringan kontrol fertigasi greenhouse.
5. **Jembatan Nirkabel Jarak Jauh (156.5 Meter PTP Bridge):**  
   Menghubungkan Gazebo ke Greenhouse melintasi kanopi kebun menggunakan **Sepasang Tenda O1 2.4GHz Outdoor CPE** (antena directional 9 dBi, beamwidth 60°/30°) pada elevasi **≥ 3.5 meter** dari tanah. Dipasang pada **Tiang Bracket Antena L Saygam 3/4"** menggunakan **Klem Selang Stainless 1.5 Inch (Klem Cacing)** dan kabel outdoor **FTP Cat5e 10m (Jaket Hitam PE Anti-UV + Shielded Foil)** dengan injeksi daya DC 24V via Passive PoE Injector bawaan.
6. **Proteksi Kelistrikan Tanpa Redundansi (Zero-Redundancy Protection):**  
   Jalur PLN diproteksi berurutan oleh:
   `PLN ──> RCBO 2P 10A 30mA (Anti-Kontak & Arus Bocor) ──> Digital VA-Protector 40A (Under/Over Voltage & Auto-Recovery 30s) ──> 4x Stopkontak Rel DIN Ewig`.

---

## 2. Tabel Spesifikasi Komponen & Bill of Materials (BOM Definitif)

| No | Komponen | Rekomendasi Merek & Tipe | Spesifikasi Teknis | Volume | Harga Satuan (Rp) | Subtotal (Rp) | Status & Catatan Kritis |
| :-: | :--- | :--- | :--- | :-: | -: | -: | :--- |
| **1** | **Unit Server Edge (Mini PC)** | **Beelink EQ12 (Intel N100)** | Intel N100 (4C/4T up to 3.4GHz), **RAM 16GB DDR5**, **SSD 500GB NVMe**, Dual 2.5G LAN, WiFi 6, BT 5.2 | 1 Unit | 3.799.000 | 3.799.000 | **LOCKED IN.** Unit server lokal. Include adaptor 12V 3A, kabel HDMI, dan braket dinding. |
| **2** | **Secondary Display Gazebo** | **Xiaomi TV A 43" FHD 2026** | Panel 43" FHD (1920×1080), 60Hz, **Google TV™**, Port LAN RJ45, WiFi Dual Band, VESA 200×200, Bobot 5.2 kg | 1 Unit | 3.399.000 | 3.399.000 | **LOCKED IN.** Layar monitoring Gazebo. Play Store resmi, Fully Kiosk Browser 24/7. |
| **3** | **Primary HMI Touchscreen** | **UPERFECT BE156PF 15.6"** | Panel IPS 15.6" FHD (1920×1080), 10-Point Capacitive Touch, VESA 4-Lubang (Include 4 baut M3), Daya 5V 3A (15W) | 1 Unit | 1.730.000 | 1.730.000 | **LOCKED IN.** Layar kendali operator panel. VESA plug-and-play ke standing 90cm. |
| **4** | **Standing Kiosk Lantai 90cm** | **Standing Monitor Touchscreen 90cm** | Tiang lengkung plat besi tebal, dudukan VESA 75×75 / 100×100, tinggi 90 cm, lubang jalur kabel internal | 1 Unit | 980.000 | 980.000 | **LOCKED IN.** Ergonomi operator berdiri di ruang panel greenhouse. |
| **5** | **Modem 4G Gateway DMZ** | **Telkomsel Orbit Star H2** | Modem 4G LTE WiFi, Port LAN RJ45, Include SIM Card kuota 150GB, Catu daya adaptor 12V OEM | 1 Unit | 689.000 | 689.000 | **LOCKED IN.** Gateway internet publik di Gazebo, melayani Wi-Fi tamu dan uplink PTP. |
| **6** | **Jembatan Nirkabel Outdoor** | **Tenda O1 2.4GHz CPE (Pair)** | Antena directional 9 dBi (60°/30°), jangkauan hingga 1km, IP64 waterproof, Passive PoE 24V included | 2 Unit | 325.000 | 650.000 | **LOCKED IN.** Sepasang bridge 156.5m (1x tiang Gazebo, 1x tiang Greenhouse). |
| **7** | **Adaptor Daya Monitor Kiosk** | **UGREEN Mini GaN 30W Fast Charger** | Port USB-C PD 3.0, **Varian 30W EU Plug (Steker Bulat)**, Gallium Nitride dingin, proteksi multi-layer | 1 Unit | 139.000 | 139.000 | **LOCKED IN.** Catu daya port `PD IN` monitor 15.6" (beban kerja 50%, zero panas). |
| **8** | **Kabel Daya Monitor USB-C** | **UGREEN C-to-C Elbow 100W (2m)** | Kabel siku L 90°, braided tebal, chip E-Marker, support PD 100W, **Panjang 2 Meter** | 1 Unit | 149.000 | 149.000 | **LOCKED IN.** Kabel daya fleksibel tanpa tekukan tajam ke port samping monitor. |
| **9** | **Kabel Video Monitor Kiosk** | **Kabel Mini-HDMI to HDMI 2.0 (2m)** | Konversi HDMI Normal (Beelink) ke Mini-HDMI (Monitor), gold-plated, **Panjang 2 Meter** | 1 Unit | 95.000 | 95.000 | **LOCKED IN.** Jalur transmisi video FHD 60Hz bebas latency. |
| **10** | **Kabel Data & Video Type-C** | **CABLETIME Type-C to Type-C 20Gbps (2m)** | USB 3.2 Gen2x2 (20 Gbps), PD 100W, 4K@60Hz DP Alt Mode, E-Marker, braided tebal, **Panjang 2 Meter** | 1 Unit | 150.000 | 150.000 | **LOCKED IN.** Jalur data sentuh 20Gbps & cadangan video DP Alt Mode Beelink. |
| **11** | **Braket Dinding TV Gazebo** | **Bracket TV Universal 17"–43"** | Plat baja cold-rolled, tilt ±15°, swivel horizontal, kompatibel VESA 200×200 mm | 1 Unit | 135.000 | 135.000 | **LOCKED IN.** Menggantung Xiaomi TV 43" di balok kayu/dinding gazebo. |
| **12** | **Tiang Braket CPE Tenda O1** | **Tiang Antena L Saygam 3/4"** | Pipa besi/galvanis 3/4", bentuk L (panjang 30–35 cm), plat dinding 3 lubang + dinabolt | 2 Unit | 60.000 | 120.000 | **LOCKED IN.** Pipa vertikal tempat memeluk bodi Tenda O1 (1x Gazebo, 1x GH). |
| **13** | **Kabel Tiang Outdoor FTP** | **Kabel Outdoor FTP Cat5e (10m)** | Jaket Hitam PE tahan sinar UV matahari & hujan, pelindung foil FTP anti-interferensi petir | 2 Pcs | 54.900 | 109.800 | **LOCKED IN.** Kabel dari Tenda O1 di tiang turun ke injector PoE indoor. |
| **14** | **Kabel LAN TV Gazebo** | **Kabel Patch Cord UTP Cat5 (5m)** | Kabel UTP RJ45 pabrikan 5 meter | 1 Pcs | 18.000 | 18.000 | **LOCKED IN.** Menghubungkan Orbit Star H2 ke port LAN Xiaomi TV 43". |
| **15** | **Kabel LAN Patch Cord Panel** | **Kabel UTP Cat6 RJ45 (2m)** | Tembaga murni 24AWG, Gigabit ready, RJ45 shielded (UGREEN/Vention) | 2 Pcs | 27.800 | 55.600 | **LOCKED IN.** 1x Gazebo (PoE ke Orbit), 1x Greenhouse (PoE ke Beelink LAN 2). |
| **16** | **Klem Selang Stainless CPE** | **Klem Selang Stainless 1.5 Inch** | Stainless 304, klem cacing dengan baut obeng, ukuran 1¼" – 1½" (25–38 mm) | 8 Pcs | 4.520 | 36.160 | **LOCKED IN.** 4 pcs terpakai untuk sepasang Tenda O1 di tiang 3/4", 4 pcs cadangan. |
| **17** | **Stopkontak Rel DIN Panel** | **Stop Kontak Din Rail Ewig (16A)** | Standar EU/Indonesia untuk rel DIN 35mm, rating 16A 250V AC dengan arde | 4 Unit | 36.540 | 146.160 | **LOCKED IN.** Catu daya Beelink, GaN 30W, PoE Tenda O1, dan spare service. |
| **18** | **Proteksi Tegangan Rel DIN** | **Digital DIN Rail VA-Protector 40A** | Over-volt (250V), under-volt (175V), over-current (10A), auto-recovery timer 30s, LED dual V/A | 1 Unit | 78.000 | 78.000 | **LOCKED IN.** Pengawal peralatan elektronik dari tegangan liar PLN pedesaan. |
| **19** | **Proteksi Kebocoran Arus** | **RCBO 2P 10A 30mA Rel DIN** | Proteksi gabungan arus lebih (MCB 10A) dan arus bocor tanah / anti-kontak (ELCB 30mA) | 1 Unit | 56.069 | 56.069 | **LOCKED IN.** Proteksi keselamatan operator terhadap sengatan listrik air. |
| **20** | **Kabel & Terminasi Internal** | **Kabel NYAF 1.5mm² + Skun Ferrules** | Serabut tembaga murni fasa/netral + skun ferrule press E1508 crimped | 1 Pkt | *Include Mas Taufiq* | Rp 0 | **SINKRON.** Disediakan langsung oleh Mas Taufiq dalam perakitan panel. |
| **TOTAL** | | | | | | **Rp 12.534.789** | *(19 Item Lengkap)* |
| **BUFFER** | **Kontingensi & Ongkir (+10%)** | | | | | **Rp 1.253.479** | *(Alokasi Kontingensi)* |
| **GRAND TOTAL** | **Total Pengadaan Definitif (FROZEN)** | | | | | **Rp 13.788.268** | *(Siap Eksekusi)* |

---

## 3. Diagram Topologi Aliran Sinyal & Pengkabelan Lengkap

### A. Topologi Ruang Panel & Kiosk Operator (Greenhouse)

```text
                  SUMBER DAYA PLN 220V AC (Fasa & Netral)
                                     │
                                     ▼
            ┌──────────────────────────────────────────────────┐
            │   RCBO 2P 10A 30mA (Proteksi Kebocoran Arus)      │
            └────────────────────────┬─────────────────────────┘
                                     │ (Kabel NYAF 1.5mm² + Ferrule E1508)
                                     ▼
            ┌──────────────────────────────────────────────────┐
            │   DIGITAL DIN RAIL VA-PROTECTOR 40A              │
            │   Cutoff: 175V – 250V | Delay Pemulihan: 30s     │
            └────────────────────────┬─────────────────────────┘
                                     │
                                     ▼
            ┌──────────────────────────────────────────────────┐
            │       4x STOPKONTAK REL DIN 35mm (EWIG 16A)      │
            │  ┌──────────┬──────────┬──────────┬───────────┐  │
            │  │  SLOT 1  │  SLOT 2  │  SLOT 3  │  SLOT 4   │  │
            └──┴────┬─────┴────┬─────┴────┬─────┴─────┬─────┴──┘
                    │          │          │           │
       ┌────────────┘          │          │           └──────> [Cadangan / Service]
       ▼                       ▼          ▼
┌──────────────┐        ┌─────────────┐ ┌───────────────────────────┐
│ Adaptor 12V  │        │ UGREEN GaN  │ │ Adaptor Passive PoE 24V   │
│ Beelink EQ12 │        │   30W PD    │ │ Tenda O1 Greenhouse       │
└──────┬───────┘        └──────┬──────┘ └─────────────┬─────────────┘
       │                       │                      │
       ▼                       │                      │ (Port PoE) ──> Kabel FTP Outdoor 10m
┌──────────────┐               │                      │                ke Tenda O1 di Tiang Atap
│ BEELINK EQ12 │               │                      │
│ (Mini PC N100│               │                      ▼ (Port LAN)
│ Edge Server) │               │            ┌───────────────────┐
│              │ <─────────────┼─────────── │ Kabel UTP Cat6 2m │
│              │ (LAN 2: enp2s0)            └───────────────────┘
│              │
│              │ ════════════════════════════════════════════════════════════════════════════╗
│              │  (Kabel Mini-HDMI to HDMI 2.0 Panjang 2 Meter)                             ║
│              │                                                                            ║
│              │ -------------------------------------------------------------------------  ║
│              │  (Kabel VIVAN USB-A to USB-C Data Touchscreen Panjang 2 Meter)             ║
└──────────────┘                                                                            ║
                                                                                            ║
       ┌────────────────────────────────────────────────────────────────────────────────────╢
       │                                                                                    ║
       ▼ (Port PD IN)                     ▼ (Port Mini-HDMI)         ▼ (Port USB-C Data)    ║
┌────────────────────────────────────────────────────────────────────────────────────────┐  ║
│               MONITOR TOUCHSCREEN UPERFECT 15.6" FHD (BE156PF)                         │  ║
│                - Terpasang kokoh pada Standing Kiosk Tinggi 90 cm -                    │  ║
│                - Menggunakan 4 Baut VESA M3 bawaan pabrik -                            │  ║
└────────────────────────────────────────────────────────────────────────────────────────┘  ║
                                                                                            ║
       ▲ (Kabel UGREEN USB-C to USB-C Elbow 100W Panjang 2 Meter)                           ║
       ╚════════════════════════════════════════════════════════════════════════════════════╝
```

---

### B. Topologi Public DMZ & Display Pengawas (Gazebo Jarak 156.5 Meter)

```text
               SUMBER DAYA AC 220V GAZEBO
                            │
                            ├────────────────────────────────────────┐
                            ▼                                        ▼
             ┌─────────────────────────────┐          ┌─────────────────────────────┐
             │ Adaptor 12V Orbit Star H2   │          │ Catu Daya AC 220V Internal  │
             └──────────────┬──────────────┘          │ Xiaomi TV A 43" FHD         │
                            │                         └──────────────┬──────────────┘
                            ▼                                        │
             ┌─────────────────────────────┐                         │
             │   MODEM TELKOMSEL ORBIT     │                         │
             │   STAR H2 4G LTE (DMZ)      │                         │
             │   - Wi-Fi Tamu Publik       │                         │
             │   - Gateway Uplink Internet │                         │
             └──────┬───────────────┬──────┘                         │
                    │               │                                │
  (Kabel UTP 5m)    │               │ (Kabel UTP Cat6 2m)            │
  ke Port LAN TV    │               │                                │
                    ▼               ▼                                │
       ┌────────────────────────┐ ┌───────────────────────────┐      │
       │ XIAOMI TV A 43" FHD    │ │ Adaptor Passive PoE 24V   │      │
       │ (Google TV™ 24/7 Kiosk)│ │ Tenda O1 Gazebo           │      │
       │ - Dinding Bracket VESA │ └─────────────┬─────────────┘      │
       │   200×200 mm           │               │                    │
       └────────────────────────┘               ▼ (Port PoE)         │
                                      ┌───────────────────┐          │
                                      │ Kabel Outdoor FTP │          │
                                      │ Cat5e 10m PE Hitam│          │
                                      └─────────┬─────────┘          │
                                                │                    │
                                                ▼                    ▼
                                      ┌───────────────────┐ ┌───────────────┐
                                      │ Tenda O1 (Gazebo) │ │ Antena Wi-Fi  │
                                      │ Tiang L Saygam    │ │ Tamu Gazebo   │
                                      │ Klem Cacing 1.5"  │ └───────────────┘
                                      └─────────┬─────────┘
                                                │
                                                │ ~ ~ ~ Jembatan Nirkabel PTP 156.5m ~ ~ ~
                                                │ (2.4 GHz Directional, Elevasi ≥3.5m)
                                                ▼
                                      ┌───────────────────┐
                                      │ Tenda O1 (GH Roof)│
                                      └───────────────────┘
```

---

## 4. Panduan Perakitan Mekanikal & Elektrikal untuk Mas Taufiq (Track A)

### 1. Pemasangan UPERFECT 15.6" pada Standing Kiosk 90cm
1. Dudukan kepala Standing Kiosk memiliki lubang standar **VESA 75×75 mm**.
2. Monitor UPERFECT 15.6" memiliki 4 lubang VESA dengan baut bawaan **`M3*5mm`**.
3. *SOP Baut:* Gunakan 4 baut M3 tersebut ditambah ring plat lebar M3 pada sisi pelat standing kiosk agar kepala baut mencengkeram kuat dan tidak slip. Kencangkan dengan obeng tangan manual secara silang (jangan gunakan bor listrik).
4. Rutekan ketiga kabel (Mini-HDMI 2m, USB Touch 2m, dan USB-C Power 2m) melalui rongga leher tiang lengkung standing kiosk menuju ke bawah secara tersembunyi dan rapi.

### 2. Pemasangan Sepasang Tenda O1 pada Tiang Saygam 3/4"
1. Pasang pelat dasar Tiang Saygam L 3/4" ke balok tiang gazebo dan rangka atap greenhouse menggunakan baut dinabolt/sekrup kayu yang disediakan.
2. Lekukan cekung bodi belakang Tenda O1 ditempelkan langsung memeluk pipa bulat vertikal 3/4" Saygam.
3. Masukkan **Klem Selang Stainless Steel 1.5" (Klem Cacing)** melalui lubang celah tali Tenda O1 (1 klem di atas, 1 klem di bawah), lalu kencangkan baut obeng minus/plus hingga bodi CPE terkunci rapat dan tidak bisa berputar tertiup angin.
4. Hubungkan kabel **Outdoor FTP 10m Cat5e**, pastikan penutup karet tahan air (*waterproof gasket grommet*) di bagian bawah kompartemen port LAN Tenda O1 terpasang rapat sebelum penutupnya diklik mengunci.

### 3. Pemasangan Xiaomi TV A 43" di Gazebo
1. Pasang plat dinding bracket TV pada balok tiang gazebo menggunakan sekrup dinabolt 10mm.
2. Pasang dua bilah gantungan VESA 200×200 mm pada bodi belakang Xiaomi TV menggunakan baut M6 bawaan bracket.
3. Gantungkan TV ke plat dinding, kunci baut pengaman bawah, dan hubungkan kabel UTP 5m dari modem Orbit Star H2 ke port LAN RJ45 TV.

---

*Dokumen BOM ini berstatus **FROZEN / LOCKED IN** dan menjadi acuan tunggal pengadaan perangkat keras fertigasi Greenhouse V2 DESANOMI.*
