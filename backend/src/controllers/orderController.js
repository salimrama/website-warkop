const { pool } = require('../config/db');

/**
 * POST /api/orders
 * Membuat pesanan baru dari pelanggan.
 *
 * Expected request body:
 * {
 *   "table_id": 3,
 *   "notes": "Minta es banyak",        // opsional, catatan keseluruhan order
 *   "items": [
 *     { "menu_id": 1, "quantity": 2, "notes": "tanpa gula" },
 *     { "menu_id": 5, "quantity": 1 }
 *   ]
 * }
 */
const createOrder = async (req, res) => {
  const { table_id, notes, items } = req.body;

  // ── Validasi input ─────────────────────────────────────────────────────────
  if (!table_id) {
    return res.status(400).json({ success: false, message: 'table_id wajib diisi.' });
  }

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ success: false, message: 'items tidak boleh kosong.' });
  }

  for (const [i, item] of items.entries()) {
    if (!item.menu_id || !item.quantity || item.quantity < 1) {
      return res.status(400).json({
        success: false,
        message: `Item ke-${i + 1}: menu_id dan quantity (min 1) wajib diisi.`,
      });
    }
  }

  // ── Ambil koneksi & mulai transaction ─────────────────────────────────────
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // 1. Pastikan meja ada
    const [[table]] = await connection.query(
      'SELECT id, table_number FROM `tables` WHERE id = ?',
      [table_id]
    );
    if (!table) {
      await connection.rollback();
      connection.release();
      return res.status(404).json({ success: false, message: 'Meja tidak ditemukan.' });
    }

    // 2. Ambil harga semua menu yang dipesan (sekaligus validasi menu_id valid)
    const menuIds   = [...new Set(items.map((i) => i.menu_id))];
    const [menuRows] = await connection.query(
      'SELECT id, name, price FROM menus WHERE id IN (?) AND is_available = 1',
      [menuIds]
    );

    // Buat Map untuk pencarian O(1)
    const menuMap = new Map(menuRows.map((m) => [m.id, m]));

    // Validasi semua menu_id ada dan tersedia
    for (const item of items) {
      if (!menuMap.has(item.menu_id)) {
        await connection.rollback();
        connection.release();
        return res.status(404).json({
          success: false,
          message: `Menu dengan id ${item.menu_id} tidak ditemukan atau tidak tersedia.`,
        });
      }
    }

    // 3. Hitung total_price
    let totalPrice = 0;
    const orderItemsData = items.map((item) => {
      const menu     = menuMap.get(item.menu_id);
      const unitPrice = parseFloat(menu.price);
      const subtotal  = unitPrice * item.quantity;
      totalPrice     += subtotal;

      return {
        menu_id:    item.menu_id,
        quantity:   item.quantity,
        unit_price: unitPrice,
        subtotal,
        notes:      item.notes || null,
      };
    });

    // 4. Insert ke tabel orders
    const [orderResult] = await connection.query(
      `INSERT INTO orders (table_id, source, status, total_price, notes)
       VALUES (?, 'customer', 'pending', ?, ?)`,
      [table_id, totalPrice, notes || null]
    );
    const orderId = orderResult.insertId;

    // 5. Insert ke tabel order_items (bulk insert)
    const orderItemsValues = orderItemsData.map((oi) => [
      orderId,
      oi.menu_id,
      oi.quantity,
      oi.unit_price,
      oi.subtotal,
      oi.notes,
    ]);

    await connection.query(
      `INSERT INTO order_items (order_id, menu_id, quantity, unit_price, subtotal, notes)
       VALUES ?`,
      [orderItemsValues]
    );

    // 6. Update status meja menjadi 'occupied'
    await connection.query(
      "UPDATE `tables` SET status = 'occupied' WHERE id = ?",
      [table_id]
    );

    // 7. COMMIT — semua berhasil
    await connection.commit();
    connection.release();

    // 8. Susun payload notifikasi yang lengkap & informatif untuk TV Kasir
    //    Setiap item sudah memiliki nama menu dari menuMap (sudah di-query sebelumnya)
    const notificationPayload = {
      order_id:     orderId,
      table_id,
      table_number: table.table_number,
      source:       'customer',
      status:       'pending',
      total_price:  totalPrice,
      notes:        notes || null,
      items: orderItemsData.map((oi) => ({
        menu_id:    oi.menu_id,
        menu_name:  menuMap.get(oi.menu_id).name,   // nama menu untuk ditampilkan di TV
        quantity:   oi.quantity,
        unit_price: oi.unit_price,
        subtotal:   oi.subtotal,
        notes:      oi.notes,
      })),
      created_at: new Date(),
    };

    // 9. Emit ke SEMUA client yang terkoneksi (TV Kasir, Dashboard, dll.)
    req.io.emit('new_order', notificationPayload);
    console.log(`📢 [Socket] new_order emitted → Order #${orderId} | Meja ${table.table_number}`);

    return res.status(201).json({
      success:  true,
      message:  'Pesanan berhasil dibuat.',
      data: {
        order_id:    orderId,
        table_id,
        table_number: table.table_number,
        total_price:  totalPrice,
        status:       'pending',
        items:        orderItemsData,
      },
    });
  } catch (err) {
    // Rollback jika ada error di tengah proses
    await connection.rollback();
    connection.release();
    console.error('[orderController.createOrder]', err);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server. Pesanan dibatalkan.',
    });
  }
};

