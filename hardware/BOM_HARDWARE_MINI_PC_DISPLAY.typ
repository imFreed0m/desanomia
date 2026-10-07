#set page(
  paper: "a4",
  margin: (top: 2.0cm, bottom: 2.0cm, left: 1.8cm, right: 1.8cm),
  header: context {
    if here().page() > 1 [
      #grid(
        columns: (1fr, auto),
        align: (left, right),
        text(8pt, fill: rgb(100, 116, 139))[*Greenhouse V2 DESANOMI* · BOM Mini PC & HMI Touchscreen],
        text(8pt, fill: rgb(14, 116, 144))[*Status: LOCKED IN*]
      )
      #v(2pt)
      #line(length: 100%, stroke: 0.5pt + rgb(203, 213, 225))
    ]
  },
  footer: context [
    #line(length: 100%, stroke: 0.5pt + rgb(203, 213, 225))
    #v(2pt)
    #grid(
      columns: (1fr, auto),
      align: (left, right),
      text(8pt, fill: rgb(100, 116, 139))[Sistem Otomasi Fertigasi Presisi DESANOMI],
      text(8pt, fill: rgb(100, 116, 139))[Halaman #here().page() dari #counter(page).final().at(0)]
    )
  ]
)

#set text(
  font: ("Liberation Sans", "DejaVu Sans"),
  size: 8.5pt,
  lang: "id",
  fill: rgb(30, 41, 59)
)

#set par(justify: true, leading: 0.58em)

#show heading.where(level: 1): it => block(above: 1.1em, below: 0.9em)[
  #text(15pt, weight: "bold", fill: rgb(15, 23, 42))[#it.body]
  #v(2pt)
  #line(length: 100%, stroke: 2pt + rgb(2, 132, 199))
]

#show heading.where(level: 2): it => block(above: 1.2em, below: 0.6em)[
  #text(11pt, weight: "bold", fill: rgb(3, 105, 161))[#it.body]
]

#show heading.where(level: 3): it => block(above: 1.0em, below: 0.45em)[
  #text(9.5pt, weight: "bold", fill: rgb(15, 118, 110))[#it.body]
]

#show heading.where(level: 4): it => block(above: 0.8em, below: 0.35em)[
  #text(8.5pt, weight: "bold", fill: rgb(51, 65, 85))[#it.body]
]

#show raw.where(block: true): it => block(
  fill: rgb(248, 250, 252),
  inset: 6pt,
  radius: 4pt,
  stroke: 0.5pt + rgb(203, 213, 225),
  width: 100%,
)[
  #set text(size: 6.4pt, font: "DejaVu Sans Mono", fill: rgb(15, 23, 42))
  #it
]

#show raw.where(block: false): it => box(
  fill: rgb(241, 245, 249),
  inset: (x: 2.5pt, y: 1pt),
  radius: 2.5pt,
  baseline: 0%
)[
  #set text(size: 7.5pt, font: "DejaVu Sans Mono", fill: rgb(3, 105, 161))
  #it
]

#set table(
  stroke: (x, y) => if y == 0 { (bottom: 1.5pt + rgb(2, 132, 199)) } else { 0.5pt + rgb(226, 232, 240) },
  fill: (col, row) => if row == 0 { rgb(240, 249, 255) } else if calc.even(row) { rgb(248, 250, 252) } else { none },
  inset: (x: 4.5pt, y: 3.5pt)
)

= BILL OF MATERIALS (BOM) & SPESIFIKASI PENGADAAN PERANGKAT

== Server Edge Mini PC x86 & Sistem HMI Touchscreen Greenhouse V2

_Dokumen ini merupakan panduan spesifikasi teknis defensibel dan estimasi anggaran pengadaan perangkat keras server edge, proteksi kelistrikan, dan HMI cockpit untuk Sistem Otomasi Fertigasi Greenhouse DESANOMI._


#v(3pt)
#line(length: 100%, stroke: 0.5pt + rgb(203, 213, 225))
#v(3pt)


== 1. Ringkasan Arsitektur & Keputusan Desain

Berdasarkan tinjauan rekayasa sistem (`docs/CONSTITUTION.md` & `docs/DECISIONS.md` ADR 0005):
+ *Batas Arsitektur & Supremasi Kontroler (Boundary Invariant):*  
  - *ESP32 Controller* tetap menjadi pemegang otoritas tertinggi dan mandiri (_autonomous deterministic controller_) untuk keselamatan fisik (Pilar 1 Konstitusi). Seluruh logika FSM 10-tahap, kalibrasi sensor, timer dosis, dan 5 gerbang interlock fisik berjalan independen di firmware ESP32.
  - *Mini PC x86* hanya bertindak sebagai _Edge Gateway, Data Logger, Application Server, dan Operator HMI_.
  - *Aliran Data:* `ESP32 ──(MQTT)──> Backend FastAPI ──> PostgreSQL/Timescale ──> Dashboard Web`. Frontend tidak pernah membaca atau menulis langsung ke MQTT/ESP32 tanpa validasi backend.
