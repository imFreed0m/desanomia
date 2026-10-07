# RENCANA ANGGARAN BIAYA (RAB) DEFINITIF
## Sistem Otomasi Fertigasi 1 Drum, Server Edge, Kiosk HMI & Display Gazebo
**Proyek:** Greenhouse V2 DESANOMI — Sistem Otomasi Fertigasi Presisi (Desanomia Bantul)  
**Dokumen Induk:** RAB Awal 1 Drum dan Display - Desanomia Bantul  
**Tanggal Kunci:** Minggu, 27 September 2026  
**Status Anggaran:** **LOCKED IN / FROZEN (FINAL DEFINITIF SIAP EKSEKUSI)**  
**Referensi Teknis:** `docs/CONSTITUTION.md` & `docs/hardware/BOM_HARDWARE_MINI_PC_DISPLAY.md`

---

## 1. Rekapitulasi Anggaran Proyek

| No | Uraian Alokasi Biaya | Nilai Anggaran (Rp) | Status Realisasi |
| :-: | :--- | -: | :--- |
| **A** | **Komponen Fisik & Material Panel (42 Item)** | **17.763.000** | Terdiri dari 6 item terbeli & 36 item pengadaan baru |
| | ↳ *Realisasi Komponen Sudah Terbeli (6 Item)* | *1.105.000* | *Barang fisik sudah tersedia* |
| | ↳ *Sisa Kebutuhan Pengadaan Komponen Fisik (36 Item)* | *16.658.000* | *Perlu proses pemesanan / checkout* |
| **B** | **Biaya Pengiriman, Packing & Hal Tak Terduga (Kontinjensi)** | **2.000.000** | Pengamanan selisih ongkir, packing kayu & baut lokal |
| **C** | **Jasa Desain (Tahap I), Perakitan Panel & Instalasi Fisik** | **6.000.000** | Termasuk garansi perakitan (di luar kerusakan part/komponen) |
| **D** | **Jasa Desain UI (Tahap I), Integrasi & Struktural IoT (Web)** | **6.000.000** | Termasuk garansi fungsi sistem (di luar kerusakan part/komponen) |
| | **GRAND TOTAL ANGGARAN PROYEK** | **Rp 31.763.000** | **Total Nilai Kontrak / Proyek Resmi** |
| | **SISA ANGGARAN YANG PERLU DICAIRKAN** | **Rp 30.658.000** | **(Grand Total dikurangi 6 item yang sudah terbeli)** |

---

## 2. Tabel Rincian 42 Item Komponen Fisik (BOM Definitif)

