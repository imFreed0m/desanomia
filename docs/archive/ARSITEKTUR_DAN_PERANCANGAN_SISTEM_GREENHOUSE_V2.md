# Sistem Otomasi Fertigasi dan Monitoring IoT Smart Greenhouse Berbasis Web dengan Integrasi Arsitektur Feedforward Deterministik dan Dashboard Glassmorphism

*Web-Based Smart Greenhouse IoT Monitoring and Automated Fertigation System with Deterministic Feedforward Architecture and Glassmorphism Dashboard Integration*

**Tim Pengembang & Rekayasa Sistem Greenhouse DESANOMI:**  
1) Taufiq (Hardware & Panel Assembly)  
2) Faqih (Electronics & Sensor Calibration)  
3) Maria Zahra / imFreed0m (Software & Cloud/Edge Architecture)  
*Afiliasi:* DESANOMI Smart Agriculture Research Group  
*Status:* RATIFIED & EMPIRICALLY FROZEN (2026)  
*Dokumen Rujukan Konstitusi:* `docs/CONSTITUTION.md` & `docs/SPEC.md`

---

## ABSTRAK

Proyek ini bertujuan untuk merancang dan membangun sistem otomasi fertigasi dan monitoring berbasis web untuk Greenhouse DESANOMI yang memanfaatkan teknologi *Internet of Things* (IoT) guna meningkatkan presisi nutrisi dan efisiensi air pada 980 titik tanam (6 raised bed B1–B6). Berbeda dengan sistem pertanian konvensional yang mengandalkan takaran manual atau sistem loop tertutup (*closed-loop*) yang rentan osilasi overdosing, sistem ini mengimplementasikan arsitektur *closed-loop feedforward* dengan *one-way safety gate* deterministik pada mikrokontroler ESP32. Pengendalian fluida tandon 140 Liter dikawal ketat oleh 5 gerbang interlock non-bypassable, meliputi: Ambang Mutu TDS (1200–1300 ppm), Dry-Run Cutoff (< 5.0 L), Batch Depletion Guard (≤ 2.0 L), Watchdog Pengisian Air (20 menit / 1200 s), dan Pemeriksaan Kualitas Air Baku Bersih (< 300 ppm). Sensor yang digunakan mencakup Sensor Analog TDS (ADC1 VP/GPIO36) dan Sensor Level Radar Tahan Air JSN-SR04T V3 (GPIO32 & GPIO35), yang mengendalikan 4 aktuator utama (Solenoid Valve Air Bersih, Pompa Dosis Peristaltik 24V, Pompa Mixer Submersible, dan Pompa Distribusi) melalui modul relai terisolasi optocoupler. Komunikasi data telemetri real-time ditransmisikan menggunakan protokol MQTT (broker Mosquitto) ke backend server berbasis FastAPI dan basis data relasional PostgreSQL. Antarmuka operator dirancang menggunakan React, TypeScript, Tailwind CSS, dan desain Glassmorphism 3.0 yang mengedepankan prinsip *Pessimistic UI* (anti double-dispatch) dan kepatuhan aksesibilitas WCAG 2.2 AA. Hasil pengujian menunjukkan bahwa arsitektur ini mampu menjalankan siklus fertigasi 10-state secara otonom, mencegah risiko pompa kering (*dry-run*), dan menyajikan data telemetri dengan latensi rendah (< 2 detik).

**Kata kunci:** *Internet of Things (IoT), ESP32, Automated Fertigation, closed-loop Feedforward, MQTT, FastAPI, PostgreSQL, React, Glassmorphism.*

---

## ABSTRACT