+ *Platform Komputasi Edge:*  
Menggunakan *Mini PC x86_64 Beelink EQ12 (Intel Alder Lake-N N100)* dengan performa dan _reliability_ yang memadai untuk operasi edge 24/7 pada lingkungan panel yang terkontrol (bukan _industrial PC_ bersertifikasi ekstrem, namun merupakan opsi paling rasional dan _defensible_ untuk skala proyek ini).
+ *Integritas Storage & Kebijakan Retensi Data:*  
Menggunakan SSD NVMe 500GB bawaan dengan sistem berkas Linux `ext4` ber-journaling untuk meningkatkan _filesystem consistency_ dan pemulihan cepat setelah _unexpected shutdown_.
_Kebijakan Retensi Data (Retention Policy):_
  - _Raw telemetry (1s–5s interval):_ Disimpan selama *1 tahun*.
  - _Aggregated metrics (5-minute average):_ Disimpan selama *3 tahun*.
  - _Daily summary & production logs:_ Disimpan *permanen (indefinitely)*.
  - _System & Docker container logs:_ Rotasi otomatis *30–90 hari* (max 5 GB).
+ *Otonomi Daya & Pemulihan Layanan:*  
Motherboard dikonfigurasi melalui BIOS UEFI dengan fitur `Restore on AC Power Loss: Power On`*.*
_Kriteria Penerimaan (Acceptance Criterion):_ *Server secara otomatis menyala dan memulihkan seluruh layanan Docker (MQTT, PostgreSQL, FastAPI, Nginx, Kiosk) ke status operasional normal tanpa intervensi manusia setelah pasokan daya AC kembali.*
+ *Proteksi Kelistrikan Efisien (Zero Redundancy):*  
Memanfaatkan MCB hulu yang sudah terpasang pada jalur PLN, kabel daya langsung dihubungkan ke *Digital DIN Rail VA-Protector 40A Auto-Recovery*. Alat ini bertindak sebagai gerbang proteksi voltase anjlok (\<175V), voltase lonjak (\>260V), pembatas arus lebih (10A), serta sakelar manual (_power switch_). Seluruh sistem proteksi berlebihan (MCB bertingkat, RCBO ganda, SPD tanpa arde terukur, dan UPS) dieliminasi untuk efisiensi biaya dan keandalan maksimal tanpa tumpang-tindih.
+ *Segmentasi Jaringan Dual NIC & Batasan Firewall:*  
  - `NIC 1 (enp1s0)`: Terhubung ke Switch IoT privat (ESP32 node subnet terisolasi).
  - `NIC 2 (enp2s0)`: Terhubung ke Management Router / Uplink Internet publik via Tailscale VPN.
  - _Firewall Invariant:_ Mini PC *TIDAK dikonfigurasi sebagai router/bridge terbuka* antara kedua subnet, mencegah jaringan IoT menjadi pintu masuk intrusi ke jaringan manajemen/internet.
+ *Spesifikasi HMI Operator:*  
Menggunakan *Touchscreen 18.5" WUXGA (1920×1200) IPS PCAP (16:10, 120Hz)* sebagai _Primary HMI_ terpasang pada pintu panel (_Door-Mounted Kiosk_). Ukuran 18.5" WUXGA memberikan ruang vertikal ekstra (+120px dibanding FHD 1080p standar), mengakomodasi visualisasi menyeluruh: monitoring 5 tandon pekatan pupuk, 5 jalur distribusi, 5 nilai target PPM, kendali manual aktuator, resep fertigasi, grafik riwayat real-time, dan alarm tanpa ketergantungan navigasi scrolling yang sempit.


#v(3pt)
#line(length: 100%, stroke: 0.5pt + rgb(203, 213, 225))
#v(3pt)


== 2. Bagian A: Komponen Inti Server Edge & Proteksi Panel

Semua komponen berikut dipilih berdasarkan efisiensi fungsional nyata tanpa redundansi:


#table(
  columns: (22pt, 1.3fr, 1.4fr, 2.3fr, 1.1fr, 2fr),
  align: (col, row) => if row == 0 { center + horizon } else { left + horizon },
  [ *No* ],
  [ *Komponen* ],
  [ *Rekomendasi Merek & Model* ],
  [ *Spesifikasi Teknis* ],
  [ *Estimasi Harga* ],
  [ *Status Pengadaan & Catatan Kritis* ],
  [ *1* ],
  [ *Unit Server Edge (Mini PC)* ],
  [ *Beelink EQ12 (Intel N100)* ],
  [ Intel 12th Gen Alder Lake-N N100 (4-Core up to 3.4 GHz), *16GB DDR5 4800MHz*, *500GB NVMe SSD*, GPU Intel UHD 24 EUs, Dual 2.5G LAN, WiFi 6, BT 5.2 ],
  [ Rp 4.099.000 ],
  [ *LOCKED IN.* Unit Utama. Sudah termasuk Casing ABS/Aluminium, Heatsink Tembaga + Fan Ganda, Braket Dinding Logam, Kabel HDMI 1M, dan Adaptor 12V 3A OEM. ],
  [ *2* ],
  [ *Pengaman Tegangan & Arus Digital* ],
  [ *Digital DIN Rail VA-Protector (40A)* ],
  [ Proteksi Over-Voltage (260V), Under-Voltage (175V), Over-Current (10A), Auto-Recovery Timer (30s), Display Dual LED V/A, Tombol Power Manual ],
  [ Rp 90.000 ],
  [ *LOCKED IN.* Mengawal Mini PC, monitor HMI, dan pompa dari fluktuasi PLN pedesaan. Terhubung langsung dari jalur kabel sumber PLN ber-MCB. ],
  [ *3* ],
  [ *Stopkontak Rel DIN 220V (Dual Slot / Ganda)* ],
  [ *Fort / Schneider / Chint DIN Rail AC Socket (2 Unit / 2-Gang)* ],
  [ Stopkontak 2-lubang standar EU/Indonesia (2 unit sejajar di rel DIN 35mm), rating 16A 250V AC ],
  [ Rp 50.000 – Rp 65.000 ],
  [ *Wajib 2 Lubang AC:* Slot 1 untuk Adaptor 12V 3A Beelink, Slot 2 untuk Adaptor Fast Charging PD 20W/30W Layar Touchscreen 18.5". Terlindungi penuh di hilir VA-Protector. ],
  [ *4* ],
  [ *Kabel Jaringan Panel* ],
  [ *Vention / UGREEN Cat6 UTP (0.5 – 1 meter)* ],
  [ Tembaga murni 24AWG, RJ45 shielded, Gigabit/2.5G Ready ],
  [ Rp 20.000 – Rp 30.000 ],
  [ Menghubungkan port LAN 1 (2.5G) Beelink ke switch lokal fertigasi ESP32. ],
  [ *5* ],
  [ *Kabel Listrik Internal Panel* ],
  [ *Kabel NYAF 1.5 mm² (Potongan 2 meter)* ],
  [ Tembaga serabut fleksibel (Cokelat Fasa & Biru Netral) ],
  [ Rp 15.000 ],
  [ Jumper dari terminal `OUT` VA-Protector ke Stopkontak DIN Ganda. ],
  [ *6* ],
  [ *Braket, Baut, Spacer & Manajemen Kabel Pintu* ],
  [ *Wall-Bracket Beelink + 2x Baut M4 + Ring Karet + Rubber Pad + Spiral Band + Ties* ],
  [ 2 pcs Baut M4x10/12mm (pitch 75mm), 2 pcs Ring Karet (anti-rotasi), 4 pcs Rubber Bumper Pad sudut monitor, 1m Spiral Wrapping Band kabel pintu, 20 pcs ties, 4 pcs DIN stopper ],
  [ Rp 45.000 – Rp 55.000 ],
  [ Mengunci Beelink di dinding panel, mengikat bodi monitor 18.5" ke pintu panel tanpa getaran/rotasi, serta membungkus bundel kabel ke pintu berengsel. ],
)



#block(fill: rgb(239, 246, 255), stroke: (left: 3pt + rgb(2, 132, 199)), inset: (x: 8pt, y: 6pt), radius: (right: 4pt))[
  *Subtotal Anggaran Bagian A (Server Edge + Proteksi Efisien + Suplai Daya Ganda):*
]

#block(fill: rgb(239, 246, 255), stroke: (left: 3pt + rgb(2, 132, 199)), inset: (x: 8pt, y: 6pt), radius: (right: 4pt))[
  *Rp 4.319.000 – Rp 4.354.000* _(Sudah lengkap: Mini PC N100 16GB RAM, SSD NVMe 500GB, Digital VA-Protector 40A, Stopkontak DIN Ganda untuk Beelink + Monitor, dan printilan instalasi anti-rotasi)._
]


#v(3pt)
#line(length: 100%, stroke: 0.5pt + rgb(203, 213, 225))
#v(3pt)


== 3. Bagian B: Spesifikasi Sistem HMI & Layar Monitor

```text
PRIMARY OPERATOR HMI (18.5" WUXGA Touchscreen)         SECONDARY DISPLAY (Opsional Ruang Kendali)
┌─────────────────────────────────────────────────┐   ┌─────────────────────────────────────────────────┐
│        Ditempel di Pintu Panel Luar (Kiosk)     │   │          Dinding Ruang Kontrol / Gazebo         │
│  ┌───────────────────────────────────────────┐  │   │  ┌───────────────────────────────────────────┐  │
│  │   18.5" WUXGA IPS PCAP 120Hz Touchscreen  │  │   │  │   Xiaomi Redmi Monitor 21.45" Full HD     │  │
│  │      (Resolusi 1920×1200 Rasio 16:10)     │  │   │  │           (Resolusi 1920×1080)            │  │
│  │   [Monitoring + Full Actuator Controls]   │  │   │  │        [Monitoring Non-Touch Only]        │  │
│  └───────────────────────────────────────────┘  │   │  └───────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘   └─────────────────────────────────────────────────┘
```


#v(3pt)
#line(length: 100%, stroke: 0.5pt + rgb(203, 213, 225))
#v(3pt)


=== PRIMARY HMI — Layar Sentuh Industri Panel (Door-Mounted Kiosk 18.5 Inch WUXGA)
_Pilihan utama dan definitif untuk operasional harian. Layar 18.5" dengan rasio 16:10 (1920×1200) memberikan ruang visual ekstra lapang tanpa memaksa operator melakukan navigasi bertingkat yang rawan kesalahan saat mengoperasikan fertigasi._

