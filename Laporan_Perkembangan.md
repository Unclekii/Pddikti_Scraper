# Laporan Perkembangan Program Scraping PDDIKTI
**Periode:** Maret 2026 - April 2026

Laporan ini mendokumentasikan transformasi program scraping data PDDIKTI, mulai dari script *command-line* dasar yang masih memiliki banyak celah saat pengambilan data, hingga berevolusi menjadi **Mini Web Aplikasi (Dashboard)** yang lebih stabil, optimal, dan ramah pengguna.

---

### Fase 1: Pengembangan Dasar & Penambahan Atribut Data (Pertengahan Maret 2026)
Pada awalnya, program murni berjalan sebagai script Python biasa di terminal (`pddikti_scraping_update.py`).
*   **Masalah/Fokus Awal:** Output data yang diekstraksi ke Excel dirasa kurang lengkap untuk kebutuhan analisis lebih dalam.
*   **Penyelesaian:** Dilakukan optimasi dan injeksi *data fields* baru. Output pada *sheet* "Daftar Prodi" ditambahkan beberapa kolom penting meliputi:
    *   `Keterangan` (Status Aktif/Tidak)
    *   `Akreditasi Program Studi`
    *   Kategori Institusi: `PTN/PTS`, `PTKIN/NON PTKIN`, `DIKTI/DIKTIS`
    *   `Provinsi`

### Fase 2: Perbaikan Bug Integritas Data & Duplikasi (Akhir Maret 2026)
Memasuki tahap validasi data riil, kami menemukan beberapa *bug* fatal dari sumber data PDDIKTI maupun sistem loop pada script.
*   **Bug/Masalah:** 
    *   Adanya *Missing Data* (data kosong/hilang pada semester tertentu) yang membuat program terhenti.
    *   Data program studi yang sudah berstatus tidak aktif ikut ter-scrape, sehingga list final kotor.
    *   Logika klasifikasi tipe kampus DIKTI vs DIKTIS yang kurang konsisten.
    *   Munculnya anomali data duplikat (baris ganda di output Excel).
*   **Penyelesaian:**
    *   Diterapkan sistem **automated semester tracking** untuk melakukan mitigasi handling saat ada format data tahunan yang bolong.
    *   Ditambahkan blokade/filter ketat yang memaksa program **hanya memproses Program Studi Aktif**.
    *   Penyempurnaan tata cara klasifikasi Tipe Institusi.
    *   Penerapan algoritma **deduplikasi data** sebelum fase *export* Excel untuk memastikan integritas data bagi tim analis.

### Fase 3: Transisi Arsitektur ke Web Dashboard (Awal April 2026)
Menjalankan lebih dari satu script scraping lewat terminal sangat tidak ramah bagi user dan rekan tim lainnya.
*   **Masalah/Kebutuhan:** *User flow* cukup membingungkan—pengguna tidak bisa leluasa memfilter Prodi mana yang perlu ditarik, dan repot harus mengeksekusi banyak fungsi satu per satu manual.
*   **Penyelesaian:** 
    *   Integrasi besar-besaran: Penggabungan dua modul master script scraping ke dalam sebuah antarmuka web interaktif menggunakan framework **Flask**.
    *   Pembuatan *Workflow* yang mulus dan terintegrasi: **Fetch/Filter Data -> Pemilihan target Prodi via antarmuka (UI) -> Eksekusi Scraping Spesifik -> Download otomatis Hasil Excel**.

### Fase 4: Perbaikan Bug UI/UX & Styling (Awal April 2026)
Begitu antarmuka web (dashboard) berhasil berdiri, ditemukan beberapa isu kecil terkait interaksi visual layar.
*   **Bug/Masalah:**
    *   *Bug* pada fitur *search/filter* HTML: saat pengguna mengganti bidang ilmu, parameter input pencarian sebelumnya 'nyangkut' dan tidak mau ke-reset.
    *   Peringatan *error* di konsol terkait validasi rendering CSS (`-webkit-background-clip`).
    *   Visual: Tampilan UI awal menggunakan efek *glow* (bercahaya) yang membuat teks tidak nyaman dibaca berlama-lama.
*   **Penyelesaian:**
    *   Memperbaiki alur JavaScript (DOM) supaya *state* filter data selalu otomatis ter-reset *clean* ketika *user* mengganti kriteria.
    *   Merapikan file konfigurasi CSS dan menerapkan tag pemformatan yang lebih standar/universal *cross-browser*.
    *   Tampilan diubah ke *style* estetika minimalis profesional modern; **Glow Effect dihapus sepenuhnya** dan sistem palet warna ditata ulang ke **Light Mode** yang lebih bersahabat untuk layar. 

### Fase 5: Optimasi Memori Backend & Persiapan Cloud (April 2026 - *Versi Terbaru Saat Ini*)
Fokus beralih ke stabilitas performa beban berat (*stress testing*) dan kemudahan instalasi di perangkat lain.
*   **Bug/Masalah:**
    *   Dalam proses men-scrape ribuan baris list dosen/prodi sekaligus, server rentan mengalami kebocoran RAM **(Memory Leak)** dan kepenuhan beban eksekusi (file *storage*).
    *   Inisialisasi *local server* via `python app.py` sering gagal menyertakan *virtual environment* bila dibuka komputernya orang awam.
*   **Penyelesaian:**
    *   Rombakan di penanganan penyimpanan supaya *memory space* otomatis dibebaskan (*release*) kembali ke OS sesaat proses parsing data kelar. 
    *   Menambahkan file sistem penting **`Procfile`** dan paket server untuk tahap *production* **(`gunicorn`)** agar dashboard lancar kalau esoknya pindah dipasang di hosting awan (*Cloud*).
    *   Membuat file eksekutable bantuan **`start.bat`**. Siapa saja sekarang tinggal klik 2x (double-click) dan server aplikasi + dashboard *browser* akan tereksekusi langsung dengan sendirinya di desktop.

---
**Status Kesimpulan Terkini:**
Aplikasi kita sukses meng-upgrade sistemnya secara masif. Dari yang dulunya cuma "script terminal sederhana untuk menarik laporan" berkembang jadi **Data Extraction Portal (Web Dashboard)** matang dengan UI yang lebih jelas, proses penanganan *error request* yang jauh lebih rapi, ringan di RAM komputer, dan *ready to deploy* (siap dirilis).
