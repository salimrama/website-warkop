const { pool } = require('../config/db');

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

const getTableData = async (req, res) => {
  const table = TABLES[req.params.tableName];
  if (!table) {
    return res.status(400).json({
      success: false,
      message: 'Tabel tidak diizinkan untuk ditampilkan.',
    });
  }

  try {
    const selection = table.columns || '*';
    const [rows, fields] = await pool.query(
      `SELECT ${selection} FROM ${table.sqlName} ORDER BY ${table.orderBy}`
    );

    return res.status(200).json({
      success: true,
      columns: fields.map((field) => field.name),
      data: rows,
    });
  } catch (err) {
    console.error('[databaseController.getTableData]', err);
    return res.status(500).json({
      success: false,
      message: 'Gagal mengambil data tabel.',
    });
  }
};

module.exports = { getTableData };
