# Dokumentasi Teknis Sistem Point of Sale (POS) & Self-Ordering Warkop

Dokumentasi komprehensif ini mencakup arsitektur sistem, struktur repositori, alur logika aplikasi, spesifikasi API & WebSocket, serta panduan instalasi dan deployment pada jaringan lokal (LAN/Wi-Fi).

---

## DAFTAR ISI
1. [Overview Proyek & Arsitektur Sistem](#1-overview-proyek--arsitektur-sistem)
   - [Deskripsi Proyek](#deskripsi-proyek)
   - [Tech Stack](#tech-stack)
   - [Topologi Jaringan Lokal (LAN)](#topologi-jaringan-lokal-lan)
2. [Struktur Folder & Penjelasan File](#2-struktur-folder--penjelasan-file)
   - [Representasi Visual Directory Tree](#representasi-visual-directory-tree)
   - [Penjelasan Fungsi Direktori](#penjelasan-fungsi-direktori)
   - [Penjelasan Detail Setiap File Inti](#penjelasan-detail-setiap-file-inti)
3. [Alur Logika & Cara Kerja Aplikasi](#3-alur-logika--cara-kerja-aplikasi)
   - [Alur Pelanggan (Customer Ordering Flow)](#alur-pelanggan-customer-ordering-flow)
   - [Sistem Penguncian Meja (Table Lock System)](#sistem-penguncian-meja-table-lock-system)
   - [Alur Kasir (Cashier Real-time Monitoring & TV Display)](#alur-kasir-cashier-real-time-monitoring--tv-display)
   - [Alur Manajer (Manager Backoffice & Analytics)](#alur-manajer-manager-backoffice--analytics)
4. [Spesifikasi API & Real-time Socket.io Events](#4-spesifikasi-api--real-time-socketio-events)
   - [Daftar REST API Endpoints](#daftar-rest-api-endpoints)
   - [Daftar Socket.io Events](#daftar-socketio-events)
5. [Panduan Setup & Menjalankan Aplikasi](#5-panduan-setup--menjalankan-aplikasi)
   - [Prasyarat Sistem](#prasyarat-sistem)
   - [Langkah Instalasi Dependencies](#langkah-instalasi-dependencies)
   - [Inisialisasi Database & Seeding Data](#inisialisasi-database--seeding-data)
   - [Konfigurasi Jaringan LAN & Firewall](#konfigurasi-jaringan-lan--firewall)
   - [Eksekusi Menjalankan Aplikasi](#eksekusi-menjalankan-aplikasi)
   - [Troubleshooting & Solusi Masalah Umum](#troubleshooting--solusi-masalah-umum)

---

## 1. Overview Proyek & Arsitektur Sistem

### Deskripsi Proyek
Aplikasi **Warkop POS & Self-Ordering System** adalah platform web terpadu yang dirancang untuk mendigitalisasi operasional warung kopi modern. Sistem ini menghilangkan antrean kasir manual dengan menyediakan fitur pemesanan mandiri oleh pelanggan dari meja masing-masing menggunakan smartphone, yang langsung terhubung secara *real-time* ke layar monitor/TV kasir dan panel kendali manajer.

Aplikasi ini didesain khusus untuk beroperasi pada lingkungan **Local Area Network (LAN / Wi-Fi)** lokal tanpa ketergantungan pada koneksi internet cloud eksternal untuk pemrosesan order dan komunikasi socket.

### Tech Stack
| Lapisan / Komponen | Teknologi | Keterangan & Versi |
|---|---|---|
| **Frontend Framework** | React.js | v18.3, Single Page Application berbasis fungsional komponen & hooks |
| **Build Tool & Bundler** | Vite | v6.0, HMR super cepat, build ringan, bound ke `0.0.0.0` |
| **Styling & CSS** | Tailwind CSS | v3.4, PostCSS, Autoprefixer, kustomisasi keyframe animations |
| **Routing** | React Router DOM | v6.28, Client-side routing dengan Role-Based Route Guards |
| **Icons & Visual** | Lucide React | v0.468, Set icon SVG modern dan ringan |
| **HTTP Client** | Axios | v1.7, Instance terpusat dengan Request & Response Interceptors |
| **Backend Runtime** | Node.js | v20+ / v26+, Express.js v4.21 |
| **Real-time WebSockets** | Socket.io | v4.8 (Server & Client), latensi rendah event-driven protocol |
| **Database Engine** | MySQL | v8.0 (Containerized via Docker / MariaDB) |
| **Database Driver** | `mysql2/promise` | v3.12, Connection pool & transactional atomic queries |
| **Security & Auth** | JWT & Bcrypt.js | `jsonwebtoken` v9.0, `bcryptjs` v3.0 (Salting 10 rounds) |
| **Process Orchestration** | Concurrently | v9.1, Eksekusi paralel multi-proses dalam satu perintah |

### Topologi Jaringan Lokal (LAN)

```
                    ┌──────────────────────────────────────────────┐
                    │               Wi-Fi Router Warkop            │
                    │         Subnet: 192.168.100.0/24             │
                    └──────────────────────┬───────────────────────┘
                                           │
         ┌─────────────────────────────────┼─────────────────────────────────┐
         │ (DHCP IP: 192.168.100.12)       │ (DHCP Client)                   │ (DHCP Client)
         ▼                                 ▼                                 ▼
┌───────────────────────────────┐ ┌───────────────────────────────┐ ┌───────────────────────────────┐
│       SERVER HOST LOKAL       │ │      SMARTPHONE PELANGGAN     │ │       MONITOR / TV KASIR      │
│  (PC Kasir / Linux CachyOS)   │ │    (Browser Mobile Safari/    │ │     (Tablet / PC Layar Besar) │
│                               │ │            Chrome)            │ │                               │
│  - Docker: MySQL (Port 3306)  │ │                               │ │                               │
│  - Express API: 0.0.0.0:5000  │ │  Mengakses:                   │ │  Mengakses:                   │
│  - Vite Server: 0.0.0.0:5173  │ │  http://192.168.100.12:5173/  │ │  http://192.168.100.12:5173/  │
│                               │ │                               │ │  cashier                      │
└───────────────────────────────┘ └───────────────────────────────┘ └───────────────────────────────┘
```

#### Mekanisme Dynamic Host Resolution
Masalah umum aplikasi web lokal adalah IP server yang dapat berubah sewaktu-waktu akibat DHCP router. Untuk mencegah kerusakan koneksi:
1. Server Express diikat (*bound*) ke host `0.0.0.0:5000` (menerima koneksi dari semua kartu jaringan, baik loopback `127.0.0.1` maupun Wi-Fi `192.168.x.x`).
2. Server Vite diikat (*bound*) ke `0.0.0.0:5173`.
3. Frontend tidak melakukan *hardcode* IP server. Di file `frontend/src/utils/config.js`, backend URL diturunkan secara dinamis:
   ```javascript
   const backendBaseUrl = `${window.location.protocol}//${window.location.hostname}:5000`;
   export const API_BASE_URL    = import.meta.env.VITE_API_URL    || `${backendBaseUrl}/api`;
   export const SOCKET_BASE_URL = import.meta.env.VITE_SOCKET_URL || backendBaseUrl;
   ```
   Artinya, ketika smartphone pelanggan membuka `http://192.168.100.12:5173`, aplikasi secara otomatis menargetkan API dan Socket ke `http://192.168.100.12:5000` tanpa konfigurasi manual ulang.

---

## 2. Struktur Folder & Penjelasan File

### Representasi Visual Directory Tree

```
app-warkop/
├── docker-compose.yml              # Konfigurasi container service MySQL 8.0
├── ensure-db.sh                    # Shell script auto-check & start MySQL port 3306
├── package.json                    # Root manifest orchestrator (concurrently scripts)
├── start.sh                        # Shell script satu-klik untuk menjalankan seluruh sistem
│
├── backend/                        # Direktori Layanan Backend (Node.js & Express)
│   ├── .env                        # Environment variables (DB credentials, JWT secrets)
│   ├── .gitignore                  # Git ignore rules untuk backend
│   ├── dev.js                      # Smart dev launcher (mencegah bentrok port 5000)
│   ├── package.json                # Dependencies backend (express, mysql2, socket.io, dll)
│   ├── schema.sql                  # Skema basis data relasional & initial seed SQL
│   ├── seed-menus.js               # Skrip seeder mandiri katalog menu (16 item warkop)
│   ├── seed-users.js               # Skrip seeder mandiri user default kasir & manajer
│   ├── server.js                   # Entry point Express, HTTP server, dan Socket.io
│   └── src/
│       ├── config/
│       │   └── db.js               # Konfigurasi Pool koneksi MySQL2 (Promise-based)
│       ├── controllers/
│       │   ├── authController.js   # Logika login & profil autentikasi JWT
│       │   ├── menuController.js   # Logika CRUD katalog menu makanan/minuman
│       │   ├── orderController.js  # Logika transaksi order, riwayat, dan analitik omset
│       │   ├── tableController.js  # Logika listing meja & broadcast buka kunci meja
│       │   └── userController.js   # Logika manajemen staf/karyawan warkop
│       ├── middlewares/
│       │   └── authMiddleware.js   # Verifikasi token JWT & validasi Role Guard (RBAC)
│       └── routes/
│           └── index.js            # Router sentral pendaftaran seluruh endpoint REST API
│
└── frontend/                       # Direktori Layanan Frontend (React.js & Vite)
    ├── index.html                  # HTML entry point aplikasi React
    ├── package.json                # Dependencies frontend (react, router, socket.io-client)
    ├── postcss.config.js           # Konfigurasi compiler Tailwind CSS
    ├── tailwind.config.js          # Pengaturan tema, warna kustom, dan animasi UI
    ├── vite.config.js              # Konfigurasi Vite server host binding 0.0.0.0
    └── src/
        ├── App.jsx                 # Routing utama & hierarki route terproteksi
        ├── main.jsx                # Bootstrap React DOM rendering root
        ├── index.css               # Directive dasar Tailwind (@tailwind base/components)
        ├── components/
        │   ├── CartSidebar.jsx     # Panel keranjang geser (Sidebar desktop / Bottom sheet HP)
        │   ├── MenuCard.jsx        # Kartu item menu dengan kontrol kuantitas (+/-)
        │   ├── ProtectedRoute.jsx  # Guard komponen pelindung rute kasir & manajer
        │   ├── TableSelector.jsx   # Grid seleksi nomor meja (1-20) dengan indikator status
        │   └── Toast.jsx           # Komponen notifikasi pop-up dinamis (sukses/error)
        ├── pages/
        │   ├── Customer.jsx        # Halaman antarmuka utama pemesanan pelanggan
        │   ├── Cashier.jsx         # Layar monitor TV kasir & audio alert pesanan baru
        │   ├── Login.jsx           # Halaman login otentikasi staf & manajer
        │   └── Manager.jsx         # Panel dashboard manajer (analitik, order, menu, staf)
        └── utils/
            ├── api.js              # Instance Axios terkonfigurasi dengan bearer token interceptor
            └── config.js           # Resolusi otomatis URL backend & socket berbasis hostname
```

### Penjelasan Fungsi Direktori

- **`/` (Root Project):** Mengorkestrasi seluruh aplikasi, menyatukan frontend, backend, dan database agar dapat diinstal, dijalankan, dan dimatikan secara serentak.
- **`/backend`:** Menyediakan server API RESTful, mengelola persistensi data relasional MySQL, memproses otentikasi JWT, dan memancarkan (*broadcast*) event real-time melalui Socket.io.
- **`/backend/src/config`:** Berisi file konfigurasi infrastruktur backend, khususnya *connection pool* basis data MySQL.
- **`/backend/src/controllers`:** Memisahkan logika bisnis dari rute. Menerima request HTTP, memvalidasi input, melakukan query basis data menggunakan transaksi, dan mengembalikan response JSON yang terstruktur.
- **`/backend/src/middlewares`:** Berisi fungsi interceptor sebelum controller dieksekusi, bertugas memvalidasi token JWT dan memverifikasi apakah role pengguna berhak mengakses endpoint terkait.
- **`/backend/src/routes`:** Mendefinisikan pemetaan endpoint HTTP (GET, POST, PUT, PATCH, DELETE) ke fungsi controller yang sesuai.
- **`/frontend`:** Proyek Single Page Application (SPA) berbasis React.js yang memberikan pengalaman pengguna responsif, cepat, dan interaktif.
- **`/frontend/src/components`:** Berisi komponen modular UI yang dapat digunakan kembali (*reusable*), seperti pemilih meja, kartu menu, panel keranjang belanja, dan guard otentikasi.
- **`/frontend/src/pages`:** Komponen view level halaman yang merepresentasikan tampilan URL tertentu (`/`, `/login`, `/cashier`, `/manager`).
- **`/frontend/src/utils`:** Fungsi utilitas pembantu, instance HTTP client terstandarisasi, dan penentu URL backend dinamis.

### Penjelasan Detail Setiap File Inti

#### File Root
- **`package.json` (Root):** Mendefinisikan skrip global seperti `npm run dev` yang memicu `./ensure-db.sh` dan menjalankan backend serta frontend secara paralel menggunakan `concurrently`.
- **`start.sh`:** Skrip bash mandiri yang memastikan database MySQL aktif, menjalankan backend di port 5000 di background, menjalankan frontend di port 5173, dan menangkap sinyal `SIGINT/EXIT` untuk mematikan semua sub-proses secara bersih saat pengguna menekan `Ctrl+C`.
- **`ensure-db.sh`:** Skrip pemeriksaan ketersediaan port 3306 via koneksi TCP bash (`/dev/tcp/127.0.0.1/3306`). Jika database belum aktif, skrip secara cerdas mencoba menyalakan container `warkop-mysql` lewat Docker, atau mengaktifkan service `systemctl start mariadb`.
- **`docker-compose.yml`:** Konfigurasi Docker Compose resmi untuk mengangkat container MySQL 8.0 dengan environment tanpa password root, nama database `warkop_db`, dan otomatisasi mounting file `backend/schema.sql` ke direktori inisialisasi `/docker-entrypoint-initdb.d/init.sql`.

#### File Backend
- **`backend/server.js`:** Entry point utama backend. Menginisialisasi Express, membuat server HTTP asli Node.js, mengikat instance Socket.io dengan CORS terbuka (`*`), menyuntikkan instance `io` ke setiap request melalui middleware `req.io = io`, mendaftarkan rute `/api`, dan menjalankan server pada `0.0.0.0:5000`.
- **`backend/dev.js`:** Pembungkus cerdas (*smart wrapper*) sebelum nodemon dijalankan. Melakukan health check cepat ke `http://127.0.0.1:5000/api/health`. Jika backend sudah aktif di background, ia tidak akan menimpa port (menghindari error `EADDRINUSE`).
- **`backend/schema.sql`:** DDL basis data yang mendefinisikan tabel `users`, `tables`, `menus`, `orders`, dan `order_items` beserta relasi kunci asing (*Foreign Keys*), ENUM role, dan seeding 20 nomor meja serta 16 menu dummy awal.
- **`backend/seed-users.js`:** Skrip eksekusi command line untuk meng-insert atau meng-update akun default `manager@warkop.com` (password: `admin123`) dan `kasir@warkop.com` (password: `kasir123`) dengan enkripsi password Bcrypt yang valid.
- **`backend/seed-menus.js`:** Skrip CLI untuk mempopulasikan katalog menu lengkap warkop (makanan, minuman, camilan) beserta harga, deskripsi, dan tautan gambar.
- **`backend/src/config/db.js`:** Menginisialisasi `mysql2/promise` connection pool dengan limit 10 koneksi, zona waktu `+07:00`, dan fungsi pengujian koneksi `testConnection()` yang mendeteksi kegagalan basis data secara komprehensif.
- **`backend/src/controllers/authController.js`:** Memverifikasi kombinasi email dan password menggunakan `bcrypt.compare`. Jika valid dan akun berstatus aktif, menghasilkan signed token JWT yang membawa payload `{ id, name, email, role }`.
- **`backend/src/controllers/orderController.js`:** Inti transaksi pesanan. Fungsi `createOrder` menggunakan **MySQL Transaction** (`beginTransaction`, `commit`, `rollback`) untuk menyimpan header order dan detail `order_items` secara atomik, mengunci status meja ke `occupied`, dan memancarkan event Socket `new_order`. Juga mengelola listing order, riwayat transaksi ber-pagination, analitik omset harian, dan perubahan status pesanan.
- **`backend/src/controllers/tableController.js`:** Mengambil daftar meja dan status ketersediaannya. Memiliki fungsi `unlockTable` yang mengubah status meja menjadi `available` dan memancarkan event `table_unlocked` ke seluruh klien terhubung.
- **`backend/src/controllers/menuController.js`:** Menyediakan fungsi listing menu dengan filter kategori untuk pelanggan, serta fungsi `createMenu`, `updateMenu`, dan `deleteMenu` untuk panel manajer.
- **`backend/src/controllers/userController.js`:** Menyediakan fungsi CRUD akun karyawan, hashing password otomatis sebelum disimpan, dan toggle status aktif karyawan.
- **`backend/src/middlewares/authMiddleware.js`:** Membaca header `Authorization: Bearer <token>`, memverifikasinya terhadap `JWT_SECRET`, serta fungsi `requireRole` yang menolak request dengan status 403 Forbidden jika role pengguna tidak memiliki hak akses yang dipersyaratkan.
- **`backend/src/routes/index.js`:** Router sentral yang memetakan rute publik (menu, meja, order pelanggan, login) dan rute terproteksi (orders kasir, riwayat manajer, manajemen karyawan, manajemen menu).

#### File Frontend
- **`frontend/src/main.jsx`:** Titik masuk React yang me-mount komponen `<App />` ke elemen DOM `#root` dalam mode `<StrictMode>`.
- **`frontend/src/App.jsx`:** Konfigurasi `BrowserRouter` dan deklarasi rute. Melindungi rute `/cashier` untuk role `cashier` & `manager`, serta rute `/manager` eksklusif untuk role `manager` menggunakan wrapper `<ProtectedRoute>`.
- **`frontend/src/pages/Customer.jsx`:** Antarmuka pemesanan pelanggan. Mengatur alur pemilihan meja wajib, modal terkunci, penjelajahan katalog menu dengan filter kategori, keranjang belanja interaktif, pengiriman order via API, serta mendengarkan event Socket `table_unlocked`.
- **`frontend/src/pages/Cashier.jsx`:** Layar TV Monitor kasir. Terhubung ke Socket.io, mendengarkan `new_order`, memicu animasi visual flash berkedip dan suara alarm audio synthesizer ganda, menampilkan status meja dengan tombol "Buka Kunci", serta tombol pembaruan status pesanan (Proses/Selesai).
- **`frontend/src/pages/Manager.jsx`:** Dashboard backoffice manajer bergaya SaaS gelap modern. Menampilkan 4 kartu ringkasan metrik (Omset hari ini, Pesanan hari ini, Pesanan aktif, Total staf), tab riwayat transaksi lengkap, tab kelola menu lengkap (tambah/hapus menu), dan tab kelola akun staf.
- **`frontend/src/pages/Login.jsx`:** Form otentikasi staf dengan fitur "Quick Demo Login" (tombol isi otomatis akun kasir/manajer), visibilitas password toggle, dan pengalihan rute otomatis pasca login sesuai role pengguna.
- **`frontend/src/components/TableSelector.jsx`:** Grid interaktif representasi 20 meja warkop. Menampilkan badge merah "PENUH" untuk meja yang berstatus `occupied` dan menonaktifkan klik pada meja tersebut.
- **`frontend/src/components/MenuCard.jsx`:** Komponen kartu katalog menu dengan visual representatif (foto atau emoji fallback), rincian harga rupiah, dan tombol kontrol penambahan/pengurangan kuantitas keranjang.
- **`frontend/src/components/CartSidebar.jsx`:** Panel keranjang belanja dengan transisi responsif (drawer samping di desktop, bottom sheet di mobile), kalkulasi subtotal otomatis, tombol pengosongan keranjang, dan tombol Checkout.
- **`frontend/src/components/ProtectedRoute.jsx`:** Guard komponen rute. Memeriksa keberadaan token JWT dan role pengguna di `localStorage`. Jika tidak valid, mengalihkan pengguna ke `/login`.
- **`frontend/src/components/Toast.jsx`:** Banner notifikasi mengambang dengan animasi slide-in dan auto-dismiss untuk pesan sukses maupun galat.
- **`frontend/src/utils/api.js`:** Instance Axios terkonfigurasi dengan Request Interceptor yang secara otomatis melampirkan token JWT dari `localStorage`, serta Response Interceptor yang mendeteksi HTTP 401 Unauthorized untuk mengalihkan sesi ke halaman login.
- **`frontend/src/utils/config.js`:** Logika penentuan URL target backend dan Socket.io secara dinamis berdasarkan `window.location.hostname`.
- **`frontend/vite.config.js`:** Konfigurasi Vite server dengan binding eksplisit `host: '0.0.0.0'` dan port `5173`.
- **`frontend/tailwind.config.js`:** Konfigurasi tema Tailwind CSS dengan animasi khusus seperti `slideIn`, `slideDown`, `bounceIn`, `flashBorder`, dan `wiggle`.

---

## 3. Alur Logika & Cara Kerja Aplikasi

```
                       ALUR KERJA END-TO-END APLIKASI WARKOP

 ┌─────────────────────────────────────────────────────────────────────────────┐
 │                           PELANGGAN (SMARTPHONE)                            │
 └──────────────────────────────────────┬──────────────────────────────────────┘
                                        │
           1. Buka Web (/) ─────────────▼───────────── Buka Modal Meja Wajib
                                Pilih Meja (Misal: Meja 05)
                                        │
                                        ▼
            Simpan ke LocalStorage ('selected_table', 'is_table_locked')
            Sembunyikan Pilihan Meja ➔ Kunci Header (🔒 Meja 05)
                                        │
                                        ▼
             Jelajahi Menu (Minuman/Makanan) ➔ Tambah ke Keranjang
                                        │
                                        ▼
                        Klik Checkout (POST /api/orders)
                                        │
    ┌───────────────────────────────────┴───────────────────────────────────┐
    │                                                                       │
    ▼                                                                       ▼
Kosongkan Keranjang Saja                                       MySQL Transaction
Meja Tetap Tersimpan di Storage                             INSERT order + order_items
Modal "Pesanan Berhasil!" Muncul                             UPDATE table 'occupied'
                                                                            │
    ┌───────────────────────────────────────────────────────────────────────┘
    │
    ▼ Broadcast Socket Event: 'new_order'
 ┌─────────────────────────────────────────────────────────────────────────────┐
 │                           MONITOR TV KASIR (/cashier)                       │
 └──────────────────────────────────────┬──────────────────────────────────────┘
                                        │
                    Terima Event Real-time 'new_order'
                                        │
             ┌──────────────────────────┴──────────────────────────┐
             ▼                                                     ▼
    Efek Visual & Audio                                Card Order Muncul Teratas
  - Layar berkedip kuning (Flash)                    - Highlight kuning (8 detik)
  - Banner "PESANAN BARU!"                           - Nomor Meja besar
  - Alarm Beep Ganda (Web Audio)                     - Rincian item & catatan
             │                                                     │
             └──────────────────────────┬──────────────────────────┘
                                        │
                            Kasir Klik "Proses" / "Selesai"
                                        │
                                        ▼
                    Pelanggan Membayar & Meninggalkan Meja
                                        │
                                        ▼
                Kasir Klik "Buka Kunci Meja" (POST /api/tables/:id/unlock)
                                        │
    ┌───────────────────────────────────┴───────────────────────────────────┐
    │                                                                       │
    ▼                                                                       ▼
Database: Meja ➔ 'available'                            Broadcast Socket: 'table_unlocked'
                                                                            │
    ┌───────────────────────────────────────────────────────────────────────┘
    │
    ▼ Klien Pelanggan di Meja 05 Menerima Event
Hapus 'selected_table' & 'is_table_locked' dari LocalStorage
Tampilkan Modal: "Meja Telah Dibuka Kunci" ➔ Buka Kembali Pemilihan Meja
```

### Alur Pelanggan (Customer Ordering Flow)

1. **Akses Awal & Kewajiban Memilih Meja:**
   - Saat pelanggan membuka URL root (`/`), aplikasi mengecek state lokal:
     ```javascript
     const saved = localStorage.getItem('selected_table');
     ```
   - Jika `selected_table` bernilai `null` atau kosong, sistem secara otomatis menampilkan **Modal Pemilihan Meja (Blocking Modal)** dengan backdrop blur. Pelanggan tidak dapat melihat atau memesan menu sebelum memilih nomor meja tempat mereka duduk.
   - Aplikasi mengambil daftar meja aktif via `GET /api/tables`. Meja yang sedang dipakai (`status === 'occupied'`) diberi tanda badge merah **"PENUH"** dan dinonaktifkan (`disabled`) sehingga tidak bisa dipilih.

2. **Penguncian Meja di Sisi Klien:**
   - Ketika pelanggan mengeklik salah satu meja yang berstatus `available`, fungsi `handleSelectTable` dipanggil:
     ```javascript
     localStorage.setItem('selected_table', JSON.stringify(table));
     localStorage.setItem('is_table_locked', 'true');
     setSelectedTable(table);
     ```
   - Setelah state terisi, modal pemilihan meja otomatis hilang dari layar.
   - Pada bar navigasi atas, muncul indikator meja dengan ikon gembok: `🔒 Meja [Nomor]`.
   - **Pencegahan Fraud:** UI tidak menyediakan tombol "Ganti Meja" bagi pelanggan. Hal ini mencegah pelanggan mengubah nomor meja secara sepihak setelah duduk atau membuat pesanan fiktif atas nama meja pelanggan lain.

3. **Pemesanan Menu & Keranjang Belanja:**
   - Pelanggan dapat menavigasi kategori menu menggunakan tab: **Semua, Minuman, Makanan, Camilan**.
   - Setiap kartu menu menampilkan harga resmi, foto representatif, dan tombol tambah kuantitas.
   - Keranjang belanja dikelola melalui React State (`cart`). Pelanggan dapat menambah, mengurangi, atau mengosongkan item sewaktu-waktu. Subtotal dan total harga dihitung secara reaktif.
   - Pada perangkat mobile, jika keranjang berisi minimal 1 item, muncul floating checkout bar di bagian bawah layar.

4. **Proses Checkout & Continuous Ordering:**
   - Saat tombol "Pesan Sekarang" ditekan, aplikasi mengirimkan payload HTTP POST ke `/api/orders`:
     ```json
     {
       "table_id": 5,
       "items": [
         { "menu_id": 1, "quantity": 2 },
         { "menu_id": 8, "quantity": 1 }
       ]
     }
     ```
   - **Logika Pasca-Checkout:**
     - Keranjang belanja dikosongkan: `setCart([])`.
     - Panel keranjang belanja ditutup otomatis.
     - **Nomor meja TIDAK dihapus:** `selectedTable` tetap tersimpan di state dan `localStorage`.
     - Modal notifikasi sukses **"Pesanan Berhasil Dikirim!"** muncul di layar.
     - Pelanggan tetap berada di halaman katalog dan dapat langsung memesan menu tambahan (*add-on order*) kapan saja tanpa perlu memilih meja ulang.

---

### Sistem Penguncian Meja (Table Lock System)

Sistem penguncian meja dirancang untuk memastikan integritas data antara posisi fisik pelanggan di warkop dengan antrean pesanan di kasir:

1. **Client-Side Persistence:** Flag `is_table_locked: true` dan data objek meja disimpan di Web Storage browser pelanggan. Bahkan jika browser di-refresh atau tab ditutup lalu dibuka kembali, pelanggan tetap terkunci pada meja yang sama.
2. **Ketiadaan Tombol Switch Meja:** Desain UI sengaja mengeliminasi kontrol penggantian meja di sisi antarmuka pelanggan.
3. **Mekanisme Remote Unlock dari Kasir:**
   - Satu-satunya pihak yang memiliki otoritas membuka kunci meja adalah **Kasir atau Manajer**.
   - Di dashboard kasir (`/cashier`), terdapat panel **Manajemen Meja**. Setiap meja yang berstatus `occupied` memiliki tombol **"Buka Kunci"**.
   - Ketika kasir menekan tombol tersebut, request dikirim ke `POST /api/tables/:id/unlock`.
   - Backend memperbarui status meja di database menjadi `available` dan memancarkan event Socket.io:
     ```javascript
     io.emit('table_unlocked', { tableId: Number(id) });
     ```
4. **Respon Klien Pelanggan terhadap Event Unlock:**
   - Di file `Customer.jsx`, terdapat listener real-time:
     ```javascript
     socket.on('table_unlocked', ({ tableId }) => {
       setSelectedTable((prev) => {
         if (prev && Number(prev.id) === Number(tableId)) {
           localStorage.removeItem('selected_table');
           localStorage.removeItem('is_table_locked');
           clearCart();
           setShowUnlockNotice(true);
           return null;
         }
         return prev;
       });
     });
     ```
   - Jika `tableId` yang dibuka kunci oleh kasir cocok dengan meja pelanggan saat ini, sistem langsung membersihkan storage, memunculkan modal pemberitahuan: *"Meja Dibuka Kunci. Kasir telah membuka kunci meja. Silakan pilih meja kembali"*, dan secara otomatis membuka kembali modal pemilihan meja.

---

### Alur Kasir (Cashier Real-time Monitoring & TV Display)

Dashboard kasir dirancang khusus untuk ditampilkan pada monitor komputer kasir maupun layar TV warkop yang dipasang di dinding bar:

1. **Tampilan TV Display (Dark Mode & Visibilitas Tinggi):**
   - Menggunakan palet warna kontras tinggi (`bg-gray-900`, teks putih, aksen emas/amber).
   - Tipografi nomor meja berukuran ekstra besar (`text-2xl font-black`) dalam wadah berukuran 64x64px, sehingga nomor meja dapat dibaca dengan jelas dari jarak jauh oleh barista/koki.
2. **Pemberitahuan Pesanan Baru Secara Real-time (Zero Refresh):**
   - Kasir membuka `/cashier` dan secara otomatis bergabung ke room kasir via socket event `join_cashier`.
   - Ketika pesanan pelanggan berhasil di-*commit* ke database, backend memancarkan event `new_order`.
   - **Reaksi Dashboard Kasir:**
     - **Kartu Masuk Teratas:** Pesanan baru langsung disisipkan di baris paling atas antrean tanpa memuat ulang (*reload*) halaman.
     - **Highlight Visual:** Kartu pesanan baru dibalut border kuning menyala dan bayangan tebal (`shadow-amber-500/30`) selama 8 detik.
     - **Layar Berkedip (Screen Flash):** Muncul overlay animasi berkedip 6 kali (`flashBorder`) di seluruh layar dengan banner tengah besar bergoyang: **"PESANAN BARU!"**.
     - **Alarm Audio Sintetis (Web Audio API):** Fungsi `playBeep()` memicu osilator audio internal browser pada frekuensi 880Hz sebanyak dua ketukan nada (tanpa ketergantungan file MP3 eksternal yang rentan gagal dimuat):
       ```javascript
       const osc = ctx.createOscillator();
       osc.frequency.setValueAtTime(880, ctx.currentTime);
       ```
3. **Pembaruan Status Transaksi:**
   - Kasir dapat menekan tombol **"Proses"** untuk mengubah status pesanan dari `pending` ke `processing`.
   - Setelah pesanan disajikan dan pembayaran diselesaikan, kasir menekan tombol **"Selesai"** (`completed`).
   - Perubahan status ini disinkronkan secara real-time ke semua dashboard melalui event `order_updated`.
4. **Manajemen Meja Kasir:**
   - Di bagian atas antrean, kasir dapat memantau status seluruh meja (1–20) dan dapat mereset meja pelanggan yang telah selesai nongkrong dengan tombol **"Buka Kunci"**.

---

### Alur Manajer (Manager Backoffice & Analytics)

Dashboard manajer (`/manager`) dikhususkan untuk pemilik atau pengelola warkop:

1. **Analitik Finansial & Operasional (Real-time Metric Cards):**
   - **Omset Hari Ini:** Total akumulasi pendapatan dari seluruh pesanan yang berstatus `completed` pada tanggal berjalan.
   - **Pesanan Hari Ini:** Jumlah frekuensi transaksi yang masuk hari ini.
   - **Total Menu:** Jumlah katalog minuman, makanan, dan camilan aktif.
   - **Total Karyawan:** Jumlah staf yang terdaftar dalam sistem.
2. **Riwayat Pesanan (Order History Audit):**
   - Menampilkan tabel riwayat transaksi lengkap dengan rincian: ID Order, Nomor Meja, Jumlah Menu, Total Rupiah, Sumber Order (Pelanggan / Kasir), Status, dan Timestamp.
   - Dilengkapi filter status transaksi: **Semua Status**, **Selesai**, dan **Dibatalkan**.
3. **Manajemen Menu (Katalog CRUD):**
   - Manajer dapat menambahkan menu baru melalui form modal dengan memasukkan nama, kategori (`drink`, `food`, `snack`), harga rupiah, deskripsi, dan URL foto.
   - Manajer dapat menghapus menu yang sudah tidak dijual langsung dari dashboard.
4. **Manajemen Karyawan (Staff RBAC Management):**
   - Menampilkan kartu profil seluruh karyawan warkop beserta rolenya.
   - Form modal untuk menambahkan staf baru (Kasir atau Manajer) dengan password yang otomatis di-hash menggunakan algoritma Bcrypt sebelum masuk ke database.

---

## 4. Spesifikasi API & Real-time Socket.io Events

### Daftar REST API Endpoints

Semua endpoint berbasis REST menggunakan format pertukaran data JSON. Base URL lokal: `http://<SERVER_IP>:5000/api`.

| Metode | Endpoint | Hak Akses | Deskripsi & Fungsi | Request Body / Query Params | Format Response Berhasil (JSON) |
|---|---|---|---|---|---|
| `GET` | `/health` | Publik | Health check status server backend | - | `{"status": "OK", "message": "Warkop API is running 🍵"}` |
| `POST` | `/auth/login` | Publik | Otentikasi login staf & manajer | `{"email": "...", "password": "..."}` | `{"success": true, "token": "JWT_STRING", "user": {...}}` |
| `GET` | `/auth/me` | Kasir, Manajer | Mengambil profil user yang sedang login | Header `Authorization: Bearer <token>` | `{"success": true, "user": {"id": 1, "role": "manager", ...}}` |
| `GET` | `/menus` | Publik | Mengambil katalog menu warkop yang tersedia | Query: `?category=drink\|food\|snack`, `?all=1` | `{"success": true, "data": [{ "id": 1, "name": "Kopi Tubruk", "price": 6000, ... }], "total": 16}` |
| `POST` | `/menus` | Khusus Manajer | Menambahkan menu baru ke katalog | Header Bearer, Body: `{"name": "...", "price": 10000, "category": "drink", ...}` | `{"success": true, "message": "Menu berhasil ditambahkan.", "data": {...}}` |
| `PUT` | `/menus/:id` | Khusus Manajer | Memperbarui data menu yang ada | Header Bearer, URL Param `id`, Body: update fields | `{"success": true, "message": "Menu berhasil diperbarui."}` |
| `DELETE` | `/menus/:id` | Khusus Manajer | Menghapus menu dari database | Header Bearer, URL Param `id` | `{"success": true, "message": "Menu berhasil dihapus."}` |
| `GET` | `/tables` | Publik | Mengambil daftar 20 meja beserta statusnya | Query (opsional): `?status=available\|occupied` | `{"success": true, "data": [{"id": 1, "table_number": 1, "status": "available"}], "total": 20}` |
| `POST` | `/tables/:id/unlock` | Kasir, Manajer | Membuka kunci meja dan memancarkan socket | Header Bearer, URL Param `id` meja | `{"success": true, "message": "Meja 5 berhasil dibuka kuncinya."}` |
| `POST` | `/orders` | Publik | Pelanggan membuat pesanan baru (Transaksional) | Body: `{"table_id": 5, "notes": "...", "items": [{"menu_id": 1, "quantity": 2}]}` | `{"success": true, "message": "Pesanan berhasil dibuat.", "data": {"order_id": 12, ...}}` |
| `GET` | `/orders` | Kasir, Manajer | Mengambil antrean pesanan aktif kasir | Header Bearer, Query: `?status=pending\|completed` | `{"success": true, "data": [{"id": 12, "table_number": 5, "items": [...], ...}]}` |
| `PATCH` | `/orders/:id/status`| Kasir, Manajer | Mengubah status pesanan (`processing`/`completed`)| Header Bearer, Body: `{"status": "completed"}` | `{"success": true, "message": "Status pesanan #12 diubah ke 'completed'."}` |
| `GET` | `/orders/history` | Khusus Manajer | Riwayat seluruh order dengan pagination | Header Bearer, Query: `?status=all`, `?limit=50` | `{"success": true, "data": [...], "pagination": {"total": 45, "limit": 50}}` |
| `GET` | `/dashboard/stats` | Khusus Manajer | Ringkasan metrik finansial & omset harian | Header Bearer | `{"success": true, "data": {"revenue_today": 250000, "orders_today": 18, ...}}` |
| `GET` | `/users` | Khusus Manajer | Mengambil daftar staf warkop terdaftar | Header Bearer | `{"success": true, "data": [{"id": 1, "name": "Budi", "role": "cashier", ...}]}` |
| `POST` | `/users` | Khusus Manajer | Membuat akun kasir/manajer baru | Header Bearer, Body: `{"name": "...", "email": "...", "password": "...", "role": "cashier"}` | `{"success": true, "message": "Karyawan baru berhasil ditambahkan.", "data": {...}}` |
| `PATCH` | `/users/:id/status` | Khusus Manajer | Mengaktifkan/menonaktifkan akun staf | Header Bearer, Body: `{"is_active": 1\|0}` | `{"success": true, "message": "Status karyawan berhasil diperbarui."}` |

---

### Daftar Socket.io Events

Komunikasi WebSocket beroperasi pada server yang sama di port 5000 menggunakan protokol Socket.io v4.

```
                  SKEMA ALIRAN EVENT SOCKET.IO REAL-TIME

   KLIEN PELANGGAN                     SERVER BACKEND                    MONITOR KASIR
  (Customer.jsx)                        (server.js)                      (Cashier.jsx)
        │                                    │                                 │
        │                                    │◀── join_cashier ────────────────│ (Kasir terhubung)
        │                                    │    (Join ke room 'cashier')     │
        │                                    │                                 │
        │──── POST /api/orders ─────────────▶│                                 │
        │     (Checkout Order)               │──── new_order ─────────────────▶│ (Layar berkedip,
        │                                    │     (Payload rincian order)     │  alarm beep bersuara)
        │                                    │                                 │
        │                                    │◀── PATCH /api/orders/:id ───────│ (Kasir klik "Selesai")
        │◀─── order_updated ─────────────────│──── order_updated ─────────────▶│
        │     (Status 'completed')           │                                 │
        │                                    │                                 │
        │                                    │◀── POST /api/tables/:id/unlock ─│ (Kasir buka kunci)
        │◀─── table_unlocked ────────────────│                                 │
        │     (tableId: 5)                   │                                 │
        │ (Storage meja dibersihkan,         │                                 │
        │  modal pilih meja terbuka)         │                                 │
```

#### 1. Event `join_cashier`
- **Pengirim:** Frontend Kasir (`Cashier.jsx`).
- **Penerima:** Server Backend (`server.js`).
- **Payload:** Kosong.
- **Tujuan:** Menandai koneksi socket kasir dan memasukkannya ke dalam room khusus `cashier_room`.

#### 2. Event `new_order`
- **Pengirim:** Server Backend (dipicu setelah transaksi MySQL `createOrder` berhasil di-*commit*).
- **Penerima:** Seluruh klien terhubung (khususnya `Cashier.jsx`).
- **Payload Data Structure:**
  ```json
  {
    "order_id": 14,
    "table_number": 5,
    "source": "customer",
    "status": "pending",
    "total_price": 42000,
    "notes": "Minta es batunya dipisah",
    "items": [
      {
        "menu_id": 2,
        "menu_name": "Kopi Susu Gula Aren",
        "quantity": 2,
        "unit_price": 12000,
        "subtotal": 24000,
        "notes": "manis sedang"
      },
      {
        "menu_id": 10,
        "menu_name": "Nasi Goreng Gila Warkop",
        "quantity": 1,
        "unit_price": 18000,
        "subtotal": 18000,
        "notes": "pedas"
      }
    ],
    "created_at": "2026-10-29T16:00:00.000Z"
  }
  ```
- **Tindakan Klien:** Menyisipkan pesanan ke posisi teratas antrean UI kasir, menyalakan animasi layar berkedip (`NewOrderFlash`), memainkan audio synthesizer alarm ganda (`playBeep()`), dan menambahkan highlight kartu pesanan selama 8 detik.

#### 3. Event `order_updated`
- **Pengirim:** Server Backend (dipicu oleh endpoint `updateOrderStatus`).
- **Penerima:** Seluruh klien kasir dan manajer.
- **Payload Data Structure:**
  ```json
  {
    "order_id": 14,
    "status": "completed"
  }
  ```
- **Tindakan Klien:** Mengupdate badge status pesanan secara reaktif tanpa me-refresh halaman.

#### 4. Event `table_unlocked`
- **Pengirim:** Server Backend (dipicu oleh endpoint `unlockTable`).
- **Penerima:** Seluruh klien pelanggan (`Customer.jsx`).
- **Payload Data Structure:**
  ```json
  {
    "tableId": 5
  }
  ```
- **Tindakan Klien:** Setiap perangkat pelanggan membandingkan `tableId` dari payload dengan nomor meja yang tersimpan di `localStorage`. Jika sama, klien menghapus token meja dari storage, membersihkan keranjang, menampilkan modal notifikasi meja telah dibuka kuncinya, dan menampilkan kembali form pemilihan nomor meja awal.

---

## 5. Panduan Setup & Menjalankan Aplikasi

### Prasyarat Sistem
Pastikan lingkungan komputer server telah terpasang perangkat lunak berikut:
1. **Node.js:** Versi 20.x ke atas (aplikasi telah divalidasi hingga Node.js v26).
2. **NPM:** Versi 9.x atau lebih baru.
3. **Database Engine:** Docker & Docker Compose (Direkomendasikan), atau MariaDB/MySQL server lokal yang berjalan di port 3306.
4. **Jaringan Wi-Fi / LAN:** Seluruh perangkat (server, HP pelanggan, tablet kasir) harus terhubung ke satu router Wi-Fi yang sama.

---

### Langkah Instalasi Dependencies

Buka terminal di root direktori proyek (`app-warkop`):

```bash
cd /home/salimrama/Project/app-warkop
```

Jalankan instalasi dependensi untuk seluruh sub-proyek (Root, Backend, dan Frontend) dalam satu perintah:

```bash
npm run install:all
```

*(Atau jalankan instalasi secara manual per direktori jika diperlukan)*:
```bash
npm install
cd backend && npm install && cd ..
cd frontend && npm install && cd ..
```

---

### Inisialisasi Database & Seeding Data

#### Opsi 1: Menjalankan Basis Data via Docker Compose (Rekomendasi)
Nyalakan container MySQL 8.0 di background:
```bash
docker compose up -d mysql
```
Container akan otomatis membuat database `warkop_db` dan mengeksekusi file `backend/schema.sql`.

#### Opsi 2: Menggunakan MariaDB Lokal (CachyOS / Arch Linux)
Jika menggunakan service sistem operasi:
```bash
sudo systemctl enable --now mariadb
mysql -u root -p < backend/schema.sql
```

#### Melakukan Seeding Akun & Menu Dummy
Setelah database menyala pada port 3306, jalankan skrip seeder otomatis:
```bash
npm run seed
```
Skrip di atas akan secara otomatis memicu dua proses:
1. **`seed-users.js`**: Membuat akun default:
   - **Manajer:** `manager@warkop.com` | Password: `admin123`
   - **Kasir:** `kasir@warkop.com` | Password: `kasir123`
2. **`seed-menus.js`**: Memasukkan 16 menu lengkap (Kopi Tubruk, Kopi Susu Aren, Indomie Goreng Internet, Roti Bakar, dll).

---

### Konfigurasi Jaringan LAN & Firewall

Agar aplikasi dapat diakses dari smartphone pelanggan melalui Wi-Fi, port `5000` (Backend) dan `5173` (Frontend) harus dibuka di firewall sistem operasi host (Linux/CachyOS).

#### 1. Mengetahui Alamat IP Lokal Server
Jalankan salah satu perintah berikut di terminal:
```bash
hostname -I | awk '{print $1}'
```
*(Contoh output: `192.168.100.12`)*

#### 2. Konfigurasi Firewall Linux (Arch / CachyOS / Ubuntu)
Jika menggunakan **UFW**:
```bash
sudo ufw allow 5000/tcp
sudo ufw allow 5173/tcp
sudo ufw reload
```

Jika menggunakan **Firewalld**:
```bash
sudo firewall-cmd --zone=public --add-port=5000/tcp --permanent
sudo firewall-cmd --zone=public --add-port=5173/tcp --permanent
sudo firewall-cmd --reload
```

Jika menggunakan **iptables**:
```bash
sudo iptables -A INPUT -p tcp --dport 5000 -j ACCEPT
sudo iptables -A INPUT -p tcp --dport 5173 -j ACCEPT
```

---

### Eksekusi Menjalankan Aplikasi

Anda dapat menjalankan seluruh ekosistem aplikasi hanya dengan **satu perintah**:

```bash
npm run dev
```

*(Atau via shell script executable)*:
```bash
./start.sh
```

#### Urutan Otomatis yang Terjadi:
1. Skrip `ensure-db.sh` mengecek apakah port 3306 sudah aktif. Jika belum, skrip otomatis menyalakan container MySQL atau service database.
2. `concurrently` menyalakan backend di port `5000` (terikat ke `0.0.0.0`).
3. `concurrently` menyalakan Vite development server di port `5173` (terikat ke `0.0.0.0`).

#### Tautan Akses URL di Jaringan Wi-Fi:
Misalkan IP server Anda adalah `192.168.100.12`:

| Peran Pengguna | Perangkat Target | Alamat URL Akses | Akses Hak / Autentikasi |
|---|---|---|---|
| **Pelanggan** | Smartphone Pelanggan (Bisa ditempel via QR Code di meja) | `http://192.168.100.12:5173/` | Publik (Wajib pilih meja) |
| **Kasir** | Monitor PC Kasir / Tablet / Smart TV Bar | `http://192.168.100.12:5173/cashier` | Memerlukan Login Akun Kasir |
| **Manajer** | Laptop Manajer / Pemilik Warkop | `http://192.168.100.12:5173/manager` | Memerlukan Login Akun Manajer |
| **Portal Login**| Seluruh Staf Warkop | `http://192.168.100.12:5173/login` | Publik |

---

### Troubleshooting & Solusi Masalah Umum

#### 1. Masalah: Smartphone Pelanggan Mengalami `ERR_CONNECTION_TIMED_OUT`
- **Penyebab:** Firewall di PC server Linux memblokir paket TCP masuk pada port 5173 atau 5000, atau smartphone terhubung ke SSID Wi-Fi yang berbeda (misalnya router tamu/guest mode dengan isolasi klien).
- **Solusi:**
  1. Pastikan fitur *Client Isolation* / *AP Isolation* di router Wi-Fi dinonaktifkan.
  2. Buka port firewall dengan perintah: `sudo ufw allow 5173/tcp && sudo ufw allow 5000/tcp`.
  3. Coba lakukan ping dari perangkat lain ke IP server.

#### 2. Masalah: Backend Menolak Koneksi Database (`ECONNREFUSED 127.0.0.1:3306`)
- **Penyebab:** Service MySQL / Docker container belum selesai booting atau belum menyala.
- **Solusi:**
  1. Jalankan `docker compose up -d mysql` atau `sudo systemctl start mariadb`.
  2. Pastikan file `backend/.env` menggunakan host `127.0.0.1` (bukan `localhost` untuk menghindari resolusi IPv6 `::1`).

#### 3. Masalah: Layar Kasir Tidak Mengeluarkan Suara Saat Ada Pesanan Baru
- **Penyebab:** Kebijakan *Autoplay Policy* pada browser modern (Chrome/Safari) memblokir pemutaran audio otomatis jika pengguna belum pernah berinteraksi dengan halaman.
- **Solusi:**
  Cukup klik satu kali di mana saja pada layar dashboard kasir setelah membuka halaman `/cashier`. Interaksi pertama ini akan mengizinkan `AudioContext` Web Audio API browser memutar alarm frekuensi secara bebas.

#### 4. Masalah: Login Selalu Gagal ("Email atau Password Salah")
- **Penyebab:** Data akun default belum ter-generate di database MySQL.
- **Solusi:**
  Jalankan seeder akun:
  ```bash
  cd /home/salimrama/Project/app-warkop/backend && node seed-users.js
  ```
  Lalu gunakan kredensial:
  - Kasir: `kasir@warkop.com` / `kasir123`
  - Manajer: `manager@warkop.com` / `admin123`

---

*Dokumentasi teknis ini disusun secara presisi berdasarkan basis kode aktif repositori Warkop POS.*