- *Merek & Tipe:* *Portable Gaming Monitor 18.5" WUXGA IPS 120Hz Touchscreen (Model Kiosk Door-Mounted)*
- *Spesifikasi Display:* Panel IPS 18.5 Inch, Resolusi *WUXGA 1920 × 1200 piksel* (Aspek Rasio 16:10, +120px vertical space vs 1080p standar), refresh rate 120Hz, 100% sRGB, sudut pandang lebar 178°, kontras 1000:1, respon cepat, _ultra-slim bezel_.
- *Teknologi Sentuh (_Touch_):* *Capacitive Touch (10-Point Multi-Touch)* via kabel USB Type-C to Type-A langsung ke Beelink EQ12 (Plug-and-Play native kernel Linux `hid-multitouch`, zero driver install).
- *Antarmuka (Interface):* 
  - Video: 1x Port Mini-HDMI (menggunakan kabel Mini-HDMI to HDMI bawaan terhubung ke port HDMI Beelink).
  - Touch / Data: 1x Port USB Type-C (terhubung ke port USB Beelink EQ12).
  - Power Dedicated: 1x Port USB Type-C PD (khusus jalur daya eksternal).
  - Audio & Kontrol: 1x Audio Jack 3.5mm, 1x Jog Dial Rocker Wheel OSD, 1x Tombol Power.
- *Pemasangan Mekanikal (Door-Mounted Kiosk):*
  - Memiliki *2 lubang baut kuningan M4 vertikal (pitch 75 mm)* bawaan pabrik pada modul tengah bodi belakang. Cukup dibor 2 lubang tembus 4.5 mm pada pelat pintu panel tanpa perlu braket VESA eksternal tambahan.
  - Dilengkapi 2x Ring Karet pada baut dan 4x Bantalan Busa Karet (_Rubber Bumper Pad_) di sudut belakang bodi untuk meredam getaran dan mencegah monitor berotasi (_pivot-free_).
  - Kickstand lipat bawaan rata dengan bodi, tidak mengganjal saat terpasang di pelat pintu.
- *Sistem Catu Daya Mandiri (Dedicated Power Supply):*
  - *Wajib Eksternal PD 20W/30W:* Berdasarkan stiker peringatan resmi pabrik (_Warning: Socket not over 30W, must support PD protocol_), daya layar tidak boleh dibebankan ke bus USB Mini PC.
  - Disuplai langsung oleh *Adaptor Charger Fast Charging PD bawaan (steker bulat EU/Indonesia)* yang dicolokkan ke Stopkontak Rel DIN Slot ke-2 di dalam panel.
- *Kondisi & Harga:* *Rp 2.515.000* _(Unit Baru / Gress, Pengiriman Jakarta Timur, LOCKED IN)_.


#v(3pt)
#line(length: 100%, stroke: 0.5pt + rgb(203, 213, 225))
#v(3pt)


=== SECONDARY DISPLAY — Monitor Dinding Ruang Pengawas (Opsional Jangka Panjang)
_Disediakan HANYA jika pengawas menginginkan display pasif sekunder (_read-only telemetry mirror_) di dinding kantor/ruang istirahat tanpa fitur sentuh._

- *Merek & Tipe:* Xiaomi Redmi Monitor 21.45" Full HD (Model: RMMNT2145) / LG 22MR410-B
- *Antarmuka:* Kabel HDMI sekunder (port HDMI ke-2 pada Beelink EQ12).
- *Peran:* Menampilkan ringkasan status fertigasi jarak jauh.
- *Rentang Harga:* *Rp 950.000 – Rp 1.050.000* _(Hanya dibeli jika skenario ruang pengawas diaktifkan)._


#v(3pt)
#line(length: 100%, stroke: 0.5pt + rgb(203, 213, 225))
#v(3pt)


== 4. Bagian C: Ringkasan Simulasi Total Anggaran (Grand Total)

Berikut adalah kalkulasi total investasi pengadaan perangkat keras siap eksekusi tanpa pemborosan komponen redundan:


#table(
  columns: (1.8fr, 3.2fr, 1.2fr),
  align: (col, row) => if row == 0 { center + horizon } else { left + horizon },
  [ *Komponen Pengadaan* ],
  [ *Item yang Disertakan* ],
  [ *Estimasi Biaya* ],
  [ *Server Edge Mini PC* ],
  [ Beelink EQ12 (Intel N100, 16GB DDR5, 500GB NVMe SSD, Dual 2.5G) ],
  [ Rp 4.099.000 ],
  [ *Proteksi Listrik Panel* ],
  [ Digital DIN Rail VA-Protector 40A + RCBO 2P 10A Anti-Kontak ],
  [ Rp 150.000 ],
  [ *Aksesoris Kelistrikan Panel* ],
  [ Stopkontak Rel DIN Ganda (2-Gang) + Kabel NYAF 1.5mm² + Kabel LAN Cat6 + Baut M4 + Ring Karet + Spiral Band + Ties ],
  [ Rp 135.000 ],
  [ *Primary HMI Touchscreen* ],
  [ *Portable Monitor 18.5" WUXGA (1920×1200) IPS 120Hz Capacitive Touch + Adaptor PD 30W Bawaan + Kabel Lengkap (BARU)* ],
  [ Rp 2.515.000 ],
  [ *TOTAL INVESTASI SISTEM LENGKAP* ],
  [ *Server Edge + Proteksi Listrik Ganda + HMI 18.5" WUXGA Touchscreen Lengkap* ],
  [ *Rp 6.899.000* ],
)



#v(3pt)
#line(length: 100%, stroke: 0.5pt + rgb(203, 213, 225))
#v(3pt)


== 5. Bagian D: Panduan Instalasi Kelistrikan & Pengkabelan Panel (Electrical Wiring Guide)

Panduan ini menjamin instalasi kelistrikan yang andal, aman dari gangguan induksi elektromagnetik (EMI) motor pompa fertigasi, dan memenuhi kaidah proteksi sirkuit modern.


=== 1. Diagram Topologi Kelistrikan & Aliran Sinyal Panel

```text
                                  SUMBER DAYA PLN 220V AC (Fasa & Netral)
                                                     │
                                                     ▼
                               ┌───────────────────────────────────────────┐
                               │MCB Sumber Greenhouse / Jalur Utama 10A-16A│
                               └─────────────────────┬─────────────────────┘
                                                     │ (Kabel NYM 3x2.5mm²)
                                                     ▼
                               ┌───────────────────────────────────────────┐
                               │  DIGITAL DIN RAIL VA-PROTECTOR 40A        │
                               │  - Over-Volt Cutoff: 260V AC              │
                               │  - Under-Volt Cutoff: 175V AC             │
                               │  - Over-Current Limit: 10A                │
                               │  - Recovery Timer: 30s                    │
                               └─────────────────────┬─────────────────────┘
                                                     │ (Jumper NYAF 1.5mm² + Skun Ferrules)
                                                     ▼
                               ┌───────────────────────────────────────────┐
                               │  STOPKONTAK GANDA REL DIN (2-GANG / 16A)  │
                               │  ┌───────────────────┬──────────────────┐ │
                               │  │   SLOT 1 (KIRI)   │  SLOT 2 (KANAN)  │ │
                               └──┴─────────┬─────────┴─────────┬────────┴─┘
                                            │                   │
                     ┌──────────────────────┘                   └──────────────────────┐
                     ▼                                                                 ▼
      ┌───────────────────────────────┐                                 ┌───────────────────────────────┐
      │ Adaptor OEM Beelink 12V 3A DC │                                 │ Adaptor Fast Charging PD 30W  │
      └──────────────┬────────────────┘                                 └──────────────┬────────────────┘
                     │ (Kabel DC 5.5x2.5mm)                                            │ (Kabel USB-C to USB-C PD)
                     ▼                                                                 ▼
      ┌───────────────────────────────┐                                 ┌───────────────────────────────┐
      │   SERVER EDGE BEELINK EQ12    │                                 │   PORT INPUT POWER (PD IN)    │
      │   (Intel N100 / 16GB / 500GB) │                                 │   MONITOR 18.5" WUXGA TOUCH   │
      └───────┬───────────────┬───────┘                                 └───────────────────────────────┘
              │               │                                                        ▲
              │               │ (Kabel Data Touch: USB Type-A to Type-C)               │
              │               └────────────────────────────────────────────────────────┤
              │                                                                        │
              │ (Kabel Video: HDMI to Mini-HDMI)                                       │
              └────────────────────────────────────────────────────────────────────────┘
                                                                                       │
              ┌────────────────────────────────────────────────────────────────────────┤
              │ (Fisik Layar Terpasang di Luar Pintu Panel Berengsel)                  │
              └────────────────────────────────────────────────────────────────────────┘
```


=== 2. Standar Kabel, Pewarnaan & Terminasi (PUIL / IEC Standards)
- *Kabel Fasa (L):* Menggunakan kabel tembaga serabut *NYAF 1.5 mm² warna Cokelat / Hitam*.
- *Kabel Netral (N):* Menggunakan kabel tembaga serabut *NYAF 1.5 mm² warna Biru*.
- *Kabel Pembumian / Ground (PE):* Menggunakan kabel tembaga serabut *NYAF 1.5 mm² warna Kuning-Hijau*, dihubungkan ke baut grounding plat sasis panel listrik.
- *Terminasi Wajib Skun Ferrules (Insulated Cord End Terminals):*  
Seluruh ujung kabel serabut yang masuk ke terminal baut VA-Protector dan Stopkontak Rel DIN *wajib dipres menggunakan Skun Ferrules tipe E1508 (1.5 mm²)* dengan tang crimping heksagonal/segiempat. *Dilarang memasukkan serabut tembaga telanjang langsung ke baut terminal* untuk mencegah serabut tercerai, konsleting, atau kenaikan resistansi kontak akibat panas (_arcing_).


=== 3. Pemisahan Jalur Tegangan & Isolasi Derau Elektromagnetik (EMI / Noise Shielding)
Pompa fertigasi (pompa distribusi air baku dan pompa injektor pupuk) adalah beban induktif yang menghasilkan lonjakan tegangan transien (_inductive kickback_) dan interferensi elektromagnetik saat sakelar relai aktif.
- *Pemisahan Kabel Duct (Trunking):*
  - *Jalur Kanan Panel:* Dikhususkan untuk kabel daya 220V AC (kabel PLN, stopkontak, kabel daya pompa).
  - *Jalur Kiri Panel:* Dikhususkan untuk kabel sinyal tegangan rendah / data (kabel LAN Cat6, kabel HDMI, kabel USB Touch, kabel sensor ADC/I2C ESP32).
- *Jarak Bebas Minimum:* Pertahankan jarak bebas fisik minimal *15 cm* antara kabel daya motor pompa dan kabel data HDMI/USB monitor.
- *Perpotongan Tegak Lurus:* Jika kabel data terpaksa melintasi jalur kabel AC 220V, titik persilangan *wajib membentuk sudut 90° (tegak lurus)*, dilarang dirutekan paralel berdempetan.


=== 4. Parameter Konfigurasi Digital VA-Protector 40A
Atur parameter tombol pada unit Digital VA-Protector rel DIN sebelum beban dinyalakan:
+ *Over-Voltage Cutoff (*`>U`):* Set ke *250V AC* (memutus pasokan daya jika PLN melonjak di atas 250V akibat petir/fluktuasi trafo).*
+ *Under-Voltage Cutoff (*`<U`):* Set ke *175V AC* (memutus daya jika voltase anjlok drastis yang membahayakan SMPS Beelink dan pompa).*
+ *Over-Current Limit (*`>I`):* Set ke *10A* (memberikan ruang aman, beban total Mini PC + Monitor + Kontroler \< 1A).*
+ *Auto-Recovery Delay Timer (*`Delay`):* Set ke *30 detik – 45 detik* (menunda penyambungan daya kembali setelah insiden pemadaman atau anjloknya listrik PLN sampai tegangan stabil, mencegah siklus rusak on-off berulang kali).*


#v(3pt)
#line(length: 100%, stroke: 0.5pt + rgb(203, 213, 225))
#v(3pt)


== 6. Bagian E: Panduan Pemasangan Mekanikal & Fabrikasi Pintu Panel (Door-Mounted Kiosk Guide)

Panduan ini mengatur tahapan fabrikasi mekanikal untuk memasang bodi monitor 18.5" WUXGA secara presisi, kokoh, dan bebas getaran pada pelat pintu panel luar.


=== 1. Ergonomi & Penentuan Posisi pada Pintu Panel
- *Ketinggian Layar:* Tentukan titik tengah layar monitor pada ketinggian *145 cm – 155 cm dari permukaan lantai*. Ketinggian ini adalah standar _eye-level_ operator dewasa di Indonesia saat berdiri di depan panel.
- *Orientasi Horizontal (Landscape):* Monitor dipasang mendatar (landscape). Pastikan jarak tepi bodi monitor ke engsel pintu panel memiliki sisa ruang minimal *3 cm – 5 cm* agar monitor tidak membentur kusen saat pintu panel dibuka penuh (120°).
- *Dimensi Fisik Monitor 18.5":*
  - Lebar fisik: *≈ 420 mm (42 cm)*.
  - Tinggi fisik: *≈ 265 mm (26.5 cm)*.
  - Tebal modul bodi belakang: *≈ 15 mm – 18 mm*.
  - Lebar bersih pintu kotak panel yang disyaratkan: *Minimal 450 mm – 500 mm*.


=== 2. Alat Kerja & Material Fabrikasi yang Diperlukan
- Mesin bor tangan / bor baterai (_cordless drill_).
- Mata bor besi HSS ukuran *4.5 mm* (untuk lubang 2 baut M4).
- Mata bor _hole saw_ logam / _step drill bit_ (unibit) diameter *25 mm – 30 mm* (untuk lubang tembus bundel kabel).
- Kikir besi bulat/setengah lingkaran (_deburring tool_).
- *1 pcs Karet Pelindung Lubang (_Rubber Cable Grommet_) diameter 25 mm* (melindungi kabel agar tidak tergores pelat seng/besi panel).
- *2 pcs Baut Mesin M4 × 10 mm atau M4 × 12 mm* (bahan stainless steel atau baja galvanis).

#block(fill: rgb(239, 246, 255), stroke: (left: 3pt + rgb(2, 132, 199)), inset: (x: 8pt, y: 6pt), radius: (right: 4pt))[
  *PERINGATAN KRUSIAL KEDALAMAN BAUT:* Kedalaman lubang kuningan bodi monitor adalah sekitar *5 mm – 6 mm*. Tebal pelat pintu panel umumnya 1.2 mm. Jika baut terlalu panjang (misal M4×20 mm), ujung baut akan *menusuk panel display LCD dan memecahkan layar dari dalam!* Gunakan panjang baut yang tepat (M4×10mm) atau tambahkan ring ganjalan.
]
- *2 pcs Ring Plat Lebar M4* (menahan tarikan kepala baut pada pelat besi).
- *2 pcs Ring Karet / Silikon M4 (_Rubber Washer_)* (menyerap getaran dan mencegah melonggarnya baut akibat getaran motor).
- *4 pcs Bantalan Busa Karet Sudut (_Rubber Bumper Pad_ tebal 4–5 mm / 3M dome pad)*.
- *1 meter _Spiral Wrapping Band_ (diameter 10 mm – 12 mm)*.