| No | Nama Item / Komponen | Qty | Harga Satuan (Rp) | Subtotal (Rp) | Keterangan / Status |
| :-: | :--- | :-: | -: | -: | :--- |
| 1 | Pompa Peristaltic 24VDC 400mL/m | 1 | 640.000 | 640.000 | **terbeli** |
| 2 | Selang silicon pompa peristaltic 6/8mm | 5 | 10.000 | 50.000 | **terbeli** |
| 3 | Pompa mixing TDI 2000LPH 220V 40W | 1 | 120.000 | 120.000 | **terbeli** |
| 4 | TDS Sensor 0-1000ppm - trial | 1 | 90.000 | 90.000 | **terbeli** |
| 5 | TDS 0-2000ppm Online Monitoring Industrial Liquid Air Water RS485 12V | 1 | 1.560.000 | 1.560.000 | Siap beli (Sensor Utama Interlock) |
| 6 | Power Supply 24V 300Watt waterproof | 1 | 180.000 | 180.000 | **terbeli** |
| 7 | Solenoid Katup air Valve 1 Inch AC 220v | 1 | 220.000 | 220.000 | Siap beli (Katup Air Bersih) |
| 8 | Modul relay 4 Channel 5VDC | 1 | 25.000 | 25.000 | **terbeli** |
| 9 | IP68 Waterproof Wire Connector Sambungan Kabel Tahan Air/Anti Air - 2 PIN | 1 | 15.000 | 15.000 | Siap beli |
| 10 | DC buck Converter LM2596 | 1 | 15.000 | 15.000 | Siap beli |
| 11 | JSN-SR04 V3 IP68 ultrasonic sensor water level | 2 | 45.000 | 90.000 | Siap beli (Dual Level Drum 2) |
| 12 | Part elektronik kecil lain (PCB, TB screw, xbox) | 1 | 250.000 | 250.000 | Siap beli |
| 13 | Panel box Fort 60x80x20cm + kunci panel | 1 | 1.090.000 | 1.090.000 | Siap beli (Enclosure Panel Utama) |
| 14 | Din Rail MCB Aluminium 1 Meter | 2 | 15.000 | 30.000 | Siap beli |
| 15 | Cable Duct PMD Panjang 1.7 Meter 33 x 33 mm | 3 | 20.000 | 60.000 | Siap beli |
| 16 | Kabel NYAF 0.75 - KITANI /meter | 15 | 4.000 | 60.000 | Siap beli |
| 17 | Kabel 4 x AWG28 Silver Tinned Cu Plus Grounding Shielding /Meter | 10 | 8.500 | 85.000 | Siap beli (Jalur RS485 Anti-Noise) |
| 18 | Kabel Serabut 2x0.75 1Meter Ecer - Hitam | 10 | 4.000 | 40.000 | Siap beli |
| 19 | Feed-Through Terminal Block UK5 UK5N | 15 | 3.000 | 45.000 | Siap beli |
| 20 | Pilox clear coating | 1 | 25.000 | 25.000 | Siap beli |
| 21 | Cable Duct Protector - tc 6 | 10 | 9.000 | 90.000 | Siap beli |
| 22 | Box enclosure PCB atau relay - Ukuran PCB 92x87 mm | 1 | 60.000 | 60.000 | Siap beli |
| 23 | Komponen lain (labeling, skun, PG-Gland, dll) | 1 | 250.000 | 250.000 | Siap beli |
| 24 | MINI PC Beelink EQ12 N100 16G DDR5 500GB SSD NVMe WiFi6 Windows 11 Pro | 1 | 3.799.000 | 3.799.000 | Siap beli (Server Edge & SCADA) |
| 25 | Xiaomi TV A 43" FHD 2026 | 1 | 3.399.000 | 3.399.000 | Siap beli (Display Gazebo Google TV) |
| 26 | UPERFECT BE185EF 15.6" 1080P Touch | 1 | 1.730.000 | 1.730.000 | Siap beli (Layar HMI Kiosk VESA) |
| 27 | Stop Kontak Din Rail Arde 16A Ewig Berkualitas | 4 | 36.500 | 146.000 | Siap beli (Rel DIN 35mm) |
| 28 | Over current Under Voltage Protection recoverable 220V 40A/63A | 1 | 78.000 | 78.000 | Siap beli (Digital VA Protector) |
| 29 | Telkomsel Orbit Star H2 | 1 | 689.000 | 689.000 | Siap beli (Modem 4G DMZ Gazebo) |
| 30 | UGREEN Wall Charger Mini GaN PD Type C Fast Charging | 1 | 139.000 | 139.000 | Siap beli (Daya 30W Monitor Kiosk) |
| 31 | UGREEN Kabel Type C to Type C Elbow 100w | 1 | 149.000 | 149.000 | Siap beli (Kabel Siku Daya 2m) |
| 32 | Standing Monitor Touchscreen Tinggi 90 Cm Lengkung | 1 | 980.000 | 980.000 | Siap beli (Dudukan Kiosk Lantai) |
| 33 | RCBO MCB CHINT - NXBLE-63 2P, 6A | 1 | 190.000 | 190.000 | Siap beli (Proteksi Arus Bocor 30mA) |
| 34 | Tenda O1 | 2 | 325.000 | 650.000 | Siap beli (Sepasang PTP Bridge) |
| 35 | FTP 10m Cat 5 | 2 | 55.000 | 110.000 | Siap beli (Outdoor PE Shielded UV) |
| 36 | UTP 5m Cat 5 | 1 | 18.000 | 18.000 | Siap beli (Orbit ke Xiaomi TV) |
| 37 | UTP 2m Cat 6 | 2 | 28.000 | 56.000 | Siap beli (Patchcord Panel & Gazebo) |
| 38 | Clamp 1,5 inc Tenda O1 | 8 | 5.000 | 40.000 | Siap beli (Klem Cacing Stainless) |
| 39 | Tiang Bracket Tenda O1 | 2 | 60.000 | 120.000 | Siap beli (Tiang L Antena Pipa) |
| 40 | Kabel Mini HDMI to HDMI 2.0 | 1 | 95.000 | 95.000 | Siap beli (Jalur Video Kiosk 2m) |
| 41 | BRACKET TV 17" s/d 43" | 1 | 135.000 | 135.000 | Siap beli (Dudukan Dinding Gazebo) |
| 42 | CABLETIME Type-C to Type-C 20Gbps 4K60Hz 100W (2m) | 1 | 150.000 | 150.000 | Siap beli (Jalur Sentuh Touchscreen 20Gbps & Video DP) |
| | **SUBTOTAL BIAYA KOMPONEN (42 ITEM)** | | | **Rp 17.763.000** | |
| | **ONGKIR DAN HAL TAK TERDUGA (KONTINJENSI)** | | | **Rp 2.000.000** | |

---

## 3. Paket Jasa Rekayasa, Integrasi & Garansi