*This project designs and implements an automated fertigation and web-based IoT monitoring system for Greenhouse DESANOMI to optimize nutritional precision and water usage efficiency across 980 planting points (6 raised beds B1–B6). Unlike conventional manual dosing or erratic closed-loop feedback systems prone to chemical overshoot, this architecture enforces an closed-loop feedforward mechanism governed by a deterministic one-way safety gate executed autonomously on an ESP32 microcontroller. The 140-liter reservoir cycle is guarded by 5 non-bypassable physical interlocks: TDS Tolerance Gate (1200–1300 ppm), Dry-Run Cutoff (< 5.0 L), Batch Depletion Guard (≤ 2.0 L), Clean Water Watchdog (20 min / 1200 s), and Clean Water Baseline Validation (< 300 ppm). Hardware instrumentation includes an Analog TDS Sensor (ADC1 VP/GPIO36) and a Weatherproof JSN-SR04T V3 Level Sensor (GPIO32/35), driving 4 key actuators (Clean Water Solenoid Valve, 24V Peristaltic Dosing Pump, Submersible Mixer, and Distribution Pump) via optocoupler-isolated relays. Real-time telemetry data is streamed using the MQTT protocol (Mosquitto broker) to a FastAPI backend and a PostgreSQL database. The web operator interface is crafted using React, TypeScript, Tailwind CSS, and a Glassmorphism 3.0 design system incorporating Pessimistic UI patterns (zero double-dispatch) and WCAG 2.2 AA accessibility standards. Empirical validation confirms that the system reliably executes the 10-state fertigation FSM autonomously, eliminates dry-run hazards, and delivers responsive telemetry updates under 2 seconds.*

**Keywords:** *Internet of Things (IoT), ESP32, Automated Fertigation, closed-loop Feedforward, MQTT, FastAPI, PostgreSQL, React, Glassmorphism.*

---

## 1. PENDAHULUAN

Penerapan teknologi pertanian presisi (*smart greenhouse*) di era modern menuntut otomasi yang andal, aman, dan dapat dipantau dari jarak jauh tanpa menghilangkan kendali keselamatan fisik. Pada budidaya tanaman dengan sistem hidroponik dan fertigasi tetes skala menengah (seperti Greenhouse DESANOMI dengan 980 titik tanam pada 6 bedeng raised-bed), ketepatan rasio larutan nutrisi (PPM / TDS) dan ketersediaan air menjadi faktor penentu utama kelangsungan hidup serta produktivitas tanaman. 

Kendala utama yang sering dihadapi petani meliputi:
1. **Human Error pada Pencampuran Nutrisi:** Penakaran pupuk pekat secara manual sering kali menghasilkan konsentrasi TDS yang fluktuatif di luar ambang optimal (1200–1300 ppm), yang memicu gejala defisiensi unsur hara atau keracunan akar (*nutrient burn*).
2. **Bahaya Kerusakan Aktuator Mekanik (*Dry-Run*):** Pengoperasian pompa distribusi saat tandon air kosong berisiko tinggi membakar motor pompa sentrifugal dan submersible.
3. **Akumulasi Garam Mineral Akibat Residu Tandon:** Menjalankan siklus pencampuran baru saat tandon belum terkuras habis akan melipatgandakan konsentrasi garam terlarut.
4. **Kelemahan Sistem Auto-Dosing Loop Tertutup (*Closed-Loop*):** Banyak sistem IoT berupaya melakukan penyesuaian pH/PPM otomatis secara terus-menerus (*feedback hunting*), yang di lapangan sering kali gagal akibat keterlambatan homogenisasi cairan (*mixing lag*), menyebabkan *over-dosing* bahan kimia pekat.

Untuk mengatasi permasalahan tersebut, Greenhouse DESANOMI V2 menerapkan filosofi rekayasa **closed-loop Feedforward dengan One-Way Safety Gate** yang dikawal oleh Konstitusi Sistem (`docs/CONSTITUTION.md`). Sistem mengandalkan resep empiris terkalibrasi (injeksi 476 mL pekatan ke dalam 140 Liter air bersih menggunakan pompa peristaltik selama 51 detik) dan hanya mengizinkan distribusi air jika hasil pengukuran sensor TDS memenuhi jendela 1200–1300 ppm dengan deviasi standar ≤ 5.0 ppm.

Sistem monitoring dan kontrol web dirancang menggunakan stack modern: **ESP32** (firmware C++ FreeRTOS), **MQTT Mosquitto** (transport data berbobot ringan), **FastAPI** (backend Python asinkron), **PostgreSQL** (basis data transaksional terstruktur), serta antarmuka **React 18** berbasis Glassmorphism 3.0 yang menerapkan *Pessimistic UI* untuk menjamin keselamatan aktuator fisik di lapangan.

---

## 2. METODE PENELITIAN & PERANCANGAN SISTEM

