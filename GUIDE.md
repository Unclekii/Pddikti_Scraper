# 📘 PANDUAN: Cara Menjalankan PDDikti Dashboard & Scraper Dosen

Selamat! Anda telah mendapatkan salinan proyek **PDDikti Dashboard**. Panduan ini dibuat agar siapa pun, bahkan yang **tidak mengerti coding**, bisa menjalankannya dengan mudah di laptop sendiri.

---

## 🛠️ 1. Persiapan Awal (Hanya Sekali)
Agar program berjalan, laptop anda membutuhkan "mesin" bernama **Python**.

1.  Buka **Microsoft Store** di Windows Anda.
2.  Cari **"Python 3.11"** atau versi terbaru.
3.  Klik **Install/Get**. Selesai!
    *(Alternatif: Download dari [python.org](https://www.python.org/downloads/) dan pastikan centang opsi **"Add Python to PATH"** saat instalasi).*

---

## 🚀 2. Cara Menjalankan Program (Sangat Mudah!)

1.  **Download File**: Jika Anda mendapatkan ini dari GitHub, klik tombol hijau **Code** lalu pilih **Download ZIP**. Ekstrak (unzip) folder tersebut.
2.  **Klik 2x File `start.bat`**: Cari file bernama `start` (ikon roda gigi) di dalam folder tadi.
    -   Jendela hitam (Terminal) akan muncul. 
    -   **TUNGGU** sebentar, program sedang mendownload kebutuhan sistem secara otomatis.
    -   Jika muncul tulisan hijau **`READY`** dan alamat **`http://localhost:5000`**, berarti sudah aktif.
3.  **Buka Browser**: Buka Chrome/Edge, lalu ketik: **`localhost:5000`** di alamat atas.
4.  **Selesai!** Dashboard siap digunakan untuk mengambil data dosen.

> [!IMPORTANT]
> **DILARANG MENUTUP JENDELA HITAM**: Selama Anda menggunakan website dashboard, jendela hitam tadi harus tetap terbuka. Jika ditutup, website akan mati.

---

## 🖥️ 3. Cara Menggunakan Dashboard
1.  **Cari & Pilih Jurusan**: Ketik nama jurusan (misal: "Hukum") di kolom pencarian, lalu centang kotak di sampingnya. Anda bisa pilih banyak sekaligus!
2.  **Jalankan Scraper**: Klik tombol biru **"Jalankan Scraper"**.
3.  **Tunggu Proses**: Pantau proses pengambilan data di layar. Tunggu sampai selesai.
4.  **Download Hasil**: Hasil akhir berupa file Excel bisa langsung didownload melalui tabel yang muncul di bagian bawah website.

---

## ⚠️ 4. Tanya Jawab (Jika Ada Masalah)

**Q: Jendela hitam muncul lalu langsung menghilang!**
- **A:** Kemungkinan besar Python belum terinstall atau belum di-set ke "PATH". Pastikan Anda sudah mengikuti langkah nomor 1 di atas.

**Q: Saya mau update kodenya gimana?**
- **A:** Cukup download versi terbaru dari link GitHub yang diberikan, lalu ganti folder lama dengan yang baru.

---
*Dibuat untuk memudahkan pengumpulan data dosen dari PDDikti secara otomatis.*