/**
 * GET /api/orders
 * Mengambil daftar pesanan beserta detail item & nomor meja.
 * Query param: ?status=pending (opsional, default: pending & processing)
 */
const getOrders = async (req, res) => {
  try {
    const { status } = req.query;

    // Subquery dipakai agar JSON_ARRAYAGG tidak bentrok dengan GROUP BY di MySQL strict mode
    let sql = `
      SELECT
        o.id,
        o.table_id,
        o.source,
        o.status,
        o.total_price,
        o.notes,
        o.created_at,
        t.table_number,
        JSON_ARRAYAGG(
          JSON_OBJECT(
            'id',         oi.id,
            'menu_id',    oi.menu_id,
            'menu_name',  m.name,
            'quantity',   oi.quantity,
            'unit_price', oi.unit_price,
            'subtotal',   oi.subtotal,
            'notes',      oi.notes
          )
        ) AS items
      FROM orders o
      JOIN \`tables\`   t  ON t.id  = o.table_id
      JOIN order_items oi ON oi.order_id = o.id
      JOIN menus       m  ON m.id  = oi.menu_id
    `;

    const params = [];
    if (status) {
      sql += ' WHERE o.status = ?';
      params.push(status);
    } else {
      sql += " WHERE o.status IN ('pending', 'processing')";
    }

    sql += ' GROUP BY o.id ORDER BY o.created_at DESC LIMIT 100';

    const [rows] = await pool.query(sql, params);

    // JSON_ARRAYAGG di MySQL dikembalikan sebagai string di beberapa versi
    const orders = rows.map((row) => ({
      ...row,
      items: typeof row.items === 'string' ? JSON.parse(row.items) : row.items,
    }));

    return res.status(200).json({ success: true, data: orders, total: orders.length });
  } catch (err) {
    console.error('[orderController.getOrders]', err);
    return res.status(500).json({ success: false, message: 'Gagal mengambil data pesanan.' });
  }
};

/**
 * PATCH /api/orders/:id/status
 * Mengubah status sebuah pesanan (kasir: processing → completed, dll.)
 * Body: { "status": "completed" }
 */
const updateOrderStatus = async (req, res) => {
  const { id }     = req.params;
  const { status } = req.body;

  const VALID = ['pending', 'processing', 'completed', 'cancelled'];
  if (!VALID.includes(status)) {
    return res.status(400).json({ success: false, message: `Status tidak valid. Pilih: ${VALID.join(', ')}` });
  }

  try {
    // Ambil info order (butuh table_id untuk update status meja)
    const [[order]] = await pool.query(
      'SELECT id, table_id, status FROM orders WHERE id = ?',
      [id]
    );
    if (!order) {
      return res.status(404).json({ success: false, message: 'Pesanan tidak ditemukan.' });
    }

    // Update status order
    await pool.query('UPDATE orders SET status = ? WHERE id = ?', [status, id]);

    // Broadcast perubahan status ke semua client (TV, dashboard)
    req.io.emit('order_updated', { order_id: parseInt(id), status });

    if (status === 'completed') {
      req.io.emit('order_completed', {
        order_id: Number(id),
        table_id: Number(order.table_id),
      });
    }

    return res.status(200).json({ success: true, message: `Status pesanan #${id} diubah ke '${status}'.` });
  } catch (err) {
    console.error('[orderController.updateOrderStatus]', err);
    return res.status(500).json({ success: false, message: 'Gagal mengubah status pesanan.' });
  }
};