Metode perancangan sistem Greenhouse V2 dibagi menjadi tiga bagian terpadu: Perancangan Perangkat Lunak (*Software*), Perancangan Perangkat Keras (*Hardware*), dan Perancangan Alur Logika Deterministik (*Finite State Machine*).

### A. Perancangan Perangkat Lunak (Software Architecture)

Perancangan perangkat lunak mencakup perancangan struktur basis data relasional (PostgreSQL) serta arsitektur komunikasi data berlapis dari mikro edge controller hingga antarmuka pengguna web.

#### 1. Perancangan Desain Basis Data (ERD Relasional)
Struktur basis data dirancang untuk menyimpan audit lengkap siklus fertigasi, telemetri sensor periodik, status aktuator, dan pencatatan peristiwa kegagalan sistem (*fault safety events*).

```text
  ┌─────────────────────────────────┐           ┌─────────────────────────────────┐
  │              users              │           │       fertigation_batches       │
  ├─────────────────────────────────┤           ├─────────────────────────────────┤
  │ id             : UUID (PK)      │1         *│ id             : UUID (PK)      │
  │ username       : VARCHAR(50)    ├───────────┤ batch_number   : INT            │
  │ password_hash  : VARCHAR(255)   │           │ triggered_by   : UUID (FK)      │
  │ role           : VARCHAR(20)    │           │ trigger_type   : VARCHAR(20)    │
  │ full_name      : VARCHAR(100)   │           │ status         : VARCHAR(30)    │
  │ is_active      : BOOLEAN        │           │ base_water_tds : FLOAT          │
  │ created_at     : TIMESTAMPTZ    │           │ final_tds_ppm  : FLOAT          │
  └─────────────────────────────────┘           │ tds_std_dev    : FLOAT          │
                                                │ volume_mixed_l : FLOAT          │
                                                │ start_time     : TIMESTAMPTZ    │
                                                │ end_time       : TIMESTAMPTZ    │
                                                │ fault_code     : VARCHAR(50)    │
                                                └───────────────┬─────────────────┘
                                                                │ 1
                                                                │
                                                                │ *
  ┌─────────────────────────────────┐           ┌───────────────┴─────────────────┐
  │       safety_fault_events       │           │      sensor_telemetry_logs      │
  ├─────────────────────────────────┤           ├─────────────────────────────────┤
  │ id             : BIGSERIAL (PK) │*         1│ id             : BIGSERIAL (PK) │
  │ batch_id       : UUID (FK)      ├───────────┤ batch_id       : UUID (FK)      │
  │ fault_type     : VARCHAR(50)    │           │ recorded_at    : TIMESTAMPTZ    │
  │ state_at_fault : VARCHAR(30)    │           │ state_name     : VARCHAR(30)    │
  │ sensor_reading : JSONB          │           │ tank_volume_l  : FLOAT          │
  │ resolved_by    : UUID (FK)      │           │ water_height_cm: FLOAT          │
  │ resolved_at    : TIMESTAMPTZ    │           │ tds_ppm        : FLOAT          │
  │ remarks        : TEXT           │           │ mixer_active   : BOOLEAN        │
  └─────────────────────────────────┘           │ dosing_active  : BOOLEAN        │
                                                │ valve_active   : BOOLEAN        │
                                                │ pump_active    : BOOLEAN        │
                                                └─────────────────────────────────┘
```
*Gambar 1. Perancangan Skema Basis Data Relasional Sistem Fertigasi (PostgreSQL)*

---

#### 2. Arsitektur Sistem pada Project (Diagram Blok Lengkap)

Diagram arsitektur sistem pada Gambar 2 menggambarkan interkoneksi sederhana namun komprehensif antara perangkat fisik di greenhouse, mikro edge controller ESP32, broker MQTT lokal, server backend FastAPI, basis data PostgreSQL, dan klien web dashboard yang diakses operator.

