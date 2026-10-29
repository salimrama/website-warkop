const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const { pool } = require('../config/db');

/**
 * PUT /api/auth/change-password
 * Mengubah password akun yang sedang terautentikasi.
 */
const changePassword = async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  if (typeof oldPassword !== 'string' || typeof newPassword !== 'string' || !oldPassword || !newPassword) {
    return res.status(400).json({
      success: false,
      message: 'Password lama dan password baru wajib diisi.',
    });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({
      success: false,
      message: 'Password baru minimal 6 karakter.',
    });
  }

  try {
    const [[user]] = await pool.query(
      'SELECT id, password FROM users WHERE id = ? AND is_active = 1',
      [req.user.id]
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Akun tidak ditemukan atau sudah dinonaktifkan.',
      });
    }

    const isOldPasswordValid = await bcrypt.compare(oldPassword, user.password);
    if (!isOldPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Password lama salah.',
      });
    }

    if (oldPassword === newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Password baru harus berbeda dari password lama.',
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await pool.query('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, user.id]);

    return res.status(200).json({
      success: true,
      message: 'Password berhasil diubah.',
    });
  } catch (err) {
    console.error('[authController.changePassword]', err);
    return res.status(500).json({
      success: false,
      message: 'Gagal mengubah password.',
    });
  }
};

/**
 * POST /api/auth/login
 * Body: { email, password }
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email dan password wajib diisi.',
      });
    }

    const [[user]] = await pool.query(
      'SELECT id, name, email, password, role, is_active FROM users WHERE email = ?',
      [email]
    );

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Email atau password salah.',
      });
    }

    if (!user.is_active) {
      return res.status(403).json({
        success: false,
        message: 'Akun Anda dinonaktifkan. Silakan hubungi manajer.',
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Email atau password salah.',
      });
    }

    const token = jwt.sign(
      {
        id:    user.id,
        name:  user.name,
        email: user.email,
        role:  user.role,
      },
      process.env.JWT_SECRET || 'warkop_secret_default_key',
      { expiresIn: process.env.JWT_EXPIRES_IN || '1d' }
    );

    return res.status(200).json({
      success: true,
      message: 'Login berhasil.',
      token,
      user: {
        id:    user.id,
        name:  user.name,
        email: user.email,
        role:  user.role,
      },
    });
  } catch (err) {
    console.error('[authController.login]', err);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server saat login.',
    });
  }
};

/**
 * GET /api/auth/me
 * Mengambil info profil user yang sedang login
 */
const getMe = async (req, res) => {
  return res.status(200).json({
    success: true,
    user: req.user,
  });
};

module.exports = { login, getMe, changePassword };
