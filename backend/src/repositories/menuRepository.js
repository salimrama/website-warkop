class MenuRepository {
  constructor(db) {
    this.db = db;
  }

  async findAll({ includeUnavailable = false, category } = {}) {
    let sql = includeUnavailable
      ? 'SELECT * FROM menus WHERE 1=1'
      : 'SELECT * FROM menus WHERE is_available = 1';
    const params = [];

    if (category && category !== 'all') {
      sql += ' AND category = ?';
      params.push(category);
    }

    const [rows] = await this.db.query(`${sql} ORDER BY category, name`, params);
    return rows;
  }

  async create(menu) {
    const [result] = await this.db.query(
      `INSERT INTO menus (name, description, price, category, image_url, is_available)
       VALUES (?, ?, ?, ?, ?, 1)`,
      [menu.name, menu.description, menu.price, menu.category, menu.image_url]
    );
    return result.insertId;
  }

  async update(id, menu) {
    await this.db.query(
      `UPDATE menus
       SET name = COALESCE(?, name),
           description = COALESCE(?, description),
           price = COALESCE(?, price),
           category = COALESCE(?, category),
           image_url = COALESCE(?, image_url),
           is_available = COALESCE(?, is_available)
       WHERE id = ?`,
      [menu.name, menu.description, menu.price, menu.category, menu.image_url, menu.is_available, id]
    );
  }

  async delete(id) {
    await this.db.query('DELETE FROM menus WHERE id = ?', [id]);
  }
}

module.exports = MenuRepository;