```text
 ┌────────────────────────────────────────────────────────────────────────────────────────┐
 │                              GREENHOUSE LAPANGAN (PHYSICAL LAYER)                      │
 │                                                                                        │
 │     [ SENSOR INPUT ]               [ MIKROKONTROLER ]             [ AKTUATOR FISIK ]   │
 │   ┌───────────────────┐          ┌───────────────────┐          ┌────────────────────┐ │
 │   │ Sensor TDS Analog │─────────►│                   │─────────►│ Solenoid Air (Ch1) │ │
 │   │ (Pin VP / GPIO36) │          │    ESP32 NODEMCU  │          └────────────────────┘ │
 │   └───────────────────┘          │   30-PIN TYPE-C   │          ┌────────────────────┐ │
 │   ┌───────────────────┐          │                   │─────────►│ Pompa Mixer (Ch2)  │ │
 │   │ Radar Level Water │─────────►│  * FSM Determinis │          └────────────────────┘ │
 │   │ (JSN-SR04T V3)    │          │  * 5 Interlock    │          ┌────────────────────┐ │
 │   │ GPIO32 Trig/35 Ech│          │  * FreeRTOS Task  │─────────►│ Pompa Siram (Ch3)  │ │
 │   └───────────────────┘          │  * PubSubClient   │          └────────────────────┘ │
 │                                  │                   │          ┌────────────────────┐ │
 │                                  │                   │─────────►│ Pompa Dosis (Ch4)  │ │
 │                                  └─────────┬─────────┘          └────────────────────┘ │
 └────────────────────────────────────────────┼───────────────────────────────────────────┘
                                              │ Wi-Fi 2.4 GHz (Local Subnet LAN)
                                              ▼
 ┌────────────────────────────────────────────────────────────────────────────────────────┐
 │                             JARINGAN & TRANSPORT (NETWORK LAYER)                       │
 │                                                                                        │
 │             ┌────────────────────────────────────────────────────────────┐             │
 │             │          MODEM ROUTER 4G (TELKOMSEL ORBIT)                 │             │
 │             │             Gateway Subnet: 192.168.8.1/24                 │             │
 │             └──────────────────────────────┬─────────────────────────────┘             │
 │                                            │                                           │
 │                                            ▼                                           │
 │             ┌────────────────────────────────────────────────────────────┐             │
 │             │           MQTT BROKER (ECLIPSE MOSQUITTO)                  │             │
 │             │   * Topik Telemetri: greenhouse/fertigation/drum2/telemetry│             │
 │             │   * Topik Perintah : greenhouse/fertigation/drum2/command  │             │
 │             └──────────────────────────────┬─────────────────────────────┘             │
 └────────────────────────────────────────────┼───────────────────────────────────────────┘
                                              │ TCP Port 1883 / Secure Tunnel (Tailscale)
                                              ▼
 ┌────────────────────────────────────────────────────────────────────────────────────────┐
 │                             SERVER & LOGIKA BISNIS (BACKEND LAYER)                     │
 │                                                                                        │
 │         ┌──────────────────────────────────────────────────────────────────┐           │
 │         │                       FASTAPI BACKEND SERVER                     │           │
 │         │   * Async MQTT Client (aiomqtt) ── Ingest Telemetri              │           │
 │         │   * WebSocket Manager (Broadcaster ke Web Dashboard)             │           │
 │         │   * REST API Controller (Start Batch, Reset Fault, E-Stop)       │           │
 │         └────────────────┬─────────────────────────────────┬───────────────┘           │
 │                          │                                 │                           │
 │                          ▼                                 ▼                           │
 │         ┌────────────────────────────────┐ ┌──────────────────────────────────┐        │
 │         │     POSTGRESQL DATABASE        │ │      TAILSCALE MESH NETWORK      │        │
 │         │   * Log Telemetri Per-Detik    │ │   Akses Aman Teknisi Remote      │        │
 │         │   * Riwayat Siklus Batch       │ │   Tanpa Port Forwarding Publik   │        │
 │         │   * Log Keselamatan & Audit    │ └──────────────────────────────────┘        │
 │         └────────────────────────────────┘                                             │
 └────────────────────────────────────────────┬───────────────────────────────────────────┘
                                              │ HTTP / JSON API & WebSocket (ws://)
                                              ▼
 ┌────────────────────────────────────────────────────────────────────────────────────────┐
 │                             ANTARMUKA PENGGUNA (PRESENTATION LAYER)                    │
 │                                                                                        │
 │              ┌──────────────────────────────────────────────────────────┐              │
 │              │          WEB COCKPIT OPERATOR (REACT + VITE)             │              │
 │              │  * Tampilan Glanceable Status FSM (Jarak 3 Meter)        │              │
 │              │  * Metrik Live Volume Air, TDS PPM, dan Status Relai     │              │
 │              │  * Tombol Kontrol Hardware (Pessimistic UI, Anti-Double) │              │
 │              │  * Tombol Emergency Stop 48x48px (Focus Trapped Dialog)  │              │
 │              │  * Penanganan 4 Status Data: Normal, Stale, Off, Saturate│              │
 │              └─────────────────────────────┬────────────────────────────┘              │
 │                                            │                                           │
 │               ┌────────────────────────────┼───────────────────────────┐               │
 │               ▼                            ▼                           ▼               │
 │        [ LAPTOP OPERATOR ]         [ TABLET GREENHOUSE ]      [ SMARTPHONE TEKNISI ]   │
 └────────────────────────────────────────────────────────────────────────────────────────┘
```
*Gambar 2. Diagram Arsitektur Sistem Terintegrasi Greenhouse DESANOMI V2*

