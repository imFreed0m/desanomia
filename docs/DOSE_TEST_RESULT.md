# REKAP SEMENTARA — TANPA KOREKSI SEDIMENTASI

**Asumsi:** Semua ppm dianggap berasal dari pupuk yang larut sempurna. Sedimentasi **belum diukur** dan **belum dikeluarkan** dari perhitungan.

---

## 1. Data Empiris Dasar

| Parameter | Nilai |
| :--- | :--- |
| Air awal | 2 L, 280 ppm, suhu ~29°C |
| Pupuk | 10 g padat |
| Hasil TDS | 5.000 – 5.100 ppm |
| Kontribusi pupuk | 5.000 − 280 = **4.720 ppm** (atau 5.100 − 280 = 4.820 ppm) |
| Dosis | 10 g / 2 L = **5 g/L** |
| Faktor konversi | 4.720 / 5 = **944 ppm per g/L** (atau 964) |

**Angka kunci:** Setiap **1 g/L** pupuk menyumbang **~944–964 ppm**.

---

## 2. Konversi ke Standar 1 kg : 10 L

Standar Anda: **200 g / 2 L** = **1 kg / 10 L** = **100 g/L**.

| Faktor | Perhitungan | Hasil |
| :--- | :--- | :--- |
| 944 | 100 × 944 + 280 | **94.680 ppm** |
| 964 | 100 × 964 + 280 | **96.680 ppm** |
| Ideal (tanpa baseline) | 100 × 1.000 | **100.000 ppm** |

---

## 3. Rekap Percobaan 1

### Drum Konsentrasi
- 2 L air 280 ppm + 10 g pupuk → **5.000–5.100 ppm**

### Drum Distribusi
| Penambahan | Air | Konsentrat | Hasil Teoritis | Hasil Observasi |
| :--- | :--- | :--- | :--- | :--- |
| Pertama | 80 L, 268–280 ppm | 500 mL dari 5.000 ppm | 297–309 ppm | **310 ppm** |
| Kedua | 80 L + 500 mL (total 1 L) | 500 mL lagi | ~339 ppm | **330 ppm** |

**Catatan:** Hasil 310 ppm lebih cocok jika air awal dianggap **280 ppm**, bukan 268 ppm.

---

## 4. Rekap Percobaan 2

### Drum Konsentrasi
- 2 L air 280 ppm + 10 g pupuk → **5.000–5.100 ppm**

### Percobaan Lanjutan
- **50 g / 2 L** = 25 g/L
- Teoritis: 25 × 944 + 280 = **23.880 ppm** (atau 24.380 ppm jika faktor 964)
- Diambil **500 mL**, dicampur **80 L air 330 ppm**

| Parameter | Teoritis | Observasi |
| :--- | :--- | :--- |
| ppm campuran | 476 ppm | **468 ppm (drum)** / **466 ppm (sample)** |
| Suhu | — | 30°C |

**Selisih ~2%.** Bisa disebabkan oleh:
- Sedimentasi awal
- Suhu
- Kalibrasi TDS meter
- Ketidaktepatan volume

---

## 5. Rekap Perhitungan AI

AI menggunakan asumsi **100.000 ppm** untuk cairan pekat 200 g / 2 L (100 g/L, tanpa baseline, tanpa sedimen).

| Target | Volume Air | Kebutuhan Konsentrat (AI) | Kebutuhan dengan Faktor 944 + Baseline 280 |
| :--- | :--- | :--- | :--- |
| 600 ppm | 140 L, 280 ppm | **451 mL** | **476 mL** |
| 1.200 ppm | 140 L, 280 ppm | **1.300 mL** | **1.378 mL** |

**Selisih:** ~5–6% lebih banyak jika pakai faktor empiris.

---

## 6. Status Sedimentasi

| Hal | Status |
| :--- | :--- |
| Pengukuran sedimen | **Belum dilakukan** |
| Koreksi sedimen | **Belum diterapkan** |
| Faktor 944 | Berasal dari larutan **teraduk**, bukan supernatan jernih |
| Dampak | Perhitungan ppm **overestimate** jika ada endapan |
| Estimasi sedimen | 10–30% (tergantung pupuk) |

---

## 7. Rumus Penting

### Pengenceran 1:200
```
PPM actual = (X × 2.010 − 280 × 2.000) / 10
```
atau
```
PPM actual = (X − 280) × 201 + 280
```

### Konversi ppm ke gram pupuk larut
```
Pupuk larut (g) = (Kontribusi pupuk / Faktor) × Volume air (L)
```

### Sedimentasi (jika sudah ada data)
```
Sedimen (%) = (Massa pupuk awal − Pupuk larut) / Massa pupuk awal × 100%
```

---

## 8. Ringkasan Angka

| Item | Nilai |
| :--- | :--- |
| Faktor empiris | 944–964 ppm per g/L |
| Konsentrat 10 g / 2 L | ~5.000 ppm |
| Konsentrat 50 g / 2 L | ~23.880 ppm |
| Konsentrat 200 g / 2 L | ~94.680 ppm |
| Konsentrat ideal 200 g / 2 L | 100.000 ppm |
| Target 600 ppm di 140 L | 451 mL (ideal) / 476 mL (empiris) |
| Target 1.200 ppm di 140 L | 1.300 mL (ideal) / 1.378 mL (empiris) |

---

## 9. Rekomendasi Berikutnya

1. **Lakukan uji besar:** 20 L air + 2 kg pupuk.
2. **Endapkan 1–2 jam**, ambil supernatan jernih.
3. **Ukur dengan pengenceran 1:200.**
4. **Hitung PPM actual** dan **persentase sedimen** (via filtrasi + timbang).
5. **Update faktor konversi** dari 944 ke nilai sebenarnya.
6. **Simpan faktor baru** untuk perhitungan ESP32.

**Selama belum ada data sedimen, semua perhitungan di atas masih menganggap pupuk larut 100%.**