| No | Uraian Layanan Profesional | Qty | Harga Satuan (Rp) | Subtotal (Rp) | Ruang Lingkup & Jaminan |
| :-: | :--- | :-: | -: | -: | :--- |
| **J-1** | **Desain (tahap I), perakitan panel, dan instalasi + garansi perakitan (kec. part/komponen)** | 1 Pkt | 6.000.000 | 6.000.000 | Layouting box panel Fort 60×80, wiring 220V/24V/5V, terminasi UK5N, perakitan mekanikal standing kiosk, pemasangan tiang PTP nirkabel, pengujian beban kelistrikan, serta garansi mutu perakitan fisik. |
| **J-2** | **Desain UI (tahap I), integrasi dan Struktural IOT (web) + garansi fungsi (kec. part/komponen)** | 1 Pkt | 6.000.000 | 6.000.000 | Pengembangan web dashboard React SCADA, control panel fertigasi interlock, arsitektur backend FastAPI & broker Mosquitto, firmware FSM 10-tahap ESP32, integrasi sensor RS485/ultrasonic, setup Kiosk Mode 24/7, serta garansi fungsi otomasi end-to-end. |
| | **SUBTOTAL BIAYA JASA INTEGRASI** | | | **Rp 12.000.000** | *(Garansi Fungsi & Perakitan Penuh)* |

---

## 4. Pemetaan Klaster Fungsional Sistem Lapangan

### Klaster A: Otomasi Fertigasi 1 Drum & Panel Elektrikal (Greenhouse)
- **Panel Utama:** Box Fort 60×80×20 cm dengan kunci panel, rel DIN aluminium, cable duct PMD 33×33 mm, dan feed-through terminal UK5N.
- **Proteksi Kelistrikan:** RCBO CHINT NXBLE-63 2P 6A (pemutus fasa + netral, sensitivitas bocor 30mA) dipadu Over/Under Voltage Protector Digital auto-recovery.
- **Instrumentasi Presisi:** Sensor TDS Industrial RS485 0–2000ppm (12V) dengan kabel shielded 4× AWG28 silver tinned + grounding foil untuk mengawal interlock batas nutrisi 1200–1300 ppm.
- **Sensor Redundansi Level Air:** 2 unit JSN-SR04 V3 IP68 Ultrasonic untuk pengawasan ketat *Dry-Run Cutoff* (< 5.0 L) dan *Batch Depletion* (≤ 5.0 L) pada Drum 2.
- **Aktuator & Catu Daya:** Solenoid valve 1 inch 220V AC, Pompa mixing TDI 2000LPH 220V 40W, Pompa peristaltik nutrisi 24V 400mL/m, PSU 24V 300W Waterproof, LM2596 buck converter, dan relay 4-channel.

### Klaster B: Server Edge, HMI Operator & Gazebo Display
- **Server Edge (Greenhouse):** Beelink EQ12 (Intel N100, 16GB DDR5, 500GB NVMe SSD, WiFi 6, Dual 2.5GbE) sebagai host Docker, FastAPI, PostgreSQL, MQTT broker, dan engine HMI.
- **Kiosk HMI Operator (Greenhouse):** UPERFECT 15.6" Full HD 10-Point Touch terpasang di Standing Monitor 90 cm tiang lengkung dengan VESA mount. Kabel daya UGREEN GaN 30W C-to-C Elbow, kabel video Mini HDMI to HDMI 2m, dan kabel data touch VIVAN USB-A to USB-C 2m.
- **Public Mirror Telemetri (Gazebo):** Xiaomi TV A 43" FHD 2026 (Google TV™) terpasang pada bracket dinding swivel/tilt 17"–43" menjalankan browser telemetri pasif (*read-only*).

### Klaster C: Jaringan Nirkabel Jarak Jauh (PTP 156.5 Meter) & Gazebo DMZ
- **Internet & Gateway DMZ:** Telkomsel Orbit Star H2 di Gazebo melayani Wi-Fi publik/tamu dan uplink telemetri.
- **Wireless PTP Bridge:** Sepasang Tenda O1 2.4GHz Outdoor CPE (IP64, antena directional 9 dBi) pada tiang bracket L dan klem stainless steel 1.5", dihubungkan kabel outdoor FTP 10m Cat5 berjaket PE tahan UV dengan Passive PoE injection.

---

## 5. Kepatuhan Konstitusi & Invarian Rekayasa (Constitution Invariant)

1. **Physical Safety & Deterministic ESP32 Firmware:**  
   Sensor RS485 industrial dan dual JSN-SR04 V3 memastikan 5 gerbang keselamatan fisik (TDS 1200–1300 ppm, Dry-run < 5.0 L, Batch Depletion ≤ 5.0 L, Watchdog Pengisian Air 20 menit, Air Baku < 350 ppm) beroperasi otonom tanpa bergantung pada konektivitas internet.
2. **Anti-Reinvention & No Closed-Loop Dosing:**  
   Sistem tetap mengacu pada batch dosing terkalibrasi lapangan tanpa menambahkan komponen tereliminasi (stepper motor atau manifold solenoid per-zona).
3. **Pemisahan Jaringan Fisik & Ergonomi Kiosk:**  
   Zona DMZ Gazebo terisolasi secara logis dari jaringan steril kontrol fertigasi, dan Kiosk ruang panel memegang hak kontrol tunggal (*single-writer token*) dengan tombol Emergency Stop fisik & perangkat lunak terintegrasi.

---
*Dokumen ini merupakan Rekapitulasi Rencana Anggaran Biaya (RAB) Final yang menjadi acuan pengadaan resmi seluruh tim pengembang (Track A - Mas Taufiq & Track B - Faqih).*
