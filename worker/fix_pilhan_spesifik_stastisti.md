# PRD FIX: Perbaikan Input Filter Periode Spesifik (Tahun & Hari)

## 1. Objective
Memperbaiki UI dan logika filter "Periode Spesifik" pada halaman Statistik & Laporan di Dashboard Manager. Input manual harus diganti menjadi *dropdown* (*select box*) agar input data lebih valid dan tidak membingungkan.

## 2. Frontend UI Requirements

### A. Filter Tahun (Year)
- **Hapus input teks manual:** Pengguna tidak boleh mengetik tahun secara manual.
- **Ubah menjadi Dropdown (`<select>`):**
  - Buat pilihan tahun yang dimulai secara statis dari **2023** hingga tahun berjalan (misalnya 2023, 2024, 2025, 2026, dst).
  - Tambahkan opsi default seperti "Pilih Tahun" atau "Semua Tahun".

### B. Filter Hari (Day of the Week)
- **Hapus Date Picker (Tanggal spesifik):** Jangan gunakan kalender untuk memilih tanggal di bagian ini.
- **Ubah menjadi Dropdown (`<select>`):**
  - Buat pilihan statis nama hari dalam seminggu: **Senin, Selasa, Rabu, Kamis, Jumat, Sabtu, Minggu**.
  - Tambahkan opsi default seperti "Semua Hari".

### C. Filter Bulan (Month)
- Pastikan input bulan juga sudah menggunakan *dropdown* (Januari - Desember), bukan input angka atau teks manual.

## 3. Backend API & Query Logic Updates
- **Filter Hari (Day of the Week):**
  - Sesuaikan *controller* `/api/statistics` agar bisa menerima parameter `dayOfWeek` (misalnya string 'Senin' atau angka 1-7).
  - Update logika SQL (SQLite/MySQL) untuk mengekstrak hari dari kolom `created_at` (contoh di SQLite: menggunakan `strftime('%w', created_at)` dan memetakannya ke nama hari).
- **Filter Tahun (Year):**
  - Pastikan parameter `year` langsung memfilter data transaksi yang terjadi pada tahun tersebut secara akurat.

## 4. Execution Instructions for AI
1. Cari file komponen UI yang menangani filter Statistik di Manager Dashboard.
2. Ganti elemen `<input>` untuk Tahun menjadi `<select>` dengan *looping* array dari 2023 sampai tahun saat ini.
3. Ganti elemen `<input type="date">` untuk Hari menjadi `<select>` dengan opsi nama-nama hari (Senin - Minggu).
4. Periksa kembali *endpoint* API dan *query* SQL di *backend* agar parameter pencarian berdasarkan "Nama Hari" dan "Tahun spesifik" berfungsi dengan presisi.