---

### B. Perancangan Perangkat Keras (Hardware Architecture)

Perangkat keras sistem dirancang dengan prinsip isolasi tegangan tinggi (*galvanic isolation*), perlindungan arus balik induktif (*flyback diode protection*), serta alokasi pin ADC1 ESP32 yang kebal terhadap interferensi transmisi radio Wi-Fi.

#### 1. Alokasi Pinout ESP32 NodeMCU 30-Pin Type-C
Semua pin ESP32 dipetakan secara ketat pada berkas `firmware/include/pinout.h` untuk menghindari pin *strapping* yang dapat mengganggu *booting* mikrokontroler.

| Simbol Firmware | Pin Fisik | GPIO | Tipe | Terhubung Ke | Deskripsi & Proteksi |
| :--- | :---: | :---: | :---: | :--- | :--- |
| `SENSOR_TDS_ANALOG` | `VP` | `36` | ADC1 (Input) | Sensor Analog TDS | Pembagi tegangan 5.6 kΩ / 10 kΩ (5V ke 3.2V maks). ADC1 Wi-Fi safe. |
| `LEVEL_ECHO` | `D35` | `35` | Input Murni | Sensor Level Radar | Input pulsa Echo 5V melalui Logic Level Converter. |
| `LEVEL_TRIG` | `D32` | `32` | Output Digital| Sensor Level Radar | Output pulsa Trigger 10 µs. Bebas dari pin *strapping*. |
| `RELAY_WATER_SOLENOID`| `D26`| `26` | Output Digital| Relay Ch1 (Solenoid) | Katup air bersih Normally Closed (NC), aman mati saat listrik putus. |
| `RELAY_MIXER_PUMP` | `D27` | `27` | Output Digital| Relay Ch2 (Mixer) | Pompa submersible aduk tandon Drum distribusi (220V AC). |
| `RELAY_IRRIGATION_AUX`| `D14`| `14` | Output Digital| Relay Ch3 (Distribusi)| Kontak pemutus pompa distribusi siram bedeng B1–B6. |
| `RELAY_DOSING_PUMP` | `D13` | `13` | Output Digital| Relay Ch4 (Dosing) | Pompa peristaltik 24V DC + Dioda flyback 1N4007 anti induktansi. |
| `BUZZER_ALARM` | `D18` | `18` | Output Digital| Piezo Buzzer 5V | Notifikasi suara peringatan kegagalan/selesai batch. |
| `LED_PANEL_STATUS` | `D19` | `19` | Output Digital| LED Pintu Panel | Heartbeat kedip 1s (Normal) / Kedip cepat (Fault). |

*Tabel 1. Pemetaan Pinout dan Penugasan I/O ESP32*

---

#### 2. Skematik Rangkaian dan Hubungan Komponen (Wiring Schematic)
Gambar 3 mengilustrasikan jalur perkabelan daya dan logika kendali. Catu daya dipisahkan menjadi dua domain: Domain Logika 5V/3.3V DC (ESP32 dan Sensor) serta Domain Daya 24V DC / 220V AC (Pompa Dosis, Solenoid, dan Pompa Mixer).

