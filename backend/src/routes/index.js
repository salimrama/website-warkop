const { Router } = require('express');

const {
  getAllMenus,
  createMenu,
  updateMenu,
  deleteMenu,
} = require('../controllers/menuController');
const { getAllTables, unlockTable } = require('../controllers/tableController');
const {
  createOrder,
  getOrders,
  updateOrderStatus,
  getOrderHistory,
  getDashboardStats,
} = require('../controllers/orderController');
const { login, getMe } = require('../controllers/authController');
const { getUsers, createUser, toggleUserStatus } = require('../controllers/userController');
const { verifyToken, requireRole } = require('../middlewares/authMiddleware');

const router = Router();

// ── 1. Auth ─────────────────────────────────────────────────────────────
// POST /api/auth/login          → Login karyawan (Kasir & Manajer)
router.post('/auth/login', login);

// GET  /api/auth/me             → Cek sesi / profil user saat ini (Protected)
router.get('/auth/me', verifyToken, getMe);

// ── 2. Publik (Menu & Meja & Buat Order) ─────────────────────────────────
// GET  /api/menus               → Semua menu (bisa filter ?category=...)
router.get('/menus', getAllMenus);

// GET  /api/tables              → Semua meja (bisa filter ?status=...)
router.get('/tables', getAllTables);

// POST /api/tables/:id/unlock → Kasir/Manajer buka kunci meja (broadcast socket)
router.post('/tables/:id/unlock', verifyToken, requireRole('cashier', 'manager'), unlockTable);

// POST /api/orders              → Pelanggan kirim pesanan baru
router.post('/orders', createOrder);

// ── 3. Orders Real-time (Kasir & Manajer) ───────────────────────────────
// GET   /api/orders             → Daftar pesanan aktif (Protected)
router.get('/orders', verifyToken, getOrders);

// PATCH /api/orders/:id/status  → Update status pesanan (processing / completed)
router.patch('/orders/:id/status', verifyToken, updateOrderStatus);

// ── 4. Manajer Dashboard & Laporan (Khusus Manager) ──────────────────────
// GET  /api/orders/history      → Riwayat seluruh transaksi
router.get('/orders/history', verifyToken, requireRole('manager'), getOrderHistory);

// GET  /api/dashboard/stats     → Ringkasan omset & performa
router.get('/dashboard/stats', verifyToken, requireRole('manager'), getDashboardStats);

// ── 5. Employee Management (Khusus Manager) ──────────────────────────────
// GET   /api/users              → Daftar karyawan
router.get('/users', verifyToken, requireRole('manager'), getUsers);

// POST  /api/users              → Tambah karyawan baru
router.post('/users', verifyToken, requireRole('manager'), createUser);

// PATCH /api/users/:id/status   → Toggle status aktif karyawan
router.patch('/users/:id/status', verifyToken, requireRole('manager'), toggleUserStatus);

// ── 6. Menu Management (Khusus Manager) ──────────────────────────────────
// POST   /api/menus             → Tambah menu baru
router.post('/menus', verifyToken, requireRole('manager'), createMenu);

// PUT    /api/menus/:id         → Update menu
router.put('/menus/:id', verifyToken, requireRole('manager'), updateMenu);

// DELETE /api/menus/:id         → Hapus menu
router.delete('/menus/:id', verifyToken, requireRole('manager'), deleteMenu);

module.exports = router;
