# GreenHouse IoT — Automated & Smart Fertigation Specification v1

## 1. System Objective & Scope Boundary

Dokumen ini merupakan **Spesifikasi Rekayasa Utama (Master Technical Specification)** khusus untuk **Sistem Fertigasi Otomatis dan Cerdas (Automated Fertigation Subsystem)** pada Greenhouse DESANOMI.

Sistem bertugas:
1. Menyiapkan larutan nutrisi fertigasi siap pakai di **Drum Konsentrat** secara otomatis dengan target konsentrasi baseline: **1200 ppm** (rentang toleransi aman: **1200 – 1400 ppm**, volume kerja: **140 L**).
2. Mengontrol pengisian air bersih secara otomatis menggunakan **Radar Level Sensor** hingga mencapai volume target 140 L.
3. Melakukan injeksi konsentrat dari **Drum Distribusi** menggunakan **Pompa Peristaltik DC** berbasis durasi waktu tetap (*fixed timer*) yang di-hardcode dari data empiris lapangan (`Uji_dosis.md`). [PERLU DI SESUAIKAN ULANG LEBIH MODULAR]
4. Menghomogenkan larutan di Drum 2 menggunakan **Pompa Submersible (Submersible Mixer Pump)** selama 2 menit diikuti jeda tenang stabilisasi 15 detik. [PERLU DI SESUAIKAN ULANG LEBIH MODULAR]
5. Mengukur dan memvalidasi konsentrasi larutan menggunakan **Sensor TDS & EC (Kapasitas Maksimum Cap 2000 ppm)** sebagai **Interlock Gate** (pengaman gerbang satu arah, tanpa loop koreksi otomatis tertutup). 
6. Mengunci status larutan (*Batch Lock*) dan menerapkan **Aturan Siklus Batch Murni** (sistem dilarang mencampur larutan baru sampai batch saat ini habis disalurkan).
7. Menyalurkan larutan tervalidasi ke seluruh perakaran tanaman (**Bedeng B1–B6 secara serentak dan merata**) menggunakan **Pompa Distribusi Fertigasi** berbasis durasi waktu sementara (**Timer 3 Menit**) dengan proteksi *dry-run* dari sensor radar.

---

### Batasan Sistem (System Boundary vs Greenhouse Environment Sensors)
Proyek Greenhouse IoT secara keseluruhan terdiri dari dua sistem:
* **Sistem 1 (Dokumen ini): Dedicated Fertigation Controller (ESP32).** Bertanggung jawab penuh atas kendali aktuator relay keran air, pompa peristaltik DC, pompa submersible pengaduk, pompa distribusi serentak, sensor level radar, sensor TDS/EC cap 2000 ppm, dan mesin state interlock keselamatan.
* **Sistem 2 (Eksternal / Tahap Lanjutan): Greenhouse Environment Sensor System.** Bertanggung jawab atas telemetri mikroklimat makro (suhu udara, kelembaban udara RH, radiasi matahari/LUX, dan sensor kelembaban tanah di bedeng yang kelak akan menjadi pemicu otomatis distribusi menggantikan timer 3 menit).

```text
┌────────────────────────────────────────────────────────┐
│      GREENHOUSE ENVIRONMENT SENSORS (SYSTEM 2)         │
│  Sensors: Air Temp, Air RH, Solar LUX, Soil Moisture   │
│  (Masa Depan: Pemicu Kebutuhan Fertigasi via Tanah)   │
└───────────────────────────┬────────────────────────────┘
                            │ MQTT Telemetry / Event Trigger
                            ▼
┌────────────────────────────────────────────────────────┐
│             BACKEND / ORCHESTRATION LAYER              │
│       Monitoring Web App & Manual Trigger Engine       │
└───────────────────────────┬────────────────────────────┘
                            │ Clean Trigger Contract:
                            │ { command: "START_BATCH", target_ppm: 600 }
                            ▼
┌────────────────────────────────────────────────────────┐
│         SMART FERTIGATION SUBSYSTEM (SYSTEM 1 - ESP32) │
│  Authoritative Physical Controller (Deterministic FSM) │
│  - Radar Level Sensor (Water Fill Cut-Off & Dry-Run)   │
│  - DC Peristaltic Pump (Hard-coded Fixed Timer)        │
│  - Submersible Pump Mixer (2 Min Mix + 15s Settle)     │
│  - Drum 2 TDS & EC Sensor (Cap 2000 ppm Interlock Gate) │
│  - Distribution Pump (3 Min Timer to All Beds B1–B6)   │
│  - Batch Depletion Guard (No Re-mix until Tank Empty)  │
└────────────────────────────────────────────────────────┘
```

---

# 2. Physical Architecture

Sistem mengadopsi arsitektur tangki terpisah: tangki stok konsentrat pekat (**Drum 1**) dan tangki pencampuran batch (**Drum 2**).

> **Catatan Skalabilitas Sistem:**
> Unit Drum 1 dan Drum 2 pada spesifikasi ini merupakan **unit acuan (prototype baseline)**. Pada pengembangan ke depan, arsitektur ini akan direplikasi untuk **5 unit Drum Distribusi** dengan jenis pupuk dan target PPM yang berbeda-beda. Saat ini fokus rekayasa dipusatkan penuh pada 1 drum distribusi acuan.

