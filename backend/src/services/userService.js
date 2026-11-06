const bcrypt = require('bcryptjs');
const ServiceError = require('./serviceError');

class UserService {
  constructor(userRepository) {
    this.userRepository = userRepository;
  }

  list() {
    return this.userRepository.findAll();
  }

  async create(input) {
    const { name, email, password, role = 'cashier' } = input;
    if (!name || !email || !password) {
      throw new ServiceError('Nama, email, dan password wajib diisi.', 400);
    }
    if (!['cashier', 'manager'].includes(role)) {
      throw new ServiceError("Role harus 'cashier' atau 'manager'.", 400);
    }
    if (await this.userRepository.findByEmail(email)) {
      throw new ServiceError('Email sudah digunakan oleh karyawan lain.', 409);
    }
    const hashedPassword = await bcrypt.hash(password, await bcrypt.genSalt(10));
    const id = await this.userRepository.create({ name, email, password: hashedPassword, role });
    return { id, name, email, role, is_active: 1 };
  }

  async setActive(id, isActive) {
    await this.userRepository.setActive(id, isActive);
  }

  async delete(id, currentUserId) {
    const userId = Number(id);
    if (!Number.isSafeInteger(userId) || userId < 1) {
      throw new ServiceError('ID karyawan tidak valid.', 400);
    }
    if (userId === Number(currentUserId)) {
      throw new ServiceError('Anda tidak dapat menghapus akun Anda sendiri.', 400);
    }
    const affectedRows = await this.userRepository.delete(userId);
    if (!affectedRows) throw new ServiceError('Karyawan tidak ditemukan.', 404);
  }
}

module.exports = UserService;
