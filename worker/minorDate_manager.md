# PRD FIX: Penyederhanaan Filter Statistik Menjadi Input Date Standar

## 1. Objective
Sederhanakan seluruh filter waktu pada halaman "Statistik & Laporan" di Manager Dashboard. Batalkan penggunaan dropdown (Tahun, Bulan, Hari) dari instruksi sebelumnya, dan ganti semuanya menggunakan elemen bawaan HTML `<input type="date">` yang jauh lebih sederhana dan efektif.

## 2. Frontend UI Requirements

### A. Hapus Filter Dropdown Lama
- Hapus seluruh elemen `<select>` atau dropdown untuk Tahun, Bulan, dan Hari dalam minggu yang sebelumnya dibuat.

### B. Implementasi Input Date Standar
Ganti tata letak filter waktu menjadi dua opsi sederhana menggunakan kalender bawaan browser:
1. **Filter Tanggal Spesifik (1 Hari Saja):**
   - Gunakan satu elemen `<input type="date">` dengan label "Pilih Tanggal".
   - Jika ini diisi, maka data yang ditampilkan hanya untuk tanggal tersebut saja.
2. **Filter Rentang Tanggal (Date Range):**
   - Gunakan dua elemen `<input type="date">` dengan label "Dari Tanggal" dan "Sampai Tanggal".
   - Jika ini diisi, data yang ditampilkan mencakup rentang waktu tersebut.

## 3. Backend API & Query Logic Updates
- **Parsing Data Tanggal:** Pastikan parameter yang dikirim dari *client* (berformat `YYYY-MM-DD` dari input date) diterima dengan benar oleh *controller* `/api/statistics`.
- **Query Database:** 
  - Jika parameter "Tanggal Spesifik" dikirim, gunakan operator `=` atau `LIKE` untuk memfilter `created_at` tepat pada hari tersebut.
  - Jika parameter "Dari Tanggal" dan "Sampai Tanggal" dikirim, gunakan operator `>=` dan `<=` (atau `BETWEEN`) untuk menyaring rentang waktu transaksi secara akurat.

## 4. Execution Instructions for AI
1. Buka komponen UI Statistik di Manager Dashboard dan hapus kode filter dropdown (Tahun/Bulan/Hari) yang lama.
2. Ganti dengan elemen `<input type="date">` untuk "Tanggal Spesifik" dan "Rentang Tanggal".
3. Perbarui *state management* di React (misal menggunakan `useState`) untuk menangani nilai (value) dari input date tersebut.
4. Periksa *backend controller* untuk memastikan query SQL (SQLite/MySQL) dapat memproses format tanggal `YYYY-MM-DD` yang dikirim dari input tersebut tanpa *error* zona waktu.