```text
               ┌────────────────────────────────────────────────────────┐
               │                     ESP32 CONTROLLER                   │
               │        Authoritative Physical Interlock Loop           │
               └───────┬─────────────────┬───────────────┬───────┬──────┘
                       │                 │               │       │
          Relay / MOS  │                 │ Radar Distance│ Relay │ Relay
          Timer Signal │                 │ Digital/UART  │ Output│ Output
                       ▼                 ▼               ▼       ▼
                  ┌─────────┐      ┌───────────┐   ┌───────────┐ ┌──────────────┐
                  │   DC    │      │   RADAR   │   │Submersible│ │ Clean Water  │
                  │Peristal.│      │   LEVEL   │   │Mixing Pump│ │Solenoid Valve│
                  │  Pump   │      │  SENSOR   │   └─────┬─────┘ └──────┬───────┘
                  └────┬────┘      └─────┬─────┘         │              │
                       │                 │               │ Homogenize   │ 140 L Cut-Off
                       │                 │ Top-Mounted   │ Circulation  │
 ┌──────────────┐      │                 │ Liquid Level  │              │ Clean Water
 │    DRUM 1    │      │                 │               │              │ Source Pipe
 │ Stock Tank   ├──────┘                 │               │              │
 │ 20 L Manual  │ Anti-Siphon Air Gap    │               │              │
 └──────────────┘                        │               │              │
                       │                 │               │              │
                       ▼                 ▼               ▼              ▼
                 ┌─────────────────────────────────────────────────────────────┐
                 │                           DRUM 2                            │
                 │              Final Mixing & Batch Tank (140 L)              │
                 │              Aturan: 1 Batch diselesaikan utuh              │
                 └──────────────────────────────┬──────────────────────────────┘
                                                │
                                                ▼
                                       ┌─────────────────┐
                                       │   TDS SENSOR    │
                                       │ (Cap 2000 ppm)   │
                                       └────────┬────────┘
                                                │ Direct TDS Value (Tanpa ATC)
                                                ▼
                                       ┌─────────────────┐
                                       │ ESP32 Interlock │
                                       │      Gate       │
                                       └────────┬────────┘
                                                │
                             ┌──────────────────┴──────────────────┐
                             ▼                                     ▼
                    [ 1200 – 1300 PPM ]                    [ DI LUAR RENTANG ]
                    BATCH LOCKED & READY                     HALT / FAULT
                             │                            (Alarm & Cek Manual)
                             ▼
                    ┌─────────────────┐
                    │  Distribution   │
                    │      Pump       │
                    └────────┬────────┘
                             │ Relay Timer (3 Menit) + Radar Dry-Run Protection
                             ▼
                    ┌─────────────────┐
                    │ Pipa Distribusi │
                    │    Serentak     │
                    └────────┬────────┘
                             │ Terhubung merata tanpa pembagian valve zona
                             ▼
                    ┌─────────────────┐
                    │ Seluruh Bedeng  │
                    │     B1 – B6     │
                    │(980 Titik Tanam)│
                    └─────────────────┘
```


## 2.1 Drum 1 — Stock Solution Tank
* **Kapasitas Fisik:** 20 L.
* **Metode Preparasi & Standar Rasio:** Manual oleh operator dengan rasio standar kebun: **2 kg pupuk padat AB-Mix dilarutkan dengan air bersih hingga tanda 20 L** (setara **100 g/L**, atau **1 kg : 10 L** / **200 g / 2 L**).
* **Karakteristik Konsentrasi & Data Empiris Lapangan:**
  * Berdasarkan uji dosis empiris (`Uji_dosis.md`), tiap **1 g/L** pupuk padat memberikan kontribusi bersih **≈ 944 s/d 964 ppm**.
  * **Konsentrasi Teoritis Ideal:** $100\text{ g/L} \times 1.000\text{ ppm/(g/L)} = \mathbf{100.000\text{ ppm}}$ (asumsi larut sempurna tanpa baseline).
  * **Konsentrasi Empiris Terukur:** Pada air baku baseline 280 ppm, larutan stok menghasilkan $100 \times 944 + 280 = \mathbf{94.680\text{ ppm}}$ (atau **96.680 ppm** dengan faktor 964). Terdapat selisih deviasi 5–6% lebih rendah dibanding asumsi teoritis ideal.
  * **Status Sedimentasi Pupuk:** Nilai di atas diukur dari larutan teraduk. Estimasi endapan pupuk tak larut berkisar 10–30%. Jika terjadi sedimentasi, konsentrasi supernatan jernih di bagian atas tangki yang dihisap pompa dapat mengalami pergeseran sehingga memerlukan kalibrasi faktor secara berkala.
* **Prosedur Verifikasi Konsentrasi Laboratorium (Uji Pengenceran 1:200):**
  Untuk memverifikasi konsentrasi stok Drum 1 tanpa merusak elektroda probe TDS/PPM industri:
  1. Ambil sampel cairan pekat Drum 1 sebanyak **10 mL**.
  2. Campurkan secara homogen ke dalam **2.000 mL (2 L)** air baku yang telah diketahui nilai baseline-nya ($PPM_{\text{baseline}}$).
  3. Ukur konsentrasi campuran ($PPM_{\text{sample}}$). Konsentrasi efektif Drum 1 dihitung dengan formula pengenceran terkompensasi:
     $$PPM_{\text{actual\_stock}} = (PPM_{\text{sample}} - PPM_{\text{baseline}}) \times 201 + PPM_{\text{baseline}}$$
