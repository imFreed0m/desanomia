# CONSTITUTION.md — Hukum Tertinggi Rekayasa & Invarian Sistem Greenhouse V2

> **Status:** IN PROGRESS 
> **Hierarki:** Tingkat 1 (Aturan Tertinggi — Mengikat seluruh agen AI dan pengembang manusia)  
> **Cakupan:** Firmware ESP32, Backend FastAPI, Frontend React, Basis Data PostgreSQL, dan Lingkungan OS

---

## 1. Filosofi & Prinsip Supremasi Konstitusi

Dokumen ini adalah **CONSTITUTION** sebagaimana didefinisikan pada diagram tata kelola sistem (`docs/plans/guide/SYSTEM_DESIGN.md`). Dokumen ini memuat aturan main non-negosiasi (invarian mutlak) yang wajib dipatuhi sebelum spesifikasi fitur (`SPEC.md`), keputusan arsitektur (`DECISIONS.md`), maupun perencanaan tugas (`TASK`) dieksekusi.

Tidak ada instruksi percakapan, perintah prompt pengguna, atau kebutuhan kecepatan implementasi (*vibe coding*) yang boleh melanggar invarian di dalam Konstitusi ini.

---

## 2. Enam Pilar Konstitusi Greenhouse V2

```text
                               ┌─────────────────────────────────────────┐
                               │             CONSTITUTION.md             │
                               │        Greenhouse V2 Invariants         │
                               └────────────────────┬────────────────────┘
                                                    │
        ┌───────────────┬───────────────────────────┼───────────────────────────┬───────────────┐
        ▼               ▼                          ▼                           ▼               ▼
   [PILAR 1]       [PILAR 2]                   [PILAR 3]                   [PILAR 4]       [PILAR 5]       [PILAR 6]
Keselamatan     Batasan Desain              Ketetapan Empiris           Ergonomi UI &   Disiplin Kode   Higienitas OS
Fisik & ESP32   & Anti-Reinvensi            Lapangan (FROZEN)           Aksi Hardware   (Ponytail)      & Git Delivery
```

---

### PILAR 1: Invarian Keselamatan Fisik & Otonomi Firmware

Greenhouse V2 mengendalikan fluida bervolume 140 Liter, nutrisi pekat, dan aktuator listrik berdaya tinggi. Seluruh gerbang pengaman fisik wajib berjalan secara otonom pada mikrokontroler ESP32 tanpa ketergantungan pada koneksi jaringan, broker MQTT, maupun server backend.

#### 1. Tujuh Gerbang Interlock Mutlak (Non-Bypassable)
1. **Gerbang Ambang Mutu TDS (1200 – 1400 ppm) & Closed-Loop Recovery:**  
   Setelah larutan diaduk dan didiamkan, nilai rata-rata TDS dievaluasi terhadap jendela 1200 hingga 1300 ppm. Jika TDS < 1200 ppm, sistem mengizinkan maksimal 1 (satu) kali penyesuaian dosis otomatis (*Single-Pass Top-Up Recovery*) dengan kuota maksimal 300 mL berdasarkan kalkulasi volume empiris. Jika setelah penyesuaian nilai TDS tetap berada di luar 1200–1300 ppm, atau jika nilai TDS awal terdeteksi > 1300 ppm, relai pompa distribusi dikunci mati (*locked off*) dan sistem langsung masuk ke status kegagalan `FAULT_PPM_OUT_OF_RANGE`.
2. **Pemutus Darurat Berjalan Kering / Dry-Run Cutoff (< 5.0 Liter):**  
   Selama proses penyiraman berlangsung, sensor level radar pada Drum 2 dipantau secara kontinu. Jika volume cairan turun di bawah 5.0 Liter, pompa distribusi wajib dimatikan seketika untuk mencegah kerusakan mekanik motor pompa.
3. **Aturan Pengosongan Tangki / Batch Depletion Rule (≤ 5.0 Liter):**  
   Perintah memulai siklus fertigasi baru wajib ditolak apabila sensor level radar Drum 2 mendeteksi volume cairan lebih besar dari 5.0 Liter (`DRUM_EMPTY_THRESHOLD_L = 5.0 L`). Siklus baru hanya diizinkan berjalan jika tangki telah terkuras tuntas guna mencegah penumpukan garam mineral dan kontaminasi silang.
