class TableRepository {
  constructor(db) {
    this.db = db;
  }

  async findAll(status) {
    let sql = 'SELECT * FROM `tables`';
    const params = [];
    if (status) {
      sql += ' WHERE status = ?';
      params.push(status);
    }
    const [rows] = await this.db.query(`${sql} ORDER BY table_number`, params);
    return rows;
  }

  async findById(id) {
    const [[table]] = await this.db.query(
      'SELECT id, table_number, status FROM `tables` WHERE id = ?',
      [id]
    );
    return table || null;
  }

  async findDetailsById(id) {
    const [[table]] = await this.db.query('SELECT * FROM `tables` WHERE id = ?', [id]);
    return table || null;
  }

  async setAvailable(id) {
    await this.db.query("UPDATE `tables` SET status = 'available' WHERE id = ?", [id]);
  }
}

module.exports = TableRepository;