* **Sensor PPM:** **Dilarang dipasang langsung pada Drum 1.** Konsentrasi garam pekat (≈ 95.000–100.000 ppm) berada jauh melampaui batas linearitas probe PPM industri/lapangan dan menyebabkan saturasi serta kerusakan cepat elektroda.
* **Aktuator Output:** Pompa peristaltik berpenggerak Motor DC (dikendalikan via Relay/MOSFET oleh ESP32 berbasis durasi waktu tetap terkalibrasi).
* **Mekanika Anti-Siphon:** Selang keluaran dari pompa peristaltik masuk ke Drum 2 dengan posisi ujung selang menggantung di atas batas air tertinggi (*air gap / anti-siphon drop*) guna mencegah efek siphon gravitasi saat pompa mati.

## 2.2 Drum 2 — Final Mixing & Batch Tank
* **Kapasitas Total Tangki:** 160 L (Volume Kerja Standar: **140 L**).
* **Sensor Terpasang:**
  1. **Sensor TDS & EC (Cap 2000 ppm):** Terpasang pada kedalaman sirkulasi Drum 2 untuk memvalidasi tercapainya rentang target 600 ppm (1200–1300 ppm).
  2. **Radar Level Sensor (Top-Mounted):** Terpasang di atas Drum 2 menghadap ke permukaan air, mengukur jarak permukaan fluida secara kontinu untuk mengontrol pengisian air bersih hingga tepat 140 L dan proteksi anti-kering (*dry-run*).
  *(Catatan: Sensor suhu DS18B20 dan algoritma kompensasi ATC ditiadakan sementara untuk menyederhanakan sistem dan fokus pada data empiris riil kebun).*
* **Mekanisme Pengaduk:** **Pompa Submersible (Submersible Mixing Pump)** di dasar Drum 2. Berfungsi mensirkulasikan dan mengaduk campuran air bersih dan konsentrat secara merata selama 2 menit.
* **Jalur Masukan:**
  * Air bersih melalui Solenoid Valve pipa air bersih (otomatis tertutup saat sensor radar mendeteksi volume mencapai 140 L).
  * Larutan konsentrat dari Drum 1 melalui Pompa Peristaltik DC (durasi injeksi tetap).
* **Jalur Keluaran:**
  * Pipa hisap dasar tangki menuju Pompa Distribusi Fertigasi yang mengalirkan larutan ke seluruh bedeng (B1–B6) secara serentak dan merata.
* **Status Logika & Aturan Siklus Batch Murni:** Diperlakukan secara mutlak sebagai **Single Batch Reservoir**. Larutan baru **tidak akan dicampur ulang** sebelum seluruh volume batch saat ini habis disalurkan ke tanaman (dideteksi via radar level mendekati level kosong).

## 2.3 Radar Level Sensor Architecture (Pengganti Flow Meter)
Untuk menghindari kelemahan flow meter turbin mekanis (seperti risiko macet akibat kotoran, kerak garam, atau penurunan akurasi pada debit rendah), sistem mengadopsi sensor level ketinggian air non-kontak:

> **Catatan Rekayasa Fisik MVP (Pembaruan JSN-SR04T V3.0):**  
> Mengacu pada dokumen rancang bangun `docs/RANCANGAN_SETUP_SENSOR_LEVEL_JSN_SR04T.md`, untuk fase prototipe MVP 1 drum, peran pembacaan ketinggian fluida kontinu diimplementasikan menggunakan **Sensor Ultrasonik Waterproof JSN-SR04T V3.0** yang dipasang pada cerobong pipa leher PVC 2" setinggi 25 cm (menyingkirkan *blind-zone* 20 cm ke luar tandon). Sensor ini menjalankan logika interlock yang identik (Cut-Off 140 L dan Dry-Run < 5 L) dengan efisiensi biaya nyata (< Rp 150.000 vs FMCW Radar Rp 2–3,5 juta).

1. **Otomasi Pengisian Air Bersih (140 L Cut-Off):** ESP32 membuka solenoid valve air bersih dan memantau kenaikan ketinggian cairan. Ketika sensor level membaca jarak batas atas yang setara dengan volume **140 L**, solenoid valve ditutup seketika.
2. **Proteksi Dry-Run Pompa Distribusi:** Saat pompa distribusi menyala, sensor level memantau penurunan ketinggian. Jika level mencapai batas dasar aman (kritis rendah, sisa < 5 L), pompa distribusi diputus seketika sebelum batas timer 3 menit berakhir.
3. **Pencegahan Pencampuran Ganda (Batch Depletion Guard):** Siklus pembuatan pupuk baru (pengisian air & injeksi) ditolak keras oleh ESP32 jika sensor level masih mendeteksi adanya sisa larutan batch sebelumnya di Drum 2.

---

# 3. Nutrient Recipe Target & Baseline Operasional

Fokus rekayasa tahap ini dipusatkan penuh pada resep dasar:

