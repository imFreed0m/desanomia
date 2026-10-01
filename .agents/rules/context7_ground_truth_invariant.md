---
description: Ground-truth reference rule requiring Context7 or official documentation verification before writing code with external libraries.
globs: ["*"]
always_on: true
---

# Context7 Ground-Truth & Anti-Hallucination Invariant

## 1. Prinsip Mutlak: Evidence Over Assumptions

Agen dilarang keras berasumsi atau menebak-nebak sintaks, method, parameter, dan konfigurasi dari *third-party libraries* / *frameworks* (seperti Next.js, React, Tailwind, FastAPI, Pydantic, Prisma, Supabase, Celery, LangChain, dll.) hanya berdasarkan ingatan probabilitas model (*raw training memory*).

Sikap *"job is done, terus yo wes"* (menyelesaikan kode secara terburu-buru asalkan terlihat jalan di permukaan) adalah pelanggaran berat terhadap standar rekayasa.

---

## 2. Protokol Konsultasi Ground-Truth (Context7)

Sebelum merancang, menulis, atau memodifikasi kode yang melibatkan library eksternal:

1. **Jadikan Context7 Sebagai Rujukan Utama:**
   * Konsultasikan server MCP `context7` untuk mengambil referensi API resmi terkini, breaking changes, dan contoh implementasi versi terbaru.
2. **Validasi Signature & Breaking Changes:**
   * Pastikan nama fungsi, opsi konfigurasi, dan parameter yang digunakan sesuai dengan versi pustaka yang terpasang di proyek, bukan versi lama yang sudah *deprecated*.
3. **Fallback Dokumentasi:**
   * Jika topik atau library belum tercakup di Context7, gunakan `search_web` dan `read_url_content` untuk memeriksa dokumentasi resmi langsung dari sumber aslinya. Dilarang menebak.

---

## 3. Kriteria Penyelesaian (*Completion Contract*)

Kode yang melibatkan library eksternal hanya boleh dinyatakan **selesai** jika:
1. Implementasi telah diverifikasi terhadap dokumentasi resmi (via Context7 atau doc fetcher).
2. Tidak ada penggunaan API usang (*deprecated*) yang dapat menimbulkan error tersembunyi.
3. Kode terverifikasi secara mekanis (sintaks, typecheck, atau tes).
