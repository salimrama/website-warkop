class UserRepository {
  constructor(db) {
    this.db = db;
  }

  async findAll() {
    const [rows] = await this.db.query(
      'SELECT id, name, email, role, is_active, created_at FROM users ORDER BY created_at DESC'
    );
    return rows;
  }

  async findByEmail(email) {
    const [[user]] = await this.db.query('SELECT id FROM users WHERE email = ?', [email]);
    return user || null;
  }

  async create({ name, email, password, role }) {
    const [result] = await this.db.query(
      'INSERT INTO users (name, email, password, role, is_active) VALUES (?, ?, ?, ?, 1)',
      [name, email, password, role]
    );
    return result.insertId;
  }

  async setActive(id, isActive) {
    await this.db.query('UPDATE users SET is_active = ? WHERE id = ?', [isActive ? 1 : 0, id]);
  }

  async delete(id) {
    const [result] = await this.db.query('DELETE FROM users WHERE id = ?', [id]);
    return result.affectedRows;
  }

  async countActive() {
    const [[row]] = await this.db.query(
      'SELECT COUNT(*) AS total_employees FROM users WHERE is_active = 1'
    );
    return row.total_employees;
  }
}

module.exports = UserRepository;