| Profil Resep Tanaman | Fase Pertumbuhan | Target TDS Nominal | Rentang Toleransi Aman | Volume Batch Standar |
|---|---|---|---|---|
| **RECIPE_STANDARD_600** (Baseline Utama) | Vegetatif / Semai Lanjutan | **600 ppm** | **1200 – 1300 ppm** | **140 L** |
| *RECIPE_CUSTOM_FUTURE* | (Pengembangan 5 Drum Masa Depan) | Parameter Bebas | $\pm 50\text{ ppm}$ | 140 L |

> *Catatan Pengembangan:* Ketika 5 unit drum distribusi telah diinstalasi, masing-masing drum akan memiliki profil resep dan target TDS tersendiri sesuai jenis pupuk dan tahapan pertumbuhan tanaman.

---

# 4. Pengukuran TDS & EC Langsung (Cap 2000 ppm, Non-ATC)

Pengukuran konsentrasi larutan difokuskan langsung pada nilai empiris lapangan tanpa kompensasi suhu (non-ATC):
* **Rentang Kerja Sensor:** Sensor TDS/EC berkapasitas bacaan maksimum **cap 2000 ppm**. Kapasitas ini ideal dan sangat sensitif untuk mengawal target 600 ppm.
* **Kondisi Suhu Lingkungan:** Mengacu pada data eksperimen kebun (`Uji_dosis.md`), larutan berada pada suhu alami kebun (~29°C s/d 30°C). Nilai TDS yang terbaca langsung dijadikan nilai acuan tunggal (*single ground truth*).

## 4.1 Protokol Multi-Sample & Stability Window
Pengukuran dinyatakan sah (*VALID_READING*) hanya jika:
1. Pompa submersible pengaduk telah mati dan larutan mengalami jeda tenang stabilisasi selama $T_{\text{stabilize}} \ge 15\text{ detik}$.
2. ESP32 mengambil $N = 10\text{ sampel}$ pembacaan TDS dengan interval 1 detik.
3. Standar deviasi sampel memenuhi ambang kestabilan cairan:
   $$\sigma = \sqrt{\frac{1}{N} \sum_{i=1}^{N} (\text{TDS}_i - \overline{\text{TDS}})^2} \le 5.0\text{ ppm}$$


---

# 5. Baseline Water Quality Guard

Sebelum konsentrat diinjeksikan, ESP32 memvalidasi kualitas air baku di Drum 2:
* **Air Baku Ideal:** $50\text{ s/d } 200\text{ ppm}$.
* **Batas Maksimum Air Baku ($PPM_{\text{baseline\_max}}$):** **$300\text{ ppm}$**.
* **Proteksi:** Jika air baku terdeteksi $> 300\text{ ppm}$, sistem membatalkan proses dosing otomatis dan menerbitkan alarm `FAULT_WATER_SOURCE_IMPURE`. Hal ini mencegah pencampuran pupuk pada air berkualitas buruk yang dapat merusak keseimbangan osmotik tanaman.

---

# 6. AutoDose System (DC Peristaltic Pump with Fixed Timer)

Injeksi larutan pekat Drum 1 $\rightarrow$ Drum 2 dikendalikan oleh **Pompa Peristaltik Motor DC (12V)** yang digerakkan melalui modul Relay atau MOSFET oleh ESP32.

## 6.1 Karakteristik Operasional & Data Empiris Debit Pompa
* **Data Kalibrasi Empiris Pompa Peristaltik:**
  Berdasarkan pengujian debit lapangan terkini, pengisian wadah sebanyak **1 Liter (1.000 mL)** memakan waktu **1 menit 47 detik (107 detik)**.
  $$\text{Debit Aliran Riil } (Q_{\text{peristaltik}}) = \frac{1.000\text{ mL}}{107\text{ detik}} \approx \mathbf{9.346\text{ mL/detik}} \quad (\approx 560.7\text{ mL/menit})$$
* **Kebutuhan Konsentrat Target 600 ppm:** Berdasarkan pengujian empiris larutan (`Uji_dosis.md`), untuk menaikkan volume **140 L** air baku (baseline ~280 ppm) ke target **600 ppm** dibutuhkan pekatan stok Drum 1 (rasio 100 g/L) sebanyak **476 mL** (menggunakan faktor konversi 944 ppm/(g/L)).
* **Kalkulasi Durasi Fixed Timer Dosis:**
  ESP32 mengaktifkan pompa peristaltik selama durasi waktu tetap yang di-hardcode langsung ke dalam firmware:
  $$t_{\text{run\_dose}} = \frac{V_{\text{target\_ml}}}{Q_{\text{peristaltik}}} = 476\text{ mL} \times \left(\frac{107\text{ detik}}{1.000\text{ mL}}\right) = 50.93\text{ detik} \approx \mathbf{51\text{ detik}}$$
  $$\mathbf{\text{DOSE\_PUMP\_RUN\_DURATION\_SEC} = 51}$$
* **Catatan Rekalibrasi Dosis Supernatan:** Durasi $51\text{ detik}$ (476 mL) ini merupakan nilai operasional saat ini (kondisi teraduk tanpa filtrasi sedimen). Durasi timer ini akan dikalkulasi ulang dan disesuaikan kembali di masa mendatang setelah uji dosis supernatan jernih (20 L air + 2 kg pupuk diendapkan) selesai dilakukan.

---

# 7. Priming Routine & Anomaly Guard