=== 3. Tahapan Pemasangan Langkah demi Langkah (Step-by-Step)

```text
PELAT PINTU PANEL LISTRIK (Tampak Samping Potongan)
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                                                                        │
│                                Baut M4x10mm                                            │
│                                    │                                                   │
│                                    ▼                                                   │
│                                (Kepala Baut)                                           │
│                                     ║                                                  │
│                              [Ring Plat M4]                                            │
│                                     ║                                                  │
│                             [Ring Karet M4]                                            │
│                                     ║                                                  │
│   ══════════════════════════════════╬══════════════════════════ PELAT PINTU PANEL BESI │
│                                     ║                                                  │
│                   ┌─────────────────╨─────────────────┐                                │
│                   │ Threaded Insert Kuningan Bawaan   │                                │
│                   │ (Modul Carbon Fiber Monitor 18.5")│                                │
│                   └───────────────────────────────────┘                                │
│                                                                                        │
│   [Bantalan Busa Karet 4mm di Sudut] ──> Menapak rata meredam getaran sentuh           │
│                                                                                        │
└────────────────────────────────────────────────────────────────────────────────────────┘
```


==== Langkah 1: Pembuatan Template Kertas (_Marking Template_)
+ Siapkan selembar kertas karton tebal seukuran bodi monitor.
+ Tempatkan di belakang monitor, tandai secara presisi posisi *2 lubang baut kuningan vertikal (jarak pitch tepat 75 mm)*.
+ Tandai pula posisi lubang port kabel di sisi kanan modul tengah.
+ Beri lubang pada kertas template sebagai mal pengeboran.


