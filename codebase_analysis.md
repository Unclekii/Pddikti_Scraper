# PDDikti Dashboard & Scraper - Codebase Analysis

Dokumen ini merupakan hasil analisis komprehensif terhadap arsitektur dan fungsionalitas dari program *PDDikti Dashboard & Scraper*. Aplikasi ini dibangun menggunakan pendekatan *Fullstack* dengan kapabilitas asinkron (*Background Jobs* & *Server-Sent Events*) untuk menangani pemrosesan data bervolume tinggi.

---

## 1. Arsitektur Sistem

Sistem ini terbagi menjadi 3 lapisan utama (*Layers*):
1. **Frontend / Presentation Layer**: Dibangun dengan HTML5 murni, Vanilla JavaScript, dan CSS dengan pendekatan antarmuka *Dashboard/SaaS* modern.
2. **Backend / API Layer**: Dibangun menggunakan kerangka kerja (framework) **Flask** (Python) untuk manajemen *routing*, otentikasi, *background threading*, dan *streaming event*.
3. **Data Extraction & Processing Layer**: Modul *scraper* pintar yang berkomunikasi langsung dengan API PDDikti, didukung oleh *Thread Pooling* untuk konkurensi (mempercepat proses pengumpulan ribuan data).

---

## 2. Analisis Struktur Direktori & File Utama

### 📂 Root Directory
- **`app.py`**
  Ini adalah jantung (*entry point*) dari *backend* aplikasi. File ini bertugas untuk:
  - Menyediakan *endpoint* API (misal: `/api/run-scraper`, `/api/stop-scraper`, `/api/analyze/<filename>`).
  - Mengelola *state* antrean (*Jobs*) dari *scraper* di dalam *memory*.
  - Melakukan komunikasi *real-time* dengan *frontend* menggunakan **Server-Sent Events (SSE)** via endpoint `/api/stream/<job_id>`.
  - Secara otomatis membersihkan file dan *thread* kedaluwarsa (*memory management*).
  - Menggunakan perlindungan keamanan tingkat lanjut (seperti `secure_filename` dari Werkzeug) untuk mencegah *Path Traversal*.

- **`start.bat`**
  Skrip *bootstrap* interaktif untuk sistem operasi Windows. Fungsinya mengaktifkan *Virtual Environment* (jika ada), menjalankan `app.py` di port `5000`, dan menampilkan instruksi URL dengan antarmuka CLI yang rapi.

### 📂 Folder `scraper/`
Berisi mesin utama pemrosesan data:
- **`dosen_scraper.py`**
  Skrip *scraper* tingkat lanjut. Fitur kuncinya meliputi:
  - **Thread Pooling**: Mempercepat proses pengunduhan profil dosen secara paralel.
  - **Smart Fallback Sub-query**: Jika API PDDikti tidak menemukan nama prodi yang panjang, skrip ini akan cerdas memotong kata-kata di akhir/awal (*sub-query*) untuk memastikan data tetap ditemukan.
  - **Klasifikasi Data Terpadu**: Terhubung dengan `diktis_data.py` untuk secara cerdas mengklasifikasikan kampus (PTN/PTS, PTKIN/NON-PTKIN, DIKTI/DIKTIS).
  - **Excel Engine**: Mengekspor data mentah JSON menjadi format `.xlsx` dengan *styling*, kolom yang rapi, dan konversi akreditasi secara otomatis.

- **`diktis_data.py`**
  Modul referensi/klasifikasi untuk membantu mengidentifikasi institusi (kampus) di bawah naungan Kemenag vs Kemendikbud.

- **`fetch_prodi.py`**
  Fungsi utilitas untuk menarik referensi daftar program studi awal yang bisa di-*scrape*.

### 📂 Folder `templates/` & `static/`
Bertanggung jawab atas UI/UX (User Interface & User Experience):
- **`templates/index.html`**
  File kerangka antarmuka yang mengimpor pustaka eksternal (Lucide Icons, Chart.js).
- **`static/style.css`**
  File *styling* berskala besar yang mengimplementasikan desain *Glassmorphism*, *Dark Mode*, *Loader Spinners*, dan penataan tata letak responsif menggunakan *Grid* dan *Flexbox*.
- **`static/script.js`**
  Mengatur antarmuka pengguna pada halaman *"Scraping"*. Mengirim permintaan (*request*) ke Flask dan mendengarkan pembaruan langsung (SSE) untuk merender progres secara mulus ke layar.
- **`static/analytics.js`**
  Mesin *dashboard analytics*. Bertugas mengambil *file* Excel yang sudah selesai, menguraikan datanya (*parse*), menormalisasikan *casing* (Title Case), dan merendernya dalam berbagai metrik analitik yang menawan (Bar, Doughnut) melalui konfigurasi cerdas dari *Chart.js*.

---

## 3. Titik Optimasi (Highlights of Optimizations)
Beberapa aspek yang membedakan aplikasi ini dari sistem *scraper* standar:
1. **Thread-Safety & Garbage Collection**: Aplikasi menjamin tidak ada "zombie threads" yang berkeliaran ketika klien memutuskan koneksi tiba-tiba. Terdapat mekanisme *Graceful Shutdown* menggunakan `event.set()`.
2. **Keterbacaan Data UX**: Grafik Chart.js dikonfigurasi menggunakan algoritma khusus untuk `maxBarThickness`, merapikan variabel "Tidak Diketahui", dan penyusunan kategori berdasarkan ukuran jumlah (`sort()`) demi kemudahan interpretasi data.
3. **Robust Data Cleansing**: Normalisasi data secara berlapis di sisi *Backend* saat pengambilan dari API PDDikti, dan di *Frontend* saat merender grafik.

---

## 4. Kesimpulan
Basis kode (codebase) PDDikti Dashboard sangat modular, mudah dirawat (*maintainable*), tangguh, dan aman untuk digunakan di lingkungan produksi (*production scale*). Penggabungan metode asinkron *backend* dan dinamika *dashboard frontend* menjadikan perangkat lunak ini *enterprise-grade*.
