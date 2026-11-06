const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const ServiceError = require('./serviceError');

class AuthService {
  constructor(authRepository) {
    this.authRepository = authRepository;
  }

  async login(email, password) {
    if (!email || !password) throw new ServiceError('Email dan password wajib diisi.', 400);
    const user = await this.authRepository.findByEmail(email);
    if (!user) throw new ServiceError('Email atau password salah.', 401);
    if (!user.is_active) {
      throw new ServiceError('Akun Anda dinonaktifkan. Silakan hubungi manajer.', 403);
    }
    if (!(await bcrypt.compare(password, user.password))) {
      throw new ServiceError('Email atau password salah.', 401);
    }

    const publicUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    };
    const token = jwt.sign(
      publicUser,
      process.env.JWT_SECRET || 'warkop_secret_default_key',
      { expiresIn: process.env.JWT_EXPIRES_IN || '1d' }
    );
    return { token, user: publicUser };
  }

  async changePassword(userId, oldPassword, newPassword) {
    if (
      typeof oldPassword !== 'string'
      || typeof newPassword !== 'string'
      || !oldPassword
      || !newPassword
    ) {
      throw new ServiceError('Password lama dan password baru wajib diisi.', 400);
    }
    if (newPassword.length < 6) {
      throw new ServiceError('Password baru minimal 6 karakter.', 400);
    }
    const user = await this.authRepository.findActivePasswordById(userId);
    if (!user) throw new ServiceError('Akun tidak ditemukan atau sudah dinonaktifkan.', 404);
    if (!(await bcrypt.compare(oldPassword, user.password))) {
      throw new ServiceError('Password lama salah.', 400);
    }
    if (oldPassword === newPassword) {
      throw new ServiceError('Password baru harus berbeda dari password lama.', 400);
    }
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await this.authRepository.updatePassword(user.id, hashedPassword);
  }
}

module.exports = AuthService;
