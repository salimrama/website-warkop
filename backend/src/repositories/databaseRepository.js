const TABLES = {
  orders: { sqlName: 'orders', orderBy: 'created_at DESC, id DESC' },
  order_items: { sqlName: 'order_items', orderBy: 'created_at DESC, id DESC' },
  menu: { sqlName: 'menus', orderBy: 'created_at DESC, id DESC' },
  users: {
    sqlName: 'users',
    columns: 'id, name, email, role, is_active, created_at',
    orderBy: 'created_at DESC, id DESC',
  },
};

class DatabaseRepository {
  constructor(db) {
    this.db = db;
  }

  async readTable(tableName) {
    const table = TABLES[tableName];
    if (!table) return null;
    const [rows, fields] = await this.db.query(
      `SELECT ${table.columns || '*'} FROM ${table.sqlName} ORDER BY ${table.orderBy}`
    );
    return { rows, columns: fields.map((field) => field.name) };
  }
}

module.exports = DatabaseRepository;