4. **Dual-Stage Fill Guard Pengisian Air Bersih:**  
   Pengisian air bersih dikawal oleh dua lapis proteksi:
   * **Deteksi Dini Aliran Kosong (Dry Supply Early Trip):** Jika dalam 90 detik pertama pengisian kenaikan level air Drum 2 kurang dari 1.0 Liter, katup solenoid ditutup seketika dan FSM masuk status `FAULT_NO_WATER_SUPPLY` untuk mencegah koil solenoid terbakar.
   * **Watchdog Waktu Pengisian Absolut (1200 detik / 20 menit):** Apabila dalam 20 menit sensor radar belum mendeteksi volume target 140.0 Liter, katup solenoid wajib ditutup paksa dan sistem masuk status `FAULT_FILL_TIMEOUT`. Jika gangguan pasokan air teratasi, sistem mengizinkan perintah `Resume Fill` untuk melanjutkan sisa liter ke 140 L.
5. **Pemeriksaan Kualitas & Plausibilitas Air Baku Bersih (50 – 350 ppm):**  
   Sebelum konsentrat pupuk diinjeksikan, sensor TDS membaca konduktivitas air bersih di Drum 2 (`CHECK_BASE`). Rentang nilai air baku yang valid adalah **50 ppm ≤ TDS < 350 ppm**. Jika TDS < 50 ppm (indikasi sensor putus/lepas) atau TDS > 2000 ppm (kabel konslet/jenuh), FSM membatalkan siklus seketika dengan status `FAULT_TDS_INVALID`. Jika TDS ≥ 350 ppm, seluruh siklus dibatalkan dengan status `FAULT_BASE_TDS_HIGH`.
6. **Radar Liveness Watchdog (3 detik):**  
   Jika frame data UART sensor level radar terputus atau tidak diterima selama > 3 detik saat aktuator aktif (pengisian atau distribusi), seluruh aktuator dimatikan seketika dan FSM beralih ke status kegagalan `FAULT_RADAR_OFFLINE`.
7. **Kunci Pemutus Darurat (Emergency Stop / FAULT_ESTOP):**  
   Pemicuan tombol E-Stop (baik sakelar fisik jamur NC maupun perintah darurat antarmuka) seketika mematikan seluruh 4 relai ke level LOW dan mengunci FSM pada status `FAULT_ESTOP` hingga di-reset secara sadar oleh operator.

#### 2. Kriteria Stabilitas Pengukuran TDS
* Pembacaan sensor TDS wajib mengambil 10 sampel beruntun setelah periode penenangan (*stabilizing*).
* Setiap nilai sampel dibatasi maksimal pada batas sensor 2000 ppm.
* Gerbang evaluasi kelolosan hanya memproses data jika standar deviasi bernilai ≤ 5.0 ppm. Jika standar deviasi > 5.0 ppm, sistem wajib beralih ke status kegagalan `FAULT_TDS_UNSTABLE`.

#### 3. Penegakan Interlock pada Mode Manual
* Mode manual hanya untuk pengujian dan pemeliharaan teknis aktuator tunggal.
* Pengaktifan mode manual tidak boleh menjalankan rangkaian FSM otomatis.
* Seluruh interlock keselamatan tetap aktif 100% dan memblokir aktivasi relai jika batas keselamatan dilanggar (misalnya pompa distribusi dilarang menyala jika TDS di luar 1200–1300 ppm).

#### 4. Pengurasan Fisik Mandiri & Gated Fault Reset
* Pengurasan cairan gagal batch pada Drum 2 wajib dilakukan melalui kran drain manual gravitasi di dasar drum menuju saluran pembuangan limbah; dilarang keras membypass pompa distribusi ke bedeng.
* Tombol `Reset Fault` pada dashboard terkunci (*disabled*) hingga sensor radar mengonfirmasi volume tangki telah terkuras tuntas (≤ 5.0 Liter).