```text
  +------------------+          +--------------------------------------------+
  | Adaptor 12V/24V  |          |               Relay 4-Channel              |
  | DC Power Supply  |          |           (Optocoupler Isolated)           |
  +--------+---------+          +----+--------------+-------------+-----+----+
           |                         |              |             |     |
           | +24V DC                 | IN1 (D26)    | IN2 (D27)   | IN3 | IN4 (D13)
           +-------------------------+              |             |(D14)|
                                     | Solenoid Air | Mixer Pump  |Siram| Dosing Pump 24V
                                     | (220V AC)    | (220V AC)   |Aux  | (+1N4007 Diode)
                                     +--------------+-------------+-----+
                                                            ▲
                                                            │ Sinyal Kendali Logika 3.3V
  +---------------------------------------------------------┴----------------+
  |                          ESP32 NODEMCU 30-PIN                            |
  |                                                                          |
  |   [VP / GPIO36] ◄── [ Resistor Divider 5.6k/10k ] ◄── Sensor Analog TDS  |
  |   [D35 / GPIO35]◄── [ Level Converter 5V->3.3V  ] ◄── Level Echo JSN-SR |
  |   [D32 / GPIO32]──► [ Level Converter 3.3V->5V  ] ──► Level Trig JSN-SR |
  |   [D18 / GPIO18]──► Piezo Buzzer 5V (+)                                  |
  |   [D19 / GPIO19]──► LED Indikator Panel (+)                              |
  +--------------------------------------------------------------------------+
```
*Gambar 3. Skematik Interkoneksi Listrik dan Proteksi Aktuator*

---

#### 3. Tata Letak Fisik Infrastruktur Tandon & Greenhouse (Physical Layout)
Fasilitas fertigasi Greenhouse DESANOMI menggunakan sistem dua tandon:
1. **Drum konsentrasi (Kapasitas 20 Liter):** Wadah konsentrat pekat (2 kg pupuk AB Mix dilarutkan secara manual oleh operator). Dari drum ini, selang silikon menghubungkan cairan ke pompa peristaltik 24V DC.
2. **Drum distribusi (Kapasitas 140 Liter):** Wadah utama pencampuran dan tandon distribusi. Di atas drum terpasang Sensor Radar Tahan Air JSN-SR04T V3 dan Sensor Analog TDS. Di dasar drum diletakkan pompa submersible mixer untuk homogenisasi dan jalur hisap pompa distribusi berdaya tinggi.
3. **Jalur Distribusi 6 Bedeng (B1–B6):** Pipa distribusi utama mendistribusikan nutrisi secara serentak ke 980 stik tetes (*dripper*) tanpa manifold solenoid valve per-zona guna menjaga tekanan dan konsistensi debit cairan.

---

### C. Alur Logika Deterministik & Pengujian Sistem (FSM Workflow)

Siklus fertigasi dikendalikan oleh mesin status berhingga (*Finite State Machine*) 10-tahap yang berjalan otonom di core ESP32, bahkan jika koneksi Wi-Fi terputus.

```text
  [ 1. IDLE ]
       │ (Syarat: Sisa air Drum distribusi <= 5.0 L, Perintah START_BATCH diterima)
       ▼
  [ 2. FILLING_WATER ]
       │ (Solenoid Buka, isi hingga 140.0 L, Watchdog Maksimal 1200 detik / 20 menit)
       ▼
  [ 3. CHECK_BASE ]
       │ (Ukur TDS air baku bersih: Syarat Wajib TDS < 300 ppm)
       ▼
  [ 4. DOSING ]
       │ (Pompa peristaltik ON tepat 51 detik menyuntikkan 476 mL konsentrat)
       ▼
  [ 5. MIXING ]
       │ (Pompa mixer submersible ON selama 120 detik memutar sirkulasi cairan)
       ▼
  [ 6. STABILIZING ]
       │ (Semua pompa OFF selama 15 detik meredakan turbulensi gelembung)
       ▼
  [ 7. MEASURING_TDS ]
       │ (Ambil 10 sampel TDS beruntun, evaluasi deviasi standar: StdDev <= 5.0 ppm)
       ▼
  [ 8. GATE_EVALUATE ] ── (Di luar 1200–1300 ppm) ──► [ FAULT_PPM_OUT_OF_RANGE ] (Kunci Pompa!)
       │
       │ (TDS Lolos: 1200–1300 ppm ──► Status BATCH_LOCKED)
       ▼
  [ 9. DISTRIBUTING ]
       │ (Pompa siram ON ke 6 bedeng maks 180 s; DRY-RUN CUTOFF INSTAN jika air < 5.0 L)
       ▼
  [ 10. BATCH_DEPLETED ]
       │ (Sensor radar konfirmasi air tandon habis terkuras <= 5.0 L, catat log batch)
       ▼
  [ KEMBALI KE IDLE ]
```
*Gambar 4. Diagram Status Mesin Fertigasi Deterministik (10-State FSM)*

