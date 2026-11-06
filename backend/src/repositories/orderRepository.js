class OrderRepository {
  constructor(db) {
    this.db = db;
  }

  async withTransaction(callback) {
    const connection = await this.db.getConnection();
    try {
      await connection.beginTransaction();
      const result = await callback(new OrderRepository(connection));
      await connection.commit();
      return result;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  async findTableForOrder(tableId) {
    const [[table]] = await this.db.query(
      'SELECT id, table_number FROM `tables` WHERE id = ?',
      [tableId]
    );
    return table || null;
  }

  async findAvailableMenus(menuIds) {
    const [rows] = await this.db.query(
      'SELECT id, name, price FROM menus WHERE id IN (?) AND is_available = 1',
      [menuIds]
    );
    return rows;
  }

  async insertOrder({ tableId, totalPrice, notes }) {
    const [result] = await this.db.query(
      `INSERT INTO orders (table_id, source, status, total_price, notes)
       VALUES (?, 'customer', 'pending', ?, ?)`,
      [tableId, totalPrice, notes]
    );
    return result.insertId;
  }

  async insertOrderItems(orderId, items) {
    const values = items.map((item) => [
      orderId,
      item.menu_id,
      item.quantity,
      item.unit_price,
      item.subtotal,
      item.notes,
    ]);
    await this.db.query(
      `INSERT INTO order_items (order_id, menu_id, quantity, unit_price, subtotal, notes)
       VALUES ?`,
      [values]
    );
  }

  async markTableOccupied(tableId) {
    await this.db.query("UPDATE `tables` SET status = 'occupied' WHERE id = ?", [tableId]);
  }

  async findAll(status) {
    let sql = `
      SELECT o.id, o.table_id, o.source, o.status, o.total_price, o.notes, o.created_at,
             t.table_number,
             JSON_ARRAYAGG(JSON_OBJECT(
               'id', oi.id, 'menu_id', oi.menu_id, 'menu_name', m.name,
               'quantity', oi.quantity, 'unit_price', oi.unit_price,
               'subtotal', oi.subtotal, 'notes', oi.notes
             )) AS items
      FROM orders o
      JOIN \`tables\` t ON t.id = o.table_id
      JOIN order_items oi ON oi.order_id = o.id
      JOIN menus m ON m.id = oi.menu_id
    `;
    const params = [];
    if (status) {
      sql += ' WHERE o.status = ?';
      params.push(status);
    } else {
      sql += " WHERE o.status IN ('pending', 'processing')";
    }
    const [rows] = await this.db.query(
      `${sql} GROUP BY o.id ORDER BY o.created_at DESC LIMIT 100`,
      params
    );
    return rows.map((row) => ({
      ...row,
      items: typeof row.items === 'string' ? JSON.parse(row.items) : row.items,
    }));
  }

  async findById(id) {
    const [[order]] = await this.db.query(
      'SELECT id, table_id, status FROM orders WHERE id = ?',
      [id]
    );
    return order || null;
  }

  async updateStatus(id, status) {
    await this.db.query('UPDATE orders SET status = ? WHERE id = ?', [status, id]);
  }

  async findHistory({ status, from, to, limit, offset }) {
    const conditions = [];
    const params = [];
    if (status !== 'all') {
      conditions.push('o.status = ?');
      params.push(status);
    }
    if (from) {
      conditions.push('DATE(o.created_at) >= ?');
      params.push(from);
    }
    if (to) {
      conditions.push('DATE(o.created_at) <= ?');
      params.push(to);
    }
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const [rows] = await this.db.query(
      `SELECT o.id, o.source, o.status, o.total_price, o.notes, o.created_at,
              t.table_number, COUNT(oi.id) AS item_count
       FROM orders o
       JOIN \`tables\` t ON t.id = o.table_id
       JOIN order_items oi ON oi.order_id = o.id
       ${where}
       GROUP BY o.id
       ORDER BY o.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );
    const [[{ total }]] = await this.db.query(
      `SELECT COUNT(DISTINCT o.id) AS total
       FROM orders o
       JOIN \`tables\` t ON t.id = o.table_id
       ${where}`,
      params
    );
    return { rows, total };
  }

  async getDashboardStats() {
    const [[orderStats]] = await this.db.query(`
      SELECT COUNT(*) AS total_orders,
             COALESCE(SUM(CASE WHEN status = 'completed' THEN total_price END), 0) AS total_revenue,
             COALESCE(SUM(CASE WHEN DATE(created_at) = CURDATE() THEN 1 END), 0) AS orders_today,
             COALESCE(SUM(CASE WHEN DATE(created_at) = CURDATE()
                               AND status = 'completed' THEN total_price END), 0) AS revenue_today
      FROM orders
    `);
    const [[{ pending_orders }]] = await this.db.query(
      "SELECT COUNT(*) AS pending_orders FROM orders WHERE status IN ('pending','processing')"
    );
    return { ...orderStats, pending_orders };
  }
}

module.exports = OrderRepository;