## 7.1 SOP Priming Selang 5 Meter (Manual Operator Pre-Fill)
Jika pipa/selang peristaltik dalam kondisi kosong sama sekali (saat instalasi baru, penggantian selang, atau setelah stok Drum 1 sempat habis terhisap), operator wajib melakukan pengisian awal secara manual:
* **Data Karakteristik Pipa Fisik:**
  * **Panjang Total Selang:** **5 meter** (dari dasar Drum 1 melewati pompa peristaltik hingga ujung *nozzle drop* Drum 2).
  * **Volume Internal Selang:** **130 mL**.
  * **Waktu Pengisian Pipa Kosong (Priming Duration):** **13 detik**.
* **SOP Operator (Bukan Otomasi Firmware):**
  * Priming dilakukan secara manual oleh operator (menyalakan pompa sesaat selama ~13 detik) hingga selang 5 meter terisi penuh cairan pekat dari ujung hisap hingga ujung buang sebelum mode batch otomatis diaktifkan.
  * **Asumsi Firmware ESP32:** Firmware mengasumsikan selang selalu dalam kondisi prima dan terisi penuh cairan (*fully primed*). Dengan demikian, pada setiap siklus batch, ESP32 hanya perlu mengeksekusi durasi injeksi bersih: tepat **51 detik** (476 mL pekatan). Hal ini mencegah terjadinya kelebihan dosis akibat injeksi priming yang tidak disengaja ke Drum 2.

## 7.2 Concentrate Flow Anomaly Guard
Karena motor stepper dan flow meter dihilangkan, verifikasi perpindahan cairan dilakukan melalui pembacaan sensor TDS pasca-pengadukan:
* Jika setelah injeksi konsentrat dan pengadukan selesai, nilai TDS di Drum 2 tidak mengalami kenaikan minimal $\Delta\text{TDS} \ge 150\text{ ppm}$ dari baseline air baku:
  $$\text{TDS}_{\text{actual}} - \text{TDS}_{\text{baseline}} < 150\text{ ppm}$$
* **Tindakan:** ESP32 mendeteksi anomali kritis (pompa DC menyala tetapi pekatan tidak berpindah akibat stok Drum 1 habis, selang lepas, atau selang terjepit). Sistem segera mengunci state ke `FAULT_EMPTY_CONCENTRATE_OR_CLOGGED` dan membunyikan alarm agar operator memeriksa stok Drum 1.

---

# 8. Open-Loop Empirical Feedforward & Interlock Gate Architecture

Sistem tidak menggunakan kontrol umpan balik adaptif (closed-loop PID/iteratif), melainkan mengadopsi arsitektur **Empirical Feedforward (Open-Loop) dengan Interlock Gate Validation**:

```text
┌────────────────────────────────────────────────────────────────────────┐
│ TAHAP 1: PENGISIAN AIR BERSIH                                          │
│ Solenoid valve air buka ──► Radar baca 140 L ──► Solenoid Valve TUTUP │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│ TAHAP 2: INJEKSI KONSENTRAT EMPIRIS (ONE-SHOT)                         │
│ ESP32 nyalakan Pompa Peristaltik DC selama t_run_dose (Target 476 mL)  │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│ TAHAP 3: HOMOGENISASI TOTAL                                            │
│ Submersible Pump ON selama 2 Menit ──► Jeda Tenang Stabilisasi 15 Detik│
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│ TAHAP 4: PENGUKURAN SENSOR TDS (CAP 2000 PPM)                           │
│ Ambil 10 sampel TDS stabil (Non-ATC, suhu alami kebun ~29-30°C)        │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│ TAHAP 5: EVALUASI INTERLOCK GATE (GERBANG KESELAMATAN)                 │
│ Apakah TDS berada di rentang 1200 – 1300 ppm?                            │
└───────────────────┬────────────────────────────────┬───────────────────┘
                    │                                │
                   YA                              TIDAK
                    │                                │
                    ▼                                ▼
       ┌────────────────────────┐       ┌────────────────────────┐
       │      BATCH LOCKED      │       │      HALT / FAULT      │
       │ READY FOR DISTRIBUTION │       │  PPM_OUT_OF_RANGE      │
       │ (Interlock Terbuka)    │       │ (Alarm & Cek Manual)   │
       └────────────────────────┘       └────────────────────────┘
```

* **Peran Sensor TDS sebagai Interlock Gate:** Sensor TDS (cap 2000 ppm) bukan pengatur loop dosis, melainkan **gerbang keselamatan satu arah**. Pompa distribusi dilarang keras menyala jika larutan belum lolos validasi gate ini (1200 – 1300 ppm).

---

# 9. Kebijakan Toleransi & Intervensi Manual

Pada arsitektur terbuka berbasis empiris ini:
* **Peniadaan Smart Dilution Otomatis:** Koreksi penambahan air otomatis (*smart dilution*) dan penambahan dosis otomatis ditiadakan.
* **Protokol Penanganan Deviasi:** Jika nilai TDS hasil pencampuran berada di luar rentang aman (< 1200 ppm atau > 1300 ppm):
  1. ESP32 segera mengunci seluruh aktuator pada kondisi mati (*safe stop*).
  2. Sistem beralih ke status `FAULT_PPM_OUT_OF_RANGE`.
  3. Menerbitkan alarm visual/audio di kebun dan notifikasi pada antarmuka web.
  4. Penanganan diserahkan sepenuhnya kepada operator kebun untuk melakukan inspeksi manual (misal memeriksa apakah air baku mengalami lonjakan mineral atau memeriksa kondisi fisik endapan Drum 1).