#### Lima Gerbang Interlock Keselamatan Mutlak (Non-Bypassable):
1. **Gerbang Ambang Mutu TDS (1200 – 1300 ppm):** Pompa distribusi terkunci mati jika rata-rata TDS di luar ambang batas ini.
2. **Pemutus Pompa Kering / Dry-Run Cutoff (< 5.0 L):** Pompa distribusi langsung dimatikan seketika jika cairan tersisa < 5.0 L.
3. **Pembersihan Tandon / Batch Depletion Guard (≤ 2.0 L):** Batch baru dilarang dimulai jika tangki masih berisi cairan sisa > 2.0 L.
4. **Watchdog Pengisian Air Bersih (1200 detik):** Jika dalam 20 menit air belum mencapai 140 L, katup solenoid ditutup paksa (`FAULT_FILL_TIMEOUT`).
5. **Pemeriksaan Kualitas Air Baku Bersih (< 300 ppm):** Jika air baku kotor atau terkontaminasi (≥ 300 ppm), siklus langsung dibatalkan (`FAULT_BASE_TDS_HIGH`).

---

## 3. HASIL DAN PEMBAHASAN

### A. Pengiriman Data Telemetri dan Kontrol Melalui Broker MQTT

Pengujian komunikasi data dilakukan menggunakan broker Eclipse Mosquitto. Mikrokontroler ESP32 menerbitkan (*publish*) paket telemetri JSON secara periodik setiap 2 detik ke topik `greenhouse/fertigation/drum2/telemetry`.

```json
{
  "state": "MIXING",
  "state_code": 5,
  "volume_l": 140.2,
  "water_height_cm": 77.4,
  "tds_ppm": 598.0,
  "tds_std_dev": 2.1,
  "relays": {
    "solenoid": false,
    "dosing_pump": false,
    "mixer": true,
    "irrigation_aux": false
  },
  "flags": {
    "is_full": true,
    "is_dry_run": false,
    "batch_locked": false
  },
  "uptime_sec": 1420
}
```

Pengujian verifikasi penerimaan pesan pada aplikasi MQTTX menunjukkan bahwa seluruh paket data diterima secara konsisten dengan QoS 0 tanpa adanya *packet loss* dalam jaringan lokal Wi-Fi modem 4G Telkomsel Orbit. Pengujian pengiriman perintah kontrol pada topik `greenhouse/fertigation/drum2/command` (seperti `{"action": "START_BATCH"}` dan `{"action": "EMERGENCY_STOP"}`) dieksekusi oleh mikrokontroler dengan latensi respon rata-rata di bawah 80 milidetik.

---

### B. Integrasi Basis Data PostgreSQL dan Layanan Backend FastAPI

Backend server yang dibangun menggunakan FastAPI mengonsumsi data telemetri MQTT secara asinkron (`aiomqtt`) dan menyimpannya ke dalam tabel `sensor_telemetry_logs` serta menyiarkannya ke klien antarmuka pengguna melalui WebSocket (`/ws/telemetry`). 

Ketika tahapan batch berganti atau terjadi peristiwa kegagalan (*fault*), backend mencatat *state transition* ke tabel `fertigation_batches` dan `safety_fault_events`. Dengan arsitektur asinkron ini, throughput penulisan log sensor dan siaran WebSocket tidak membebani komputasi server.

---

### C. Visualisasi Antarmuka Web Cockpit (Frontend HUD)

Antarmuka web dashboard dirancang dengan pendekatan *Glanceable HUD* (dapat dimonitor jelas oleh teknisi dari jarak 3 meter di lingkungan greenhouse). 

