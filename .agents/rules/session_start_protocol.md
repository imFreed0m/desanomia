---
description: Unified Tri-Memory Pre-Execution Invariant requiring claude-mem, graphify, and openviking context ingestion before answering or executing tasks.
globs: ["*"]
always_on: true
---

# Unified Tri-Memory Pre-Execution Protocol

## Invariant Mutlak: Memory-First Triad

Sebelum merespons permintaan pengguna, menyusun rencana teknis, atau memodifikasi kode, agen **WAJIB** selalu mengonsultasikan tiga pilar memori (*The Tri-Memory Stack*) terlebih dahulu:

1. **`claude-mem`** (Episodic & Session History)
2. **`graphify`** (Structural & Codebase Topology)
3. **`openviking`** (Hierarchical Semantic Context & Long-Term Memory)

---

## Urutan Eksekusi Tri-Memory Pipeline

```text
[User Request]
       │
       ▼
1. claude-mem  ──► Ingest observasi sesi sebelumnya, milestone, dan keputusan mutakhir.
       │
       ▼
2. graphify    ──► Query graphify-out/graph.json untuk memetakan dependensi, modul, & god nodes.
       │
       ▼
3. openviking  ──► Semantic retrieval (find/search) untuk aturan domain, spesifikasi, & detail URI.
       │
       ▼
[Formulate Plan / Execute Action / Generate Response]
```

---

## 1. Fase 1: `claude-mem` (Episodic Session Memory)
* **Tujuan:** Mengetahui pekerjaan yang baru saja diselesaikan, status turn terakhir, dan menghindari pengerjaan ulang.
* **Prosedur:**
  * Periksa riwayat observasi sesi melalui port `37700` atau log sesi aktif.
  * Identifikasi keputusan terkini (*decisions*), temuan (*discoveries*), dan catatan keamanan (*security notes*).

---

## 2. Fase 2: `graphify` (Codebase Structural Topology)
* **Tujuan:** Memahami peta arsitektur kode, keterhubungan modul, dan dampak perubahan (*blast radius*).
* **Prosedur:**
  * Jalankan kueri graf:
    ```bash
    graphify query "<konteks/fitur yang relevan>"
    ```
  * Periksa `graphify-out/GRAPH_REPORT.md` untuk mengidentifikasi *god nodes* dan batas komunitas antarmodul.

---

## 3. Fase 3: `openviking` (Deep Semantic Context Database)
* **Tujuan:** Menarik dokumen kontekstual mendalam, referensi API, dan memori jangka panjang proyek.
* **Prosedur:**
  * Non-blocking health probe ke `http://127.0.0.1:1933/health` (<50ms).
  * Panggil tool MCP `openviking.find` (pencarian semantik cepat) atau `openviking.search` (deep context).
  * Jika MCP belum aktif di subagent, gunakan CLI:
    ```bash
    ov find "<kata kunci>"
    # atau
    ov search "<pertanyaan>"
    ```

---

## 4. Fallback Hierarchy
Jika salah satu komponen tidak aktif:
* Jika `openviking` down → Lanjutkan dengan `claude-mem` + `graphify`.
* Dilarang menyalakan daemon berat di tengah turn jika pengguna sengaja mematikannya demi hemat RAM.

---

## 5. Post-Task Synchronization
Setelah milestone selesai:
* Catat ringkasan penting ke `claude-mem`.
* Simpan memori permanen ke `openviking` via `remember` / `ov remember`.
* Perbarui knowledge graph via `graphify --update` jika berkas kode bertambah/berubah.
