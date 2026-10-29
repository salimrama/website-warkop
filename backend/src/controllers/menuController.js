const { pool } = require('../config/db');

/**
 * GET /api/menus
 * Mengambil semua menu yang tersedia (is_available = 1)
 * Diurutkan berdasarkan kategori, lalu nama
 */
const getAllMenus = async (req, res) => {
  try {
    const { category, all } = req.query; // all=1 untuk admin melihat menu non-aktif juga

    let sql    = all === '1' ? 'SELECT * FROM menus WHERE 1=1' : 'SELECT * FROM menus WHERE is_available = 1';
    const params = [];

    if (category && category !== 'all') {
      sql += ' AND category = ?';
      params.push(category);
    }

    sql += ' ORDER BY category, name';

    const [rows] = await pool.query(sql, params);

    return res.status(200).json({
      success: true,
      data:    rows,
      total:   rows.length,
    });
  } catch (err) {
    console.error('[menuController.getAllMenus]', err);
    return res.status(500).json({
      success: false,
      message: 'Gagal mengambil data menu.',
    });
  }
};

/**
 * POST /api/menus
 * Menambahkan menu baru (khusus Manager)
 * Body: { name, description, price, category, image_url }
 */
const createMenu = async (req, res) => {
  try {
    const { name, description, price, category = 'drink', image_url } = req.body;

    if (!name || !price) {
      return res.status(400).json({
        success: false,
        message: 'Nama menu dan harga wajib diisi.',
      });
    }

    if (!['drink', 'food', 'snack'].includes(category)) {
      return res.status(400).json({
        success: false,
        message: "Kategori harus 'drink', 'food', atau 'snack'.",
      });
    }

    const [result] = await pool.query(
      `INSERT INTO menus (name, description, price, category, image_url, is_available)
       VALUES (?, ?, ?, ?, ?, 1)`,
      [name, description || null, parseFloat(price), category, image_url || null]
    );

    return res.status(201).json({
      success: true,
      message: 'Menu berhasil ditambahkan.',
      data: {
        id: result.insertId,
        name,
        description,
        price: parseFloat(price),
        category,
        image_url,
        is_available: 1,
      },
    });
  } catch (err) {
    console.error('[menuController.createMenu]', err);
    return res.status(500).json({
      success: false,
      message: 'Gagal menambahkan menu.',
    });
  }
};

/**
 * PUT /api/menus/:id
 * Mengupdate data menu
 */
const updateMenu = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, price, category, image_url, is_available } = req.body;

    await pool.query(
      `UPDATE menus
       SET name = COALESCE(?, name),
           description = COALESCE(?, description),
           price = COALESCE(?, price),
           category = COALESCE(?, category),
           image_url = COALESCE(?, image_url),
           is_available = COALESCE(?, is_available)
       WHERE id = ?`,
      [name, description, price, category, image_url, is_available, id]
    );

    return res.status(200).json({
      success: true,
      message: 'Menu berhasil diperbarui.',
    });
  } catch (err) {
    console.error('[menuController.updateMenu]', err);
    return res.status(500).json({
      success: false,
      message: 'Gagal memperbarui menu.',
    });
  }
};

/**
 * DELETE /api/menus/:id
 * Menghapus menu
 */
const deleteMenu = async (req, res) => {
  try {
    const { id } = req.params;

    // Soft delete atau hard delete
    await pool.query('DELETE FROM menus WHERE id = ?', [id]);

    return res.status(200).json({
      success: true,
      message: 'Menu berhasil dihapus.',
    });
  } catch (err) {
    console.error('[menuController.deleteMenu]', err);
    return res.status(500).json({
      success: false,
      message: 'Gagal menghapus menu. Kemungkinan menu sudah terhubung ke data pesanan.',
    });
  }
};

module.exports = { getAllMenus, createMenu, updateMenu, deleteMenu };
