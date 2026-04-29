# 📘 PANDUAN: Cara Menjalankan PDDikti Dashboard & Scraper Dosen

Selamat! Anda telah mendapatkan salinan proyek **PDDikti Dashboard**. Panduan ini dibuat agar siapa pun, bahkan yang **tidak mengerti coding**, bisa menjalankannya dengan mudah di laptop sendiri, sekaligus memberikan pemahaman cara kerja program ini bagi tim analis data.

---

## 🛠️ 1. Persiapan Awal (Hanya Sekali)
Agar program berjalan, laptop Anda membutuhkan "mesin" bernama **Python**.

1.  Buka **Microsoft Store** di Windows Anda.
2.  Cari **"Python 3.11"** atau versi terbaru.
3.  Klik **Install/Get**. Selesai!
    *(Alternatif: Download dari [python.org](https://www.python.org/downloads/) dan pastikan centang opsi **"Add Python to PATH"** saat instalasi).*

---

## 🚀 2. Cara Menjalankan Program (Sangat Mudah!)

1.  **Download File**: Jika Anda mendapatkan ini dari GitHub, klik tombol hijau **Code** lalu pilih **Download ZIP**. Ekstrak (unzip) folder tersebut.
2.  **Klik 2x File `start.bat`**: Cari file bernama `start.bat` (ikon roda gigi) di dalam folder tadi.
    -   Jendela hitam (Terminal) akan muncul. 
    -   **TUNGGU** sebentar, program sedang menginstal otomatis kebutuhan sistem.
    -   Jika muncul tulisan hijau **`READY`** dan alamat **`http://localhost:5000`**, berarti server sudah aktif.
3.  **Buka Browser**: Buka Chrome/Edge, lalu ketik: **`localhost:5000`** di address bar.
4.  **Selesai!** Dashboard siap digunakan.

> [!IMPORTANT]
> **DILARANG MENUTUP JENDELA HITAM**: Selama Anda menggunakan website dashboard, jendela hitam (`start.bat`) tadi harus tetap terbuka. Jika ditutup, website akan mati.

---

## ☁️ 3. Alternatif: Tanpa Install (Via GitHub Codespaces)
Jika Anda tidak mau menginstal Python, Anda bisa menjalankan program ini langsung dari *Browser* (gratis via akun GitHub):

1.  Buka link repository GitHub proyek ini.
2.  Klik tombol hijau **`<> Code`**.
3.  Pilih tab **`Codespaces`**, lalu klik tombol biru **`Create codespaces on main`**.
4.  Tunggu sebentar hingga muncul tampilan "Visual Studio Code" di dalam browser.
5.  Di jendela terminal (layar hitam di bawah), ketik perintah ini lalu tekan **Enter**:
    ```bash
    pip install -r requirements.txt
    ```
6.  Tunggu proses instalasi selesai, lalu ketik perintah ini dan tekan **Enter**:
    ```bash
    python app.py
    ```
7.  Akan muncul notifikasi di pojok kanan bawah, klik **"Open in Browser"**.

---

## 🖥️ 4. Cara Menggunakan Dashboard
1.  **Cari & Pilih Jurusan**: Ketik nama jurusan (misal: "Hukum") di kolom pencarian, lalu centang kotak di samping nama jurusan yang diinginkan. Anda bisa memilih banyak sekaligus!
2.  **Jalankan Scraper**: Klik tombol biru **"Jalankan Scraper"**.
3.  **Pantau Proses**: Lihat progres (log) pengambilan data di layar. Tunggu sampai selesai 100%.
4.  **Download Hasil**: Hasil akhir berupa file **Excel (.xlsx)** bisa langsung didownload melalui tabel "Output Archive" di bagian kanan website.

---

## 🧠 5. Cara Kerja Klasifikasi Data (Untuk Analis)

Program ini sangat pintar dalam menentukan status sebuah Perguruan Tinggi secara otomatis. Berikut adalah bagaimana kolom **PTN/PTS**, **PTKIN/NON PTKIN**, dan **DIKTI/DIKTIS** di Excel diisi:

### Strategi "2-Tier Classification"
Sistem menggunakan metode 2 tahap untuk menjamin akurasi data hingga 99%:

**Tahap 1 (Primary): Pemetaan Definitif**
Program membaca langsung data `pembina` dari database resmi PDDikti dan melakukan mapping mutlak (tanpa tebak-tebakan):
- Jika pembina adalah `PTA Islam Negeri` ➔ Otomatis masuk kategori **DIKTIS**, **PTN**, dan **PTKIN**.
- Jika pembina adalah `PTA Islam Swasta` ➔ Otomatis masuk kategori **DIKTIS**, **PTS**, dan **NON PTKIN**.
- Jika pembina berawalan `LLDIKTI...` ➔ Otomatis masuk kategori **DIKTI**, **PTS**, dan **NON PTKIN**.
- Jika pembina adalah `PTN` ➔ Otomatis masuk kategori **DIKTI**, **PTN**, dan **NON PTKIN**.

**Tahap 2 (Fallback Heuristik): Analisis Cerdas**
Terkadang, database PDDikti mengalami *error* atau nilai `pembina` kosong/blank. Jika ini terjadi, program tidak menyerah, melainkan menganalisis menggunakan metode berlapis:
1. **Whitelist PTKIN**: Program otomatis men-download daftar nama UIN/IAIN/STAIN terbaru dari web resmi SPAN-PTKIN setiap kali dijalankan. Jika nama kampus ada di sana, statusnya pasti PTN, PTKIN, dan DIKTIS.
2. **Deteksi Nama**: Program mencari kata kunci spesifik di nama kampus (contoh: "Universitas Muhammadiyah", "STAI", "UIN", dll.) untuk menentukan apakah ia DIKTIS atau DIKTI.
3. **Deteksi Keyword Tambahan**: Program mencari kata "Negeri", "Islam", atau "Agama" di data lain (seperti nama kelompok) untuk melengkapi sisa klasifikasi.

> [!TIP]
> **Anti-Blank Data**: Berkat sistem Fallback ini, kolom klasifikasi di Excel Anda **tidak akan pernah kosong**, bahkan saat API PDDikti pusat sedang bermasalah.

---

## ⚠️ 6. Tanya Jawab (Troubleshooting)

**Q: Jendela hitam `start.bat` muncul lalu langsung menghilang!**
- **A:** Python belum terinstal, atau belum masuk ke pengaturan "PATH" Windows. Coba install ulang Python dan **PASTIKAN** mencentang kotak *"Add Python.exe to PATH"* di layar awal instalasi.

**Q: Proses scraping berhenti di tengah jalan / Macet!**
- **A:** Anda bisa menekan tombol merah **"Stop"** di dashboard. Program akan membatalkan proses dengan aman tanpa merusak struktur file Excel yang sedang dibuat.

**Q: Bagaimana cara update aplikasinya?**
- **A:** Cukup download file ZIP versi terbaru dari GitHub, ekstrak, lalu gunakan folder yang baru. Tim pengembang kami secara berkala merilis pembaruan untuk menjaga akurasi program.

---
*Dibuat untuk memudahkan pengumpulan dan analisis data dosen dari PDDikti secara otomatis, cepat, dan terpercaya.*
