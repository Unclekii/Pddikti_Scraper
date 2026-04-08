# 📘 PANDUAN LENGKAP: PDDikti Dashboard & Scraper Dosen

Panduan ini disusun untuk siapa saja, bahkan bagi Anda yang **tidak memiliki pengalaman coding** atau tidak punya aplikasi khusus (seperti VS Code/PyCharm). Cukup gunakan apa yang sudah ada di laptop Anda!

---

## 🛑 1. Persiapan Awal (Hanya Sekali)
Sebelum bisa menjalankan program, laptop Anda harus sudah memiliki "mesin" Python.

### Cara Instal Python (Paling Mudah):
1.  Buka **Microsoft Store** di Windows Anda.
2.  Cari **"Python 3.11"** atau versi terbaru.
3.  Klik **Install/Get**. Selesai!
    *Alternatif: Download dari [python.org](https://www.python.org/downloads/) dan pastikan centang opsi **"Add Python to PATH"** saat instalasi.*

---

## 🚀 2. Cara Menjalankan Program (Local Laptop)
Gunakan cara ini jika file ada di harddisk laptop Anda.

1.  **Buka Folder Proyek**: Buka folder tempat Anda menyimpan file-file ini.
2.  **Klik 2x File `start.bat`**: Cari file yang ikonnya seperti "roda gigi" atau bernama `start`.
    *   Sebuah jendela hitam (Terminal) akan muncul. 
    *   **TUNGGU** sampai proses instalasi selesai (hanya di awal).
    *   Jika sudah muncul tulisan **"Buka browser: http://localhost:5000"**, berarti program sudah aktif.
3.  **Buka Browser**: Ketik alamat **`http://localhost:5000`** di Chrome atau Edge.
4.  **DILARANG MENUTUP JENDELA HITAM**: Selama Anda memakai website dashboard, jendela hitam tadi harus tetap terbuka. Jika ditutup, website akan mati.

---

## ☁️ 3. Cara Menjalankan di Google Colab (Tanpa Instal ke Laptop)
Jika Anda ingin menjalankan program lewat internet tanpa instal apa pun di laptop:

1.  Upload seluruh folder ini ke **Google Drive** Anda.
2.  Buka [Google Colab](https://colab.research.google.com/).
3.  Klik **File > Upload Notebook** dan pilih file **`Run_on_Colab.ipynb`** yang sudah saya sediakan di folder ini.
4.  Ikuti petunjuk di dalam notebook tersebut untuk mendapatkan "Link Publik" agar bisa membuka Dashboard.

---

## 🖥️ 4. Cara Menggunakan Dashboard (Langkah User)
1.  **Update Data**: Klik tombol **"Fetch Data Prodi"** untuk menyegarkan daftar jurusan dari PDDikti.
2.  **Pilih Jurusan**: Cari nama jurusan (misal: "Hukum") lalu centang kotak di sampingnya. Anda bisa pilih banyak sekaligus!
3.  **Jalankan Scraper**: Klik tombol biru **"Jalankan Scraper"**.
4.  **Lihat Log**: Pantau proses di bagian bawah. Tunggu sampai tertulis "Done" atau selesai.
5.  **Download Hasil**: Hasilnya berupa file Excel bisa didownload melalui tabel yang muncul di bagian bawah website.

---

## ⚠️ 5. Tanya Jawab (Troubleshooting)

**Q: Jendela hitam muncul lalu langsung menghilang!**
*   **A:** Berarti ada masalah di Python Anda. Coba klik kanan file `start.bat` lalu pilih "Edit". Pastikan Python sudah terinstal dengan benar.

**Q: Saya tidak melihat folder 'output'!**
*   **A:** Folder `output` akan terbuat secara otomatis saat pertama kali Anda melakukan scraping.

**Q: Apakah data saya aman?**
*   **A:** Aman. Program ini hanya membaca data publik dari website PDDikti dan menyimpannya di laptop Anda sendiri.

---
*Dibuat untuk memudahkan Anda dalam pengumpulan data dosen.*
