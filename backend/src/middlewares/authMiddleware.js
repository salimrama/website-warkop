const jwt = require('jsonwebtoken');

/**
 * Middleware untuk memverifikasi JWT token dari header Authorization: Bearer <token>
 */
const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Akses ditolak. Token tidak ditemukan atau format salah.',
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'warkop_secret_default_key');
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: 'Sesi login telah kedaluwarsa atau token tidak valid. Silakan login kembali.',
    });
  }
};

/**
 * Middleware untuk membatasi akses berdasarkan role (misal: 'manager', 'cashier')
 */
const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Akses terlarang. Anda tidak memiliki izin untuk halaman/fitur ini.',
      });
    }
    next();
  };
};

module.exports = { verifyToken, requireRole };

