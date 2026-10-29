const bcrypt = require('bcryptjs');
const { pool } = require('../config/db');

/**
 * GET /api/users
 * Mengambil daftar karyawan (cashier & manager)
 */
const getUsers = async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, name, email, role, is_active, created_at FROM users ORDER BY created_at DESC'
    );

    return res.status(200).json({
      success: true,
      data: rows,
      total: rows.length,
    });
  } catch (err) {
    console.error('[userController.getUsers]', err);
    return res.status(500).json({
      success: false,
      message: 'Gagal mengambil data karyawan.',
    });
  }
};

/**
 * POST /api/users
 * Menambahkan user/karyawan baru
 * Body: { name, email, password, role }
 */
const createUser = async (req, res) => {
  try {
    const { name, email, password, role = 'cashier' } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Nama, email, dan password wajib diisi.',
      });
    }

    if (!['cashier', 'manager'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Role harus 'cashier' atau 'manager'.",
      });
    }

    // Cek apakah email sudah terdaftar
    const [[existing]] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'Email sudah digunakan oleh karyawan lain.',
      });
    }

    // Hash password
    const salt           = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const [result] = await pool.query(
      'INSERT INTO users (name, email, password, role, is_active) VALUES (?, ?, ?, ?, 1)',
      [name, email, hashedPassword, role]
    );

    return res.status(201).json({
      success: true,
      message: 'Karyawan baru berhasil ditambahkan.',
      data: {
        id: result.insertId,
        name,
        email,
        role,
        is_active: 1,
      },
    });
  } catch (err) {
    console.error('[userController.createUser]', err);
    return res.status(500).json({
      success: false,
      message: 'Gagal menambahkan karyawan.',
    });
  }
};

/**
 * PATCH /api/users/:id/status
 * Mengubah status aktif / nonaktif karyawan
 */
const toggleUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { is_active } = req.body;

    await pool.query('UPDATE users SET is_active = ? WHERE id = ?', [is_active ? 1 : 0, id]);

    return res.status(200).json({
      success: true,
      message: 'Status karyawan berhasil diperbarui.',
    });
  } catch (err) {
    console.error('[userController.toggleUserStatus]', err);
    return res.status(500).json({
      success: false,
      message: 'Gagal memperbarui status karyawan.',
    });
  }
};

/**
 * DELETE /api/users/:id
 * Menghapus akun karyawan. Riwayat transaksi tetap dipertahankan oleh FK orders.cashier_id.
 */
const deleteUser = async (req, res) => {
  const userId = Number(req.params.id);
  if (!Number.isSafeInteger(userId) || userId < 1) {
    return res.status(400).json({ success: false, message: 'ID karyawan tidak valid.' });
  }

  if (userId === Number(req.user.id)) {
    return res.status(400).json({
      success: false,
      message: 'Anda tidak dapat menghapus akun Anda sendiri.',
    });
  }

  try {
    const [result] = await pool.query('DELETE FROM users WHERE id = ?', [userId]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Karyawan tidak ditemukan.' });
    }

    return res.status(200).json({
      success: true,
      message: 'Akun karyawan berhasil dihapus.',
    });
  } catch (err) {
    console.error('[userController.deleteUser]', err);
    return res.status(500).json({ success: false, message: 'Gagal menghapus karyawan.' });
  }
};

module.exports = { getUsers, createUser, toggleUserStatus, deleteUser };
