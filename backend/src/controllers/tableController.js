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
 * GET /api/tables/:id/status
 * Mengambil status satu meja untuk memvalidasi sesi pelanggan tersimpan.
 */
const getTableStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const [[table]] = await pool.query(
      'SELECT id, table_number, status FROM `tables` WHERE id = ?',
      [id]
    );

    if (!table) {
      return res.status(404).json({ success: false, message: 'Meja tidak ditemukan.' });
    }

    return res.status(200).json({ success: true, data: table });
  } catch (err) {
    console.error('[tableController.getTableStatus]', err);
    return res.status(500).json({ success: false, message: 'Gagal memeriksa status meja.' });
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

/**
 * POST /api/tables/:id/complete
 * Mengakhiri sesi meja, mengosongkannya, dan memaksa klien pelanggan mereset sesi.
 */
const completeTableSession = async (req, res) => {
  try {
    const { id } = req.params;
    const [[table]] = await pool.query(
      'SELECT id, table_number FROM `tables` WHERE id = ?',
      [id]
    );

    if (!table) {
      return res.status(404).json({ success: false, message: 'Meja tidak ditemukan.' });
    }

    await pool.query("UPDATE `tables` SET status = 'available' WHERE id = ?", [id]);

    const io = req.app.get('io');
    if (io) {
      io.emit('table_session_ended', { tableId: Number(table.id) });
    }

    return res.status(200).json({
      success: true,
      message: `Sesi Meja ${table.table_number} telah diakhiri dan meja siap digunakan kembali.`,
    });
  } catch (err) {
    console.error('[tableController.completeTableSession]', err);
    return res.status(500).json({ success: false, message: 'Gagal mengakhiri sesi meja.' });
  }
};

module.exports = { getAllTables, getTableStatus, unlockTable, completeTableSession };