---

# 10. Radar Level Control & Batch Depletion Policy

Sistem memanfaatkan satu unit **Radar Level Sensor** presisi tinggi yang terpasang di atas Drum 2 untuk memantau level cairan secara non-invasif:

### 10.1 Empat Proteksi Utama Radar & Solenoid:
1. **Full Tank Cut-Off (140 L):** Solenoid pengisian air bersih otomatis diputus saat radar mendeteksi ketinggian cairan mencapai kapasitas kerja 140 L.
2. **Water Fill Watchdog Timeout (20 Menit):** Jika pengisian air bersih berlangsung > 20 menit dan level 140 L belum tercapai (indikasi air PAM/sumur mati atau pipa suplai tersumbat), solenoid air bersih diputus paksa dan sistem menerbitkan status `FAULT_WATER_FILL_TIMEOUT`.
3. **Proteksi Dry-Run Pompa Distribusi:** Pompa distribusi fertigasi dilarang menyala atau segera diputus paksa jika level cairan Drum 2 mencapai batas dasar aman (kritis rendah, sisa cairan < 5 L) guna melindungi impeller pompa dari kerusakan termal/kavitasi.
4. **Aturan Siklus Batch Murni (Batch Depletion Guard):**
   * Drum 2 dioperasikan murni per-batch.
   * **Sistem menolak keras perintah pengisian air atau pencampuran pupuk baru sebelum larutan batch saat ini benar-benar habis disalurkan** (dideteksi via radar pada level dasar kosong). Hal ini menjamin larutan tidak pernah tertumpuk atau tercampur silang antar-batch.

---

# 11. Fertigation State Machine (FSM)

Finite State Machine fisik deterministik pada ESP32:

```text
               ┌──────────────┐
               │     IDLE     │◄────────────────────────────────────────┐
               └──────┬───────┘                                         │
                      │ Web Command "Mulai Batch" & Tank Empty (Radar)  │
                      ▼                                                 │
               ┌──────────────┐                                         │
               │ FILLING_WATER│ (Buka Solenoid Valve Air Bersih)        │
               └──────┬───────┘                                         │
                      │ Radar membaca level 140 L tercapai              │
                      ▼                                                 │
               ┌──────────────┐                                         │
               │ CHECK_BASE   │ (Baca TDS Air Baku: wajib < 300 ppm)    │
               └──────┬───────┘                                         │
                      │ Baseline Valid                                  │
                      ▼                                                 │
               ┌──────────────┐                                         │
               │    DOSING    │ (Pompa Peristaltik DC ON: t_run_dose)   │
               └──────┬───────┘                                         │
                      │ Fixed timer selesai (Target 476 mL pekatan)     │
                      ▼                                                 │
               ┌──────────────┐                                         │
               │    MIXING    │ (Submersible Pump ON selama 2 Menit)    │
               └──────┬───────┘                                         │
                      │ T_mix 2 menit selesai                           │
                      ▼                                                 │
               ┌──────────────┐                                         │
               │  STABILIZING │ (Submersible OFF, Jeda Tenang 15 Detik) │
               └──────┬───────┘                                         │
                      │ T_stabilize 15 detik selesai                    │
                      ▼                                                 │
               ┌──────────────┐                                         │
               │ MEASURING_TDS│ (Baca Sensor TDS 2000 ppm: 10 sampel)    │
               └──────┬───────┘                                         │
                      │ Kestabilan terpenuhi (StdDev <= 5.0 ppm)        │
                      ▼                                                 │
               ┌──────────────┐          Di luar 1200-1300 ppm            │
               │GATE_EVALUATE ├─────────────────────────►[FAULT_HALT]   │
               └──────┬───────┘                          (Manual Cek)   │
                      │ TDS Valid (1200 – 1300 ppm)                       │
                      ▼                                                 │
               ┌──────────────┐                                         │
               │ BATCH_LOCKED │ (Komposisi Larutan Dikunci)             │
               └──────┬───────┘                                         │
                      │ Trigger Distribusi (Timer / Web Command)        │
                      ▼                                                 │
               ┌──────────────┐                                         │
               │ DISTRIBUTING │ (Pompa Distribusi ON 3 Menit ke B1-B6)   │
               └──────┬───────┘ (Diawasi Proteksi Radar Dry-Run)        │
                      │ Distribusi Selesai / Tangki Surut Habis         │
                      ▼                                                 │
               ┌──────────────┐                                         │
               │BATCH_DEPLETED│ (Tangki Kosong Terverifikasi Radar)     │
               └──────┬───────┘                                         │
                      └─────────────────────────────────────────────────┘
```

---

# 12. B1–B6 Zone Architecture (Concrete Field Mapping)

Sesuai kondisi aktual Greenhouse DESANOMI:
* **Fasilitas:** 1 Greenhouse.
* **Jumlah Titik Tanam:** 980 titik tanam.
* **Konfigurasi Bedeng:** 6 Bedeng (B1, B2, B3, B4, B5, B6).

