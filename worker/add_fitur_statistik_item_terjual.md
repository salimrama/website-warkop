# PRD UPDATE: Peningkatan Detail & Kompleksitas Data Transaksi per Jam

## 1. Objective
Memperbaiki tampilan "Transaksi Selesai per Jam" yang saat ini terlalu menumpuk. Kita perlu memperkaya data agar menampilkan total item terjual, serta memecahnya berdasarkan kategori (Makanan, Minuman, Cemilan) baik pada mode Tampilan Grafik maupun List Catatan (Tabel).

## 2. Backend API & Query Logic Updates
- **Modifikasi Endpoint Jam Sibuk (`/api/statistics/peak-hours`):**
  - Ubah query SQL agar tidak hanya menghitung `Jumlah Transaksi` per jam, tetapi juga:
    1. **Total Keseluruhan Item Terjual:** `SUM(order_items.quantity)`
    2. **Total per Kategori:** Lakukan kondisional agregasi (misal di SQLite/MySQL: `SUM(CASE WHEN menu.category = 'makanan' THEN order_items.quantity ELSE 0 END) as total_makanan`, dan seterusnya untuk `minuman` dan `cemilan`).
    3. **Rincian Item:** Kembalikan array objek rincian pesanan yang lebih rapi (nama item dan jumlahnya) bukan string yang digabung secara mentah.
  - Pastikan respons JSON per jam mengembalikan bentuk objek seperti ini:
    `{ jam: '10:00', jumlahTransaksi: 2, totalItem: 5, makanan: 2, minuman: 2, cemilan: 1, detailItems: [{nama: 'Es Teh', qty: 2}, ...] }`

## 3. Frontend UI Requirements

### A. Tampilan Tabel (List Catatan)
- Rombak struktur tabel saat ini. Buat kolom menjadi lebih detail dan informatif:
  - **Kolom 1: Jam**
  - **Kolom 2: Jumlah Transaksi**
  - **Kolom 3: Total Item Terjual**
  - **Kolom 4: Ringkasan Kategori** (Tampilkan badge atau teks rapi: `🍔 Makanan: X | 🥤 Minuman: Y | 🍟 Cemilan: Z`).
  - **Kolom 5: Rincian Item** (Tampilkan list item dalam bentuk *tags* atau daftar *bullet* kecil ke bawah agar tidak memanjang menyamping).

### B. Tampilan Grafik (Chart View)
- Pertahankan grafik batang/garis untuk Tren Jam Sibuk, namun tingkatkan fungsionalitas **Tooltip** (kotak info saat kursor di-hover ke grafik).
- Saat *hover* di jam tertentu, Tooltip wajib menampilkan rincian kompleks berikut secara rapi ke bawah:
  ```text
  Jam: 10:00
  -------------------------
  Total Transaksi : 2
  Total Item      : 5
  -------------------------
  🍔 Makanan Terjual : 2
  🥤 Minuman Terjual : 2
  🍟 Cemilan Terjual : 1