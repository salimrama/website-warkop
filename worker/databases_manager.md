# PRD: Fitur Database Viewer & Ekspor (Manager Dashboard)

## 1. Objective
Menambahkan menu baru bernama "Database" atau "Ekspor Data" di Dashboard Manager. Fitur ini berfungsi sebagai *viewer* (hanya baca/read-only) untuk melihat isi tabel-tabel mentah di dalam database SQLite/MySQL, dan menyediakan tombol untuk menyalin (copy) data tersebut agar bisa ditempel (*paste*) dengan rapi ke Microsoft Excel atau Google Sheets.

## 2. Frontend UI Requirements (Manager Dashboard)

### A. Navigasi & Tata Letak
- Tambahkan menu **"Database"** di *sidebar* atau *header* navigasi Manager.
- Di halaman Database, buat elemen **Dropdown/Tabs** untuk memilih tabel mana yang ingin dilihat. Tabel yang tersedia minimal:
  - `orders` (Data Transaksi Utama)
  - `order_items` (Rincian Item yang Dipesan)
  - `menu` (Katalog Makanan/Minuman)
  - `users` (Data Karyawan/Manajer)

### B. Tampilan Tabel Data
- Saat sebuah tabel dipilih, tampilkan datanya secara mentah di dalam elemen HTML Table yang memiliki *scroll* horizontal (agar kolom yang banyak tidak merusak *layout*).
- Tampilkan nama kolom tabel di bagian *header* (<th>), dan isi datanya di baris bawahnya (<td>).

### C. Fitur Ekspor / Salin Data ke Excel
- Tambahkan dua tombol aksi di atas tabel data:
  1. **"Salin Data (Excel)"**: Menggunakan `navigator.clipboard.writeText`. AI harus memformat data array/JSON menjadi string TSV (*Tab-Separated Values*) di mana antar kolom dipisah dengan `\t` dan antar baris dipisah dengan `\n`. Format ini akan otomatis rapi saat di-*paste* ke sel Excel.
  2. **"Download CSV"** *(Opsional tapi direkomendasikan)*: Men-generate file `.csv` dari data yang tampil dan memicu unduhan di browser.
- Tampilkan notifikasi/toast sukses ketika data berhasil disalin.

## 3. Backend API & Security Updates

### A. Endpoint API Baru (`/api/database/export`)
- Buat *route* baru (contoh: `GET /api/database/:tableName`) yang menerima nama tabel sebagai parameter.
- **Keamanan Ketat (Otorisasi Manager):** Pastikan *endpoint* ini dilindungi oleh *middleware* otentikasi dan pengecekan *role*. HANYA akun dengan *role* 'Manager' yang boleh mengaksesnya.
- **Keamanan Data:** Jika tabel `users` diminta, pastikan kolom `password` (hash bcrypt) di-*exclude* atau dihilangkan dari hasil *query* sebelum dikirim ke *frontend*.

### B. Logika Query (SQLite/MySQL)
- Jalankan *query* `SELECT * FROM [tableName]` (pastikan nama tabel di-validasi menggunakan daftar tabel yang diizinkan (*whitelist*) untuk mencegah SQL Injection).
- Urutkan data berdasarkan yang terbaru (misalnya `ORDER BY created_at DESC` atau berdasarkan ID).

## 4. Execution Instructions for AI
1. **Backend First:** Buat rute dan *controller* untuk `/api/database/:tableName`. Terapkan *whitelist* tabel (hanya izinkan 'orders', 'order_items', 'menu', 'users'). Buat *query* SELECT dan pastikan data sensitif seperti *password hash* tidak ikut terkirim.
2. **Frontend UI:** Buat halaman/komponen baru `DatabaseViewer.jsx` untuk Manager. Tambahkan ke *routing* utama dan *sidebar* Manager.
3. **Fungsi Konversi TSV/CSV:** Tulis fungsi JavaScript murni di *frontend* yang menerima array JSON dari *backend*, mengambil *keys* objek sebagai *header*, lalu menggabungkan *values*-nya dengan karakter tab (`\t`) untuk fitur "Salin Data".
4. **Testing:** Pastikan tidak ada *error* saat mengubah pilihan tabel dari *dropdown*, dan pastikan tabel yang panjang tetap bisa di-*scroll* dengan baik di layar.