/**
 * GET /api/orders/history
 * Riwayat semua pesanan dengan pagination & filter.
 * Query params: ?status=completed|cancelled|all  &from=YYYY-MM-DD  &to=YYYY-MM-DD  &limit=50  &offset=0
 */
const getOrderHistory = async (req, res) => {
  try {
    const { status = 'all', from, to, limit = 50, offset = 0 } = req.query;

    const conditions = [];
    const params     = [];

    if (status !== 'all') {
      conditions.push('o.status = ?');
      params.push(status);
    }
    if (from) { conditions.push('DATE(o.created_at) >= ?'); params.push(from); }
    if (to)   { conditions.push('DATE(o.created_at) <= ?'); params.push(to);   }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const dataSql = `
      SELECT
        o.id, o.source, o.status, o.total_price, o.notes, o.created_at,
        t.table_number,
        COUNT(oi.id) AS item_count
      FROM orders o
      JOIN \`tables\`   t  ON t.id = o.table_id
      JOIN order_items oi ON oi.order_id = o.id
      ${where}
      GROUP BY o.id
      ORDER BY o.created_at DESC
      LIMIT ? OFFSET ?
    `;

    const countSql = `
      SELECT COUNT(DISTINCT o.id) AS total
      FROM orders o
      JOIN \`tables\` t ON t.id = o.table_id
      ${where}
    `;

    const dataParams  = [...params, parseInt(limit), parseInt(offset)];
    const [rows]      = await pool.query(dataSql,  dataParams);
    const [[{ total }]] = await pool.query(countSql, params);

    return res.status(200).json({
      success: true,
      data:    rows,
      pagination: { total, limit: parseInt(limit), offset: parseInt(offset) },
    });
  } catch (err) {
    console.error('[orderController.getOrderHistory]', err);
    return res.status(500).json({ success: false, message: 'Gagal mengambil riwayat pesanan.' });
  }
};

/**
 * GET /api/dashboard/stats
 * Statistik ringkasan untuk manager.
 */
const getDashboardStats = async (req, res) => {
  try {
    const [[orderStats]] = await pool.query(`
      SELECT
        COUNT(*)                                                             AS total_orders,
        COALESCE(SUM(CASE WHEN status = 'completed' THEN total_price END),0) AS total_revenue,
        COALESCE(SUM(CASE WHEN DATE(created_at) = CURDATE() THEN 1 END),0)   AS orders_today,
        COALESCE(SUM(CASE WHEN DATE(created_at) = CURDATE()
                           AND status = 'completed' THEN total_price END),0)  AS revenue_today
      FROM orders
    `);

    const [[{ total_employees }]] = await pool.query(
      'SELECT COUNT(*) AS total_employees FROM users WHERE is_active = 1'
    );

    const [[{ pending_orders }]] = await pool.query(
      "SELECT COUNT(*) AS pending_orders FROM orders WHERE status IN ('pending','processing')"
    );

    return res.status(200).json({
      success: true,
      data: {
        total_orders:     orderStats.total_orders    || 0,
        total_revenue:    parseFloat(orderStats.total_revenue)  || 0,
        orders_today:     orderStats.orders_today    || 0,
        revenue_today:    parseFloat(orderStats.revenue_today)  || 0,
        total_employees,
        pending_orders,
      },
    });
  } catch (err) {
    console.error('[orderController.getDashboardStats]', err);
    return res.status(500).json({ success: false, message: 'Gagal mengambil statistik.' });
  }
};

module.exports = { createOrder, getOrders, updateOrderStatus, getOrderHistory, getDashboardStats };
