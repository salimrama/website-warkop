# BUG FIX: Error "Gagal mengambil tren pendapatan" pada Filter Tanggal Spesifik

## 1. Problem Description
Di halaman Statistik Dashboard Manager, saat pengguna memilih "Jenis filter tanggal: Tanggal spesifik" dan mengatur tanggalnya, muncul banner error berwarna merah dengan pesan: "Gagal mengambil tren pendapatan."
Hal ini menandakan ada kegagalan *fetch API* atau *crash* pada *backend* saat menangani kueri parameter tanggal tunggal.

## 2. Expected Behavior
Saat "Tanggal spesifik" dipilih, *backend* harus merespons dengan data pendapatan yang valid (berupa array atau objek kosong jika tidak ada penjualan) dengan kode status 200 OK, sehingga *frontend* dapat memperbarui angka/grafik tanpa menampilkan error.

## 3. Execution Instructions for AI

### A. Periksa Frontend API Call
1. Buka komponen UI Statistik. Periksa fungsi `fetch` atau `axios` yang mengambil tren pendapatan.
2. Pastikan parameter tanggal dari `<input type="date">` dikirim dengan format ISO standar `YYYY-MM-DD` (bukan format lokal seperti `MM/DD/YYYY`).
3. Pastikan pengiriman parameter cocok. Misalnya, jika "Tanggal spesifik" dipilih, kirim `?date=YYYY-MM-DD`. Jika rentang, kirim `?startDate=...&endDate=...`.

### B. Perbaiki Backend Controller & SQL Query
1. Buka file *controller* statistik (misal `controllers/statisticsController.js` atau sejenisnya) yang menangani rute tren pendapatan.
2. Cek apakah ada logika kondisional untuk menangani parameter `date` tunggal.
3. Perbaiki *query database* (SQLite/MySQL). Gunakan fungsi formatting seperti `DATE(created_at)` untuk menyocokkan tanggal secara presisi dengan parameter yang dikirim.
4. Tangani *error catching* dengan benar. Jangan biarkan *backend* *crash*. Jika data kosong pada tanggal tersebut, kembalikan data bawaan (misal `[]` atau nilai `0`) agar *chart* di *frontend* tidak *error*.

### C. Validasi UI
Pastikan *state error* "Gagal mengambil tren pendapatan" di-*reset* ulang menjadi *false* setiap kali pengguna mengganti filter tanggal, sebelum melakukan pemanggilan API yang baru.