Fitur-fitur unggulan antarmuka web meliputi:
1. **Pessimistic UI (Zero Double-Dispatch):** Tombol aksi perangkat keras (seperti "Mulai Batch" atau "Emergency Stop") langsung beralih ke kondisi nonaktif (*disabled*) dengan animasi spinner pemrosesan segera setelah disentuh. Hal ini mencegah pengiriman ganda (*double triggering*) yang dapat merusak aktuator.
2. **Empat Status Penanganan Data Telemetri:**
   - **Normal (Hijau):** Aliran telemetri aktif dan data selalu terbarukan (< 30 detik).
   - **Stale (Kuning Amber):** Data tidak mengalami pembaruan selama > 30 detik.
   - **Offline (Merah Redup):** Jaringan terputus > 60 detik disertai notifikasi rekoneksi.
   - **Saturation (Ungu / Peringatan Batas):** Sensor TDS menyentuh batas ukur fisik maksimal (2000 ppm).
3. **Ergonomi Emergency Stop & Aksesibilitas:** Tombol penghenti darurat berdimensi minimal 48 × 48 piksel dengan modal dialog yang menerapkan *keyboard focus trapping* (`aria-modal="true"`), sesuai standar aksesibilitas WCAG 2.2 AA.

---

## 4. KESIMPULAN

Sistem Otomasi Fertigasi dan Monitoring IoT Smart Greenhouse V2 telah berhasil dirancang dan diimplementasikan secara komprehensif. Integrasi mikrokontroler ESP32, protokol MQTT, backend FastAPI, basis data PostgreSQL, dan antarmuka web React Glassmorphism membuktikan bahwa:
1. Arsitektur *closed-loop feedforward* yang dikombinasikan dengan 5 gerbang interlock keselamatan deterministik mampu mengeliminasi risiko ketidakstabilan penakaran pupuk (*hunting*) dan menjamin perlindungan fisik aktuator dari bahaya *dry-run*.
2. Pemisahan domain daya dengan relai terisolasi optocoupler dan pembagi tegangan ADC1 pada pin VP (GPIO36) menjamin pembacaan sensor analog bebas dari gangguan sinyal radio Wi-Fi.
3. Penerapan prinsip *Pessimistic UI* pada antarmuka web dashboard secara efektif mencegah masalah pengiriman ganda pada aktuator listrik berdaya tinggi.

---

## REFERENSI

1. Al-Adhim, M. F., & Dewi, G. S. (2024). Sistem Monitoring IoT Smart Farm Berbasis Web dengan Integrasi Template Dashboard Bootstrap dan Laravel 10. *COMSERVA: Jurnal Penelitian dan Pengabdian Masyarakat*, 4(7), 1973–1981.
2. Brown, R., et al. (2021). Frameworks and Templates: Enhancing User Interface with Responsive Web Architecture. *Journal of Software Engineering and Applications*, 14(9), 423–431.
3. Fernandez, J., et al. (2023). IoT-Driven Agricultural Monitoring for Sustainable Farming. *Journal of Precision Agriculture*, 14(1), 92–108.
4. Gonzalez, M., & Thomas, R. (2022). Real-Time Data Monitoring for Smart Agriculture. *International Journal of Agricultural Technology*, 15(2), 299–315.
5. Jackson, P., et al. (2022). Visualizing Environmental Data in Precision Farming. *Computers and Electronics in Agriculture*, 128, 47–58.
6. Kurniawan, D. E., et al. (2019). Smart Monitoring Temperature and Humidity Using Microcontroller and Telemetry. *Journal of Physics: Conference Series*, 1351(1), 012006.
7. Maier, A., Sharp, A., & Vagapov, Y. (2017). Comparative Analysis and Implementation of ESP32 Microcontroller for IoT Applications. *Internet Technology and Applications (ITA)*, 143–148.
8. Triyanto, J., et al. (2023). Monitoring Multi Sensor ESP32 Secara Realtime Berbasis Website. *Escaf*, 2(1), 1122–1128.
9. Wang, T., et al. (2021). Environmental Sensing and Fluid Control in Precision Farming with IoT. *Sensors and Actuators A: Physical*, 338, 112504.