#### 5. Otonomi Penuh Lokal (Edge Autonomy) & Tiga Lapis Notifikasi Offline
* Eksekusi FSM, pemantauan interlock, dan jadwal rutin fertigasi berjalan 100% otonom di edge lokal (Beelink EQ12 & ESP32) tanpa ketergantungan pada koneksi internet atau cloud.
* Jika terjadi kegagalan (*FAULT*) saat koneksi internet terputus, sistem wajib menegakkan 3 (tiga) lapis notifikasi:
  1. **Lapis Fisik:** Buzzer alarm audio intermiten dan lampu pilot merah aktif di pintu panel box IP65.
  2. **Lapis Visual Kiosk:** Banner merah berkedip dengan detail kesalahan tampil pada Kiosk 15.6" dan TV Gazebo via LAN lokal.
  3. **Lapis Asinkronus (Store-and-Forward):** Log kesalahan disimpan di antrean persisten lokal (`offline_alert_queue`) dan otomatis disinkronkan ke Telegram segera setelah internet pulih dengan stempel waktu asli.

---

### PILAR 2: Batasan Desain & Larangan Re-Invensi (Eliminated Architecture & Boundaries)

Berdasarkan `docs/SPEC.md` Pasal 7 dan Pasal 11, komponen berikut telah dievaluasi dan resmi dibuang. Dilarang keras mengintroduksi kembali komponen atau pola arsitektur berikut:

#### 1. Komponen Tereliminasi (Eliminated Components)
* **Larangan Motor Stepper & Driver:** Dosing konsentrat pupuk dibakukan menggunakan Pompa Peristaltik DC 12V berbasis laju alir analitis terkalibrasi. Dilarang mengusulkan atau menambahkan driver stepper motor.
* **Larangan Dual Flow Meter:** Deteksi cairan dipusatkan pada satu Sensor Level Radar di Drum 2. Dilarang memasang sensor water flow turbin / pulsa air.
* **Larangan Sensor Suhu DS18B20 & Algoritma ATC:** Suhu operasional greenhouse stabil pada rentang 29 °C hingga 30 °C. Algoritma kompensasi suhu otomatis (*Automatic Temperature Compensation*) resmi dieliminasi.
* **Larangan Manifold Solenoid Valve Per-Zona:** Distribusi nutrisi dialirkan serentak ke seluruh 6 bedeng (B1–B6) melalui satu jalur pipa utama dengan satu pompa distribusi. Dilarang membangun kendali valve per zona.

#### 2. Batasan Ruang Lingkup (Scope & Controlled Dosing)
* **Dosing Umpan Balik Terkendali (Controlled Closed-Loop Feedback Dosing):** Arsitektur sistem mengadopsi prinsip *Closed-Loop Feedback Dosing* dengan formula analitis volume (mL) dari data empiris `docs/empirical/Uji_dosis.md`. Penyesuaian dosis otomatis (*top-up*) diizinkan secara ketat maksimal 1 (satu) kali per batch dengan batas atas penambahan 300 mL untuk mencegah terjadinya osilasi/perburuan nilai (*hunting*) dan risiko pemupukan berlebih.
* **Larangan Modul Pertanian Kompleks:** Dilarang menambahkan modul pencatatan varietas tanaman, jadwal panen, atau algoritma prediksi cuaca pada repositori ini.
* **Larangan Aplikasi Native Mobile:** Antarmuka pengguna dipusatkan pada web dashboard responsif. Dilarang membuat proyek aplikasi native Android/iOS terpisah.

---

### PILAR 3: Ketetapan Empiris Terkunci (Frozen Empirical Constants)

Seluruh angka operasional berikut bersumber dari `docs/SPEC.md` Pasal 5 dan berstatus **FROZEN**. Angka ini dilarang diubah tanpa bukti pengujian empiris baru:

| Parameter | Nilai Baku | Satuan | Deskripsi Operasional |
|---|---|---|---|
| `TARGET_WATER_VOLUME_L` | 140.0 | L | Target pengisian air bersih Drum 2 |
| `TARGET_TDS_PPM` | 1250 | ppm | Titik tengah toleransi nutrisi |
| `TDS_TOLERANCE_MIN` | 1200 | ppm | Batas bawah gerbang kelolosan distribusi |
| `TDS_TOLERANCE_MAX` | 1300 | ppm | Batas atas gerbang kelolosan distribusi |
| `TDS_SENSOR_CAP` | 2000 | ppm | Batas potong nilai maksimal sensor TDS |
| `TDS_PLAUSIBILITY_MIN_PPM` | 50 | ppm | Batas bawah pembacaan air baku valid (anti sensor putus) |
| `WATER_BASELINE_MAX_PPM` | 350 | ppm | Batas maksimal kontaminasi air baku bersih |
| `TARGET_CONCENTRATE_DOSE_ML` | ~1378–1440 | mL | Target analitis volume injeksi konsentrat 1250 ppm di 140 L |
| `DOSE_PUMP_RUN_DURATION_SEC` | ~147–154 | detik | Durasi kerja pompa peristaltik (dihitung: $V_{mL} \times 0.107\text{ s/mL}$) |
| `DOSE_PUMP_FLOW_RATE` | 107 | detik/L | Laju alir terkalibrasi pompa peristaltik (~9.35 mL/detik) |
| `MAX_RECOVERY_TOPUP_ML` | 300 | mL | Batas atas volume penambahan konsentrat saat recovery |
| `MAX_TOPUP_ATTEMPTS` | 1 | kali | Batas maksimal percobaan top-up tertutup per batch |
| `PIPE_PRIMING_DURATION_SEC` | 13 | detik | Durasi priming manual pipa konsentrat 5m |
| `MIXING_DURATION_SEC` | 120 | detik | Durasi pengadukan mixer submersible Drum 2 |
| `STABILIZE_DELAY_SEC` | 15 | detik | Periode tenang cairan sebelum pembacaan TDS |
| `TDS_SAMPLE_COUNT` | 10 | sampel | Jumlah sampel pengukuran sensor analog TDS |
| `TDS_MAX_STDDEV` | 5.0 | ppm | Batas maksimal standar deviasi sampel TDS |
| `DISTRIBUTION_WATCHDOG_SEC` | 240 | detik | Watchdog pengaman maksimal pompa distribusi (pemutus utama: level ≤ 5.0 L) |
| `DRUM1_CAPACITY_L` | 20.0 | L | Kapasitas jerigen stok pupuk pekat Drum 1 |
| `DRUM1_BATCH_CAPACITY` | 14 | batch | Estimasi jumlah batch per isi ulang Drum 1 (~1.4 L per batch) |
| `DRUM1_LOW_STOCK_THRESHOLD` | 2 | batch | Ambang peringatan stok menipis Drum 1 untuk operator |
| `EARLY_FILL_CHECK_SEC` | 90 | detik | Jendela evaluasi deteksi dini aliran air masuk |
| `EARLY_FILL_MIN_RISE_L` | 1.0 | L | Kenaikan volume minimum Drum 2 dalam 90 detik |
| `WATER_FILL_WATCHDOG_SEC` | 1200 | detik | Batas waktu watchdog pengisian air absolut (20 menit) |
| `DRY_RUN_CUTOFF_L` | 5.0 | L | Ambang radar pemutus darurat pompa & pemicu sukses distribusi |
| `DRUM_EMPTY_THRESHOLD_L` | 5.0 | L | Ambang radar konfirmasi tangki terkuras tuntas |
| `RADAR_LIVENESS_TIMEOUT_SEC` | 3 | detik | Batas toleransi terputusnya komunikasi UART radar |

---

### PILAR 4: Invarian Interaksi Antarmuka & Kontrol Hardware (UI Safety)

Berdasarkan `docs/DECISIONS.md` (ADR 0001) dan `frontend/plan/AUDIT-1-CRITICAL-SAFETY-AND-A11Y.md`:

#### 1. Penerapan Pessimistic UI pada Aksi Perangkat Keras (Zero Double-Dispatch)
Setiap elemen tombol yang memicu aksi fisik ke mikrokontroler (Mulai Batch, Reset Fault, sakelar aktuator, Emergency Stop) wajib menerapkan *Pessimistic UI*:
* Tombol wajib langsung beralih ke status nonaktif (*disabled*) dan menampilkan indikator *pending/loading* segera setelah diklik.
* Tombol dilarang menerima klik beruntun sebelum status pemrosesan dikonfirmasi oleh backend/MQTT.
* Dilarang menggunakan pola *Optimistic UI* pada mutasi perangkat keras fisik.

