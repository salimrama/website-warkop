class AuthRepository {
  constructor(db) {
    this.db = db;
  }

  async findByEmail(email) {
    const [[user]] = await this.db.query(
      'SELECT id, name, email, password, role, is_active FROM users WHERE email = ?',
      [email]
    );
    return user || null;
  }

  async findActivePasswordById(id) {
    const [[user]] = await this.db.query(
      'SELECT id, password FROM users WHERE id = ? AND is_active = 1',
      [id]
    );
    return user || null;
  }

  async updatePassword(id, password) {
    await this.db.query('UPDATE users SET password = ? WHERE id = ?', [password, id]);
  }
}

module.exports = AuthRepository;
