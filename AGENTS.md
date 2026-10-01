# AGENTS.md — Workspace Rules for desanomia

## 1. Unified Tri-Memory Pre-Execution Invariant

Sebelum merespons permintaan substantif, merancang arsitektur, atau mengeksekusi perintah terminal yang membaca/mengubah state, agen **WAJIB** mengonsultasikan The Tri-Memory Stack:

1. **`claude-mem`** (Episodic & Session History): Ingest observasi sesi sebelumnya, milestone, dan keputusan mutakhir untuk menghindari pengerjaan ulang.
2. **`openviking`** (Hierarchical Semantic Context & Long-Term Memory): Lakukan pencarian semantik via MCP `openviking.find` / `openviking.search` atau CLI `ov find` / `ov search` untuk mengambil konteks domain, spesifikasi, dan memori permanen.
3. **`graphify`** (Structural Code Topology): Periksa `graphify-out/GRAPH_REPORT.md` atau `graphify query` untuk memetakan ketergantungan modul dan god nodes sebelum memodifikasi kode.

**Invariant:** Dilarang keras melompat ke eksekusi bash lokal atau berspekulasi secara naif sebelum memeriksa memori.

---

## 2. Multi-Host Infrastructure Disambiguation

Untuk menghindari kesalahan pembacaan hardware dan halusinasi spesifikasi server:

* **Host 1 (Local Client / Workstation):**
  * **Hostname:** `imfreed0m` (ASUS Vivobook S 14 Flip, AMD Ryzen 5 5600H, 16 GB RAM, NVMe 512 GB).
  * **Peran:** Mesin tempat terminal pengembang dan Antigravity CLI berjalan.
* **Host 2 (Remote Server Headless):**
  * **Hostname:** `lenovo-latop`
  * **Alamat Jaringan:** Local IP `192.168.1.12` / Tailscale IP `100.125.131.95`.
  * **Peran:** Server lokal tanpa layar (headless) untuk Ollama (Qwen 2.5 Coder 3B, Nomic Embed), database, dan komputasi inferensi.

**Aturan Mutlak:**
Dilarang keras menjalankan perintah hardware (`lsblk`, `lscpu`, `free -h`, `df -h`) pada **localhost** untuk menjawab pertanyaan mengenai **Server Lenovo**! Pertanyaan tentang Server Lenovo harus dijawab menggunakan data yang tersimpan di memori (`claude-mem`/`openviking`) atau dieksekusi melalui remote SSH (`ssh lenovo@192.168.1.12` / `100.125.131.95`).