### Konfigurasi Zona Operasional Default:
```text
┌────────────────────────────────────────────────────────┐
# 12. Pipa Distribusi Serentak & Skalabilitas 5 Drum

Sesuai kondisi aktual dan tata letak Greenhouse DESANOMI:
* **Fasilitas:** 1 Greenhouse.
* **Jumlah Titik Tanam:** 980 titik tanam pada 6 Bedeng (B1, B2, B3, B4, B5, B6).
* **Konfigurasi Pemipaan Distribusi (Direct Uniform Distribution):**
  Pompa distribusi terhubung langsung ke manifold utama yang mengalirkan larutan nutrisi ke **seluruh bedeng B1–B6 secara serentak dan merata**. Sistem **tidak menggunakan katup solenoid per zona** untuk membagi bedeng.
* **Visi Skalabilitas 5 Drum Distribusi (Future Architecture):**
  * Drum 1 (tangki stok pekat) dan Drum 2 (tangki pencampuran & distribusi) dalam dokumen ini merupakan **unit acuan dasar (prototype baseline)**.
  * Ke depannya, sistem akan dikembangkan dengan **5 unit Drum Distribusi** independen. Masing-masing drum distribusi akan memuat formulasi pupuk yang berbeda dan target PPM yang berbeda sesuai kebutuhan spesifik varietas atau fase tanaman.
  * Tahap saat ini fokus 100% pada pengujian dan pengoperasian andal 1 drum distribusi acuan ini.

---

# 13. Fertigation Distribution Execution & Completion

Proses penyaluran larutan nutrisi dari Drum 2 menuju seluruh bedeng tanaman diatur sebagai berikut:

## 13.1 Kriteria Penghentian Distribusi (Dual-Cutoff Criteria)
1. **Kriteria Primer Operasional: Durasi Timer 3 Menit (Sementara)**
   * Pompa distribusi menyala selama durasi baku **3 menit (180 detik)** untuk menyalurkan larutan nutrisi secara serentak ke seluruh titik tanam B1–B6.
   * *Catatan Masa Depan:* Penggunaan timer 3 menit ini bersifat sementara. Pada tahap berikutnya, pemicuan kapan dan berapa lama fertigasi dilakukan akan dikendalikan otomatis oleh **Sensor Kelembaban Tanah (Soil Moisture Sensors)** di bedeng.
2. **Kriteria Proteksi Keselamatan Fisik: Radar Dry-Run Cut-Off**
   * Selama pompa distribusi menyala, sensor radar memantau penurunan ketinggian cairan secara terus-menerus.
   * Jika level cairan Drum 2 menyentuh batas dasar aman (kritis rendah, sisa cairan < 5 L), pompa distribusi **diputus seketika secara paksa oleh ESP32** tanpa menunggu timer 3 menit habis. Hal ini menjamin impeller pompa distribusi terlindungi mutlak dari kerusakan kavitasi atau panas akibat bekerja kering (*dry-running*).

---

# 14. Manual Mode & Safety Bypass Semantics

* **Prinsip Dasar:** Manual mode melalui web dashboard hanya memindahkan inisiator awal perintah ke operator manusia.
* **Larangan Bypass Keselamatan Fisik:** Perintah manual untuk menyalakan pompa distribusi **tetap divalidasi oleh ESP32**. Perintah manual **ditolak mentah-mentah** jika:
  1. Sensor TDS Drum 2 belum berada pada rentang valid **1200 – 1300 ppm**, atau
  2. Sensor Radar mendeteksi volume air Drum 2 berada di bawah batas aman *dry-run* (< 5 L).
* **Mode Pemeliharaan Khusus (Maintenance Flush):**
  Pembersihan pipa hanya dapat dilakukan melalui jalur pembilasan air bersih langsung yang tidak melibatkan Drum 2 dan harus dikonfirmasi melalui otoritas administrator.

---

# 15. Core Data Model (Firmware & Backend)

### 15.1 Batch
```text
batch_id            : string unik (misal "BATCH-20260912-001")
recipe_id           : string ("RECIPE_STANDARD_600")
target_ppm          : integer (600)
tolerance_min       : integer (1200)
tolerance_max       : integer (1300)
target_water_l      : float (140.0)
baseline_tds_ppm    : float (TDS air baku terukur)
final_tds_ppm       : float (TDS akhir tervalidasi sensor 2000 ppm)
pipe_priming_sec    : integer (durasi pre-fill pipa kosong 5m: 13s / 130 mL)
dose_duration_sec   : integer (durasi injeksi dosis bersih: 51s untuk 476 mL)
dose_volume_est_ml  : float (476.0)
mixing_duration_sec : integer (default 120s)
status              : enum [FILLING, BASELINE_CHECK, PRIMING, DOSING, MIXING, STABILIZING, VALIDATING, READY, DISTRIBUTING, DEPLETED, FAULT]
created_at          : timestamp
completed_at        : timestamp
```

### 15.2 Dose Event
```text
dose_event_id       : integer incrementing
batch_id            : relasi ke Batch
is_pipe_primed      : boolean (apakah pipa 5m sudah terisi sebelum dosing)
pump_run_sec        : float (durasi aktual pompa menyala: 51s)
dose_volume_est_ml  : float (476.0)
tds_before_ppm      : float (TDS baseline sebelum injeksi)
tds_after_ppm       : float (TDS setelah injeksi dan mixing 2 menit)
tds_delta_ppm       : float (tds_after - tds_before)
timestamp           : timestamp
```

### 15.3 Fertigation Run
```text
run_id              : integer incrementing
batch_id            : relasi ke Batch
coverage            : string ("ALL_BEDS_B1_B6")
duration_target_sec : integer (180)
duration_actual_sec : integer (durasi riil pompa distribusi menyala)
cutoff_reason       : enum [TIMER_3MIN_COMPLETED, RADAR_DRY_RUN_TRIP, MANUAL_ABORT]
radar_level_end_cm  : float (ketinggian cairan akhir terdeteksi radar)
status              : enum [SUCCESS, HALTED_DRY_RUN, MANUAL_STOP]
```

---

# 16. Implementation Priority Roadmap (Phased Execution)

Pengembangan sistem fertigasi pintar diselaraskan dengan prioritas rekayasa terkini:

* **Fase 1 — Driver Aktuator & Sensor Dasar ESP32:**
  * Driver kontrol relay solenoid valve air bersih.
  * Driver kontrol relay/MOSFET pompa peristaltik DC (Drum 1).
  * Driver kontrol relay pompa submersible pengaduk (Drum 2).
  * Driver kontrol relay pompa distribusi fertigasi (B1–B6).
  * Driver pembacaan Radar Level Sensor (UART/Digital).
  * Driver pembacaan Sensor TDS & EC (Cap 2000 ppm).
* **Fase 2 — Kalibrasi Waktu & Level Radar:**
  * Kalibrasi debit pompa peristaltik DC untuk menetapkan durasi waktu fixed timer (`t_run_dose`) pengeluaran 476 mL pekatan.
  * Kalibrasi jarak radar untuk batas penuh 140 L (`CUTOFF_FULL_140L`) dan batas kering (`CUTOFF_DRYRUN_EMPTY`).
* **Fase 3 — Siklus FSM Batch & Validasi Interlock Gate TDS:**
  * Implementasi FSM siklus one-shot batch (Fill 140 L $\rightarrow$ Dose 476 mL $\rightarrow$ Mix 2 menit $\rightarrow$ Settle 15s $\rightarrow$ Read TDS).
  * Implementasi Interlock Gate (1200 – 1300 ppm) untuk membuka kunci pompa distribusi.
  * Penguncian aturan *Batch Depletion Guard* (tolak batch baru bila tangki belum kosong).
* **Fase 4 — Eksekusi Distribusi Serentak B1–B6:**
  * Kontrol pompa distribusi 3 menit serentak ke 980 titik tanam.
  * Pengujian respons pemutusan seketika saat radar mendeteksi level kering (*dry-run trip*).
* **Fase 5 — Observabilitas & Antarmuka Web:**
  * Dashboard pemantauan status batch, live TDS cap 2000 ppm, ketinggian level radar, dan status aktuator.
  * Tombol pemicu inisiasi batch manual dan tombol darurat.
* **Fase 6 — Rekalibrasi Supernatan & Integrasi Sensor Tanah (Masa Depan):**
  * Rekalibrasi durasi pompa konsentrat setelah uji dosis supernatan jernih (20 L + 2 kg diendapkan) selesai.
  * Integrasi data kelembaban tanah sebagai pemicu otomatis penyiraman menggantikan timer 3 menit.
* **Fase 7 — Replikasi Skalabilitas 5 Drum Distribusi (Masa Depan):**
  * Perluasan arsitektur pengendali untuk mengelola 5 drum distribusi pupuk independen.

---

# 17. Aturan Emas Rekayasa (Engineering Golden Rules)

1. **Rule 1 — Nilai Empiris Sebagai Acuan Mutlak:** Seluruh volume injeksi pekatan dan perhitungan dosis didasarkan pada data empiris riil lapangan (`Uji_dosis.md`), bukan asumsi teoritis ideal.
2. **Rule 2 — Gerbang Keselamatan TDS 2000 ppm (Interlock Gate):** Pompa distribusi dilarang keras menyala jika pembacaan TDS Drum 2 berada di luar rentang aman **1200 – 1300 ppm**, tanpa perkecualian.
3. **Rule 3 — Aturan Siklus Batch Murni:** Sistem dilarang memulai pengisian air atau injeksi nutrisi baru sebelum seluruh volume batch saat ini habis disalurkan ke tanaman (terverifikasi via radar).
4. **Rule 4 — Proteksi Dry-Run Radar Mengalahkan Timer:** Pompa distribusi wajib diputus seketika oleh sensor level radar jika cairan mencapai batas dasar (< 5 L), meskipun timer 3 menit belum selesai.
5. **Rule 5 — Distribusi Serentak Merata:** Seluruh 980 titik tanam di Bedeng B1–B6 menerima nutrisi secara bersamaan tanpa pembagian katup zona.
6. **Rule 6 — Kegagalan Aman Tanpa Tebakan (Fail-Safe Default):** Jika terjadi deviasi TDS di luar 1200–1300 ppm, stok pekatan kosong, atau anomali sensor, sistem wajib mengunci ke kondisi `HALT` untuk inspeksi manual operator dan tidak melakukan tindakan koreksi liar otomatis.
