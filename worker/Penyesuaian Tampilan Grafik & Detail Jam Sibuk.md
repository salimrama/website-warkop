# PRD UPDATE: Penyesuaian Tampilan Grafik & Detail Jam Sibuk

## 1. Objective
Memperbaiki tampilan komponen grafik pada halaman Statistik & Laporan agar lebih relevan dengan filter yang dipilih, membuat penunjuk waktu pada grafik lebih intuitif, dan memperkaya data "Transaksi selesai per jam" dengan rincian menu yang dipesan.

## 2. Frontend UI Requirements

### A. Sembunyikan Grafik Tren Pendapatan Harian
- **Logika Visibilitas (Conditional Rendering):** Jika state jenis filter saat ini adalah "Tanggal spesifik" (hanya satu hari), **hilangkan/jangan render** komponen grafik "Tren Pendapatan Harian". 
- Grafik ini hanya logis dan hanya boleh ditampilkan jika pengguna memilih filter "Rentang Tanggal" (Date Range).

### B. Perbaikan Label Waktu pada Grafik Jam Sibuk
- Pada grafik "Jam Sibuk" atau "Transaksi selesai per jam", ubah format label waktu (sumbu X atau label bawah) agar lebih mudah dibaca oleh pengguna.
- Gunakan format waktu 24-jam yang rapi (contoh: `07:00`, `12:00`, `19:00`) alih-alih menampilkan *timestamp* mentah, angka indeks, atau format waktu yang tidak standar. 

### C. Rincian Pesanan pada Detail Transaksi per Jam
- **Pembaruan Tooltip/List:** Saat pengguna mengarahkan kursor (*hover*) ke batang grafik di jam tertentu, atau saat melihatnya dalam mode *List Catatan*, data tidak hanya menampilkan jumlah transaksi.
- Tambahkan daftar detail makanan/minuman/cemilan yang dipesan pada jam tersebut.
- *Contoh tampilan Tooltip:*
  ```text
  Jam: 14:00
  Total Transaksi: 5
  Item Terjual:
  - Kopi Susu (3)
  - Es Teh (2)
  - Indomie Goreng (4)