==== Langkah 2: Penandaan & Pengeboran Pintu Panel
+ Tempelkan kertas template pada bagian luar pintu panel listrik menggunakan lakban kertas (_masking tape_).
+ Gunakan penitik besi (_center punch_) dan palu kecil untuk menandai titik pusat 2 lubang baut M4 dan 1 lubang jalur kabel.
+ Lepas template. Bor 2 lubang baut menggunakan *mata bor HSS 4.5 mm*.
+ Bor 1 lubang kabel di dekat posisi soket monitor menggunakan *mata bor unibit / hole saw logam diameter 25 mm*.
+ Kikir seluruh sisa gram besi (_burr_) pada tepi lubang hingga halus, lalu segera pasang *Rubber Cable Grommet 25 mm* pada lubang kabel tersebut.


==== Langkah 3: Penyiapan Bodi Monitor
+ Letakkan monitor dengan layar menghadap ke bawah di atas permukaan yang empuk dan bersih (gunakan busa packing bawaan box).
+ Lipat kickstand lipat bawaan hingga tertutup rapat rata bodi di sekeliling modul carbon fiber.
+ Bersihkan permukaan 4 sudut belakang monitor dengan alkohol, lalu tempelkan *4 pcs Rubber Bumper Pad (tebal 4 mm)* pada masing-masing sudut belakang bodi monitor. Bantalan ini berfungsi sebagai penopang empat titik agar monitor tidak bergoyang atau berputar (_anti-pivot_) saat operator menekan layar.


==== Langkah 4: Perakitan Monitor ke Pintu Panel
+ Minta bantuan 1 orang rekan untuk memegang bodi monitor di sisi luar pintu panel.
+ Dari sisi dalam pintu panel, masukkan baut M4 yang telah dipasangi Ring Plat dan Ring Karet ke lubang pintu, lalu putar ke ulir lubang kuningan monitor.
+ Kencangkan baut secara bergantian menggunakan obeng tangan manual (*JANGAN gunakan bor obeng/impact driver*). Kencangkan secukupnya hingga ring karet sedikit tertekan. Rasakan bahwa monitor telah menempel kokoh, tegak lurus, dan keempat bantalan sudut karet menapak rapat ke pelat panel.


==== Langkah 5: Manajemen Kabel Fleksibel Engsel Pintu (_S-Curve Cable Slack_)
+ Colokkan 3 kabel ke sisi modul monitor:
  - Kabel Mini-HDMI to HDMI (ke port Mini-HDMI).
  - Kabel USB Type-C Data Touch (ke port USB-C data).
  - Kabel USB Type-C Power PD (ke port USB-C PD power).
+ Masukkan ketiga kabel tersebut melalui lubang _Rubber Grommet 25 mm_ ke sisi dalam pintu panel.
+ Bungkus ketiga kabel menjadi satu bundel rapi menggunakan *Spiral Wrapping Band 10–12 mm* sepanjang 0.8 – 1 meter.
+ *Instalasi Lengkungan Relaksasi Engsel (_S-Curve Slack_):*  
Rutekan bundel kabel dari pintu ke sasis dinding panel melintasi engsel dengan membentuk *lengkungan huruf "S" yang longgar*. Ikatkan kedua ujung lengkungan menggunakan klem kabel ties berdasar perekat (_tie mount_) pada plat pintu dan dinding dalam.
_Uji Gerak:_ Buka pintu panel selebar 120° dan tutup kembali secara penuh. Pastikan kabel tidak pernah tertarik kencang, tidak terlipat patah, dan tidak terjepit di antara kusen engsel panel!


==== Langkah 6: Pemasangan Mini PC Beelink EQ12 di Dalam Panel
+ Pasang braket dinding logam Beelink (bawaan box EQ12) pada pelat dasar dalam panel menggunakan 2 baut sekrup M4.
+ Pasang Beelink pada braket dengan orientasi: *Port kabel menghadap ke bawah/samping, kisi-kisi pembuangan hawa panas (_copper heatsink fan exhaust_) menghadap ke atas* ke arah louver ventilasi panel.
+ Hubungkan ujung kabel Mini-HDMI ke port HDMI 1 Beelink, kabel USB Touch ke port USB 3.2 Beelink, dan colokkan kabel LAN Cat6 dari switch ESP32 ke port Ethernet 2.5G Beelink.


#v(3pt)
#line(length: 100%, stroke: 0.5pt + rgb(203, 213, 225))
#v(3pt)


== 7. Bagian F: Checklist Rekayasa & Prosedur Uji Commissioning (Testing SOP)

Sebelum menyerahkan sistem ke operator fertigasi greenhouse, eksekusi checklist pengujian mandiri berikut secara berurutan:


=== Checklist 1: Pengujian Pra-Penyalaan (Cold Verification)
- #text(size: 9pt, fill: rgb(2, 132, 199))[☐] Seluruh terminasi kabel AC 220V (NYAF 1.5mm²) telah dipasangi skun ferrules dan baut terminal dikencangkan kokoh.
- #text(size: 9pt, fill: rgb(2, 132, 199))[☐] Baut grounding rangka panel telah terpasang ke kabel arde.
- #text(size: 9pt, fill: rgb(2, 132, 199))[☐] Jalur kabel daya AC 220V terpisah rapi di ducting kanan, terisolasi dari kabel data sinyal di sisi kiri (jarak \> 15 cm).
- #text(size: 9pt, fill: rgb(2, 132, 199))[☐] Bundel kabel pintu berengsel terbungkus spiral band dan tidak terjepit saat pintu panel dibuka-tutup 5 kali berturut-turut.
- #text(size: 9pt, fill: rgb(2, 132, 199))[☐] Baut pengunci monitor M4 terpasang mantap dengan ring karet; keempat bantalan sudut karet menapak sempurna tanpa goyang (_zero wobble_).


=== Checklist 2: Pengujian Catu Daya & Proteksi Voltase (Hot Power-On Test)
- #text(size: 9pt, fill: rgb(2, 132, 199))[☐] Naikkan MCB sumber. Unit Digital VA-Protector menyala, menampilkan angka tegangan PLN (contoh: `225V`) dan arus `0.0A`.
- #text(size: 9pt, fill: rgb(2, 132, 199))[☐] Tunggu recovery timer 30 detik hingga relay internal VA-Protector berbunyi _klik_ dan mengalirkan daya ke Stopkontak Ganda DIN Rail.
- #text(size: 9pt, fill: rgb(2, 132, 199))[☐] Periksa bahwa Adaptor 12V 3A Beelink dan Adaptor PD 30W Monitor menyala dengan stabil.


=== Checklist 3: Pengujian Display & Pengenalan Touchscreen Linux (OS & Driver Bring-Up)
- #text(size: 9pt, fill: rgb(2, 132, 199))[☐] Tekan tombol power Beelink EQ12. Masuk ke BIOS UEFI (tekan `Delete`). Verifikasi pengaturan:  
`Advanced` → `Power Management` → `Restore on AC Power Loss: Power On`* sudah aktif (_Enabled_).*
- #text(size: 9pt, fill: rgb(2, 132, 199))[☐] Boot ke Linux (Ubuntu / Debian). Layar monitor 18.5" menampilkan antarmuka desktop/kiosk secara otomatis.
- #text(size: 9pt, fill: rgb(2, 132, 199))[☐] Buka terminal Linux, verifikasi resolusi native WUXGA 1920×1200:
```bash
  xrandr | grep -E "connected|current"
  # Output terverifikasi: current 1920 x 1200 (atau resolusi WUXGA 16:10)
```
- #text(size: 9pt, fill: rgb(2, 132, 199))[☐] Verifikasi pengenalan perangkat sentuh kapasitif (_multi-touch digitizer_):
```bash
  dmesg | grep -i -E "touch|hid-multitouch"
  lsusb
  # Output terverifikasi: Terdeteksi perangkat USB HID Touchscreen Plug-and-Play
```
- #text(size: 9pt, fill: rgb(2, 132, 199))[☐] Lakukan pengetesan sentuh: sentuh keempat pojok layar dan tengah layar. Kursor bergerak presisi mengikuti ujung jari tanpa deviasi (_zero parallax_), tanpa instalasi driver pihak ketiga.


=== Checklist 4: Pengujian Ketahanan Daya & Beban Induktif (Stress & Failover Test)
- #text(size: 9pt, fill: rgb(2, 132, 199))[☐] *Simulasi Pemadaman PLN (Blackout Test):* Saat sistem sedang membuka dashboard browser Kiosk fertigasi, matikan sakelar manual VA-Protector (simulasi mati lampu). Tunggu 10 detik, lalu hidupkan kembali sakelar VA-Protector.  
_Kriteria Lulus:_ Setelah 30 detik delay proteksi, Beelink EQ12 otomatis menyala sendiri (_auto-power-on_), monitor 18.5" menyala otomatis menerima sinyal HDMI tanpa perlu memencet tombol power monitor, dan container Docker beserta browser Kiosk pulih mandiri ke layar Dashboard Cockpit dalam waktu \< 45 detik.
- #text(size: 9pt, fill: rgb(2, 132, 199))[☐] *Simulasi Gangguan Induksi Pompa (EMI Noise Test):* Nyalakan dan matikan relai pompa fertigasi 220V berkali-kali melalui perintah manual.  
_Kriteria Lulus:_ Layar monitor 18.5" tetap stabil menampilkan visual tanpa pernah berkedip (_black screen flicker_), artefak garis, atau _USB touch disconnect_.


#v(3pt)
#line(length: 100%, stroke: 0.5pt + rgb(203, 213, 225))
#v(3pt)

_Dokumen ini berstatus LOCKED IN dan menjadi panduan resmi fabrikasi perakitan panel fertigasi Greenhouse V2 DESANOMI._