#### 2. Ergonomi Emergency Stop & Aksesibilitas (WCAG 2.2 AA)
* **Dual Emergency Stop Architecture:**
  * **Layar Kiosk Operator (Touchscreen 15.6"):** Beroperasi 100% lokal offline di jaringan Mini PC Beelink EQ12 via HDMI & LAN tanpa ketergantungan internet (tetap aktif meski paket internet Orbit Star H2 habis). Tombol E-Stop di Kiosk bersifat 1-tap instan (ukuran minimal 56 × 56 piksel) tanpa jeda popup konfirmasi agar pemutusan daya aktuator berlangsung secepat mungkin.
  * **Antarmuka Remote Ponsel (via Internet):** Wajib menyematkan dialog konfirmasi penghentian darurat dengan atribut `aria-modal="true"`, `role="dialog"`, dan penguncian fokus navigasi keyboard (*focus trapping*) guna mencegah pemicuan tak disengaja dari jarak jauh. Ukuran tombol sentuh minimal 48 × 48 piksel (SC 2.5.8).
  * **Sakelar Fisik E-Stop Panel (Hardwired NC Push-Button):** Tombol jamur fisik *twist-to-reset* dengan kontak Normally Closed (NC) wajib terpasang pada pintu panel utama, memutus langsung jalur suplai daya koil relai aktuator secara mekanis sebagai failsafe independen jika kontroler/OS mengalami freeze.

#### 3. Komposisi Atomic Design & Agnostik Spasial
* Komponen atomik (`frontend/src/components/ui/`) dikawal oleh linter `@shadcn/lint` dengan aturan `no-restyle: error`.
* Seluruh komponen kartu metrik sensor dan aktuator (`frontend/src/components/fertigation/`) dilarang menanamkan margin luar (*outer margin*). Tata letak spasial sepenuhnya diatur oleh kontainer pembungkus (*flex/grid gap*).

#### 4. Penanganan Wajib Empat Status Data Sensor
Setiap tampilan metrik sensor telemetri (baik sensor fertigasi Drum 2 maupun sensor lingkungan dalam/luar) wajib menyediakan state visual untuk 4 kondisi:
* **Normal:** Aliran data live aktif dan stabil.
* **Stale:** Tidak ada pembaruan data selama > 30 detik (indikator amber/kuning).
* **Offline:** Koneksi data terputus > 60 detik (indikator merah redup dan tombol rekoneksi).
* **Saturation / Cap:** Pembacaan sensor menyentuh batas ukur fisik maksimal (2000 ppm TDS).

#### 5. Mandat Desain Mobile-First & Bebas AI Slop (Zero-Slop Cockpit)
* **Mobile-First Real World Usability:** Antarmuka dirancang khusus untuk kenyamanan pengoperasian satu tangan di lapangan melalui perangkat ponsel cerdas (viewport seluler `max-w-md` responsif).
* **Eliminasi AI Slop & Ornamen Berat:** Dilarang menanamkan komponen kosmetik yang memperberat komputasi GPU ponsel (seperti background partikel animasi, kanvas simulasi dot-matrix kaku, atau efek bayangan bertumpuk). Seluruh kartu wajib menggunakan tata letak Bento Grid berdensitas seimbang, berbatas garis 1px (*hairline borders*), dan tipografi yang jelas (*tabular numerals* untuk telemetri).

#### 6. Hierarki Fokus Sistem Fertigasi (Primary Core vs Decision Support)
* **Fokus Primer:** Seluruh ruang pandang utama dashboard diprioritaskan untuk kepastian siklus fertigasi: Progres FSM, Volume Tandon Kerja 140L, dan Gerbang Kualitas TDS (1200–1300 ppm).
* **Pendukung Keputusan (Decision Support):** Metrik lingkungan dalam greenhouse (suhu, kelembapan udara, cahaya, kelembapan tanah rata-rata) dan cuaca luar (Open-Meteo API) diposisikan sebagai layer pendukung keputusan operasional sebelum memicu batch baru, bukan untuk mengaburkan alur keselamatan fertigasi.

#### 7. Kran Pembuangan Gravitasi Manual & Gated UI Reset
* **Pencegahan Keracunan Tanaman:** Pompa distribusi dilarang keras dinyalakan untuk menguras tangki yang gagal uji TDS guna melindungi 980 titik tanam dari keracunan konsentrasi tinggi. Drum 2 wajib dikuras melalui kran manual gravitasi di dasar drum langsung ke parit limbah.
* **Gated Reset Fault:** Tombol `Reset Fault` pada dashboard terkunci (*disabled*) dan menampilkan instruksi kuras selama sensor radar membaca volume Drum 2 > 5.0 Liter. Tombol hanya dapat ditekan jika radar mengonfirmasi tangki telah kosong (≤ 5.0 L).
