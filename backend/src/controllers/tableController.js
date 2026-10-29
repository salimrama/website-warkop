const { pool } = require('../config/db');

/**
 * GET /api/tables
 * Mengambil semua meja beserta statusnya
 * Diurutkan berdasarkan nomor meja
 */
const getAllTables = async (req, res) => {
  try {
    const { status } = req.query; // Opsional: filter by status (available | occupied)

    let sql      = 'SELECT * FROM `tables`';
    const params = [];

    if (status) {
      sql += ' WHERE status = ?';
      params.push(status);
    }

    sql += ' ORDER BY table_number';

    const [rows] = await pool.query(sql, params);

    return res.status(200).json({
      success: true,
      data:    rows,
      total:   rows.length,
    });
  } catch (err) {
    console.error('[tableController.getAllTables]', err);
    return res.status(500).json({
      success: false,
      message: 'Gagal mengambil data meja.',
    });
  }
};

/**
 * POST /api/tables/:id/unlock
 * Kasir/Manajer membuka kunci meja: set status available & broadcast socket.
 */
const unlockTable = async (req, res) => {
  try {
    const { id } = req.params;

    const [[table]] = await pool.query('SELECT * FROM `tables` WHERE id = ?', [id]);
    if (!table) {
      return res.status(404).json({ success: false, message: 'Meja tidak ditemukan.' });
    }

    await pool.query("UPDATE `tables` SET status = 'available' WHERE id = ?", [id]);

    const io = req.app.get('io');
    if (io) {
      io.emit('table_unlocked', { tableId: Number(id) });
    }

    return res.status(200).json({
      success: true,
      message: `Meja ${table.table_number} berhasil dibuka kuncinya.`,
    });
  } catch (err) {
    console.error('[tableController.unlockTable]', err);
    return res.status(500).json({ success: false, message: 'Gagal membuka kunci meja.' });
  }
};

module.exports = { getAllTables, unlockTable };

