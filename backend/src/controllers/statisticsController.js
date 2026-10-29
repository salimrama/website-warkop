const { pool } = require('../config/db');

const isValidDate = (value) => {
  if (typeof value !== 'string') return false;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
};

const getStatisticsFilters = (query) => {
  const { date, startDate, endDate } = query;
  const conditions = ["o.status = 'completed'"];
  const params = [];

  if (date !== undefined && date !== '') {
    if (!isValidDate(date)) {
      return { error: 'date harus menggunakan format YYYY-MM-DD yang valid.' };
    }
    conditions.push('DATE(o.created_at) = ?');
    params.push(date);
  }

  if (startDate !== undefined) {
    if (!isValidDate(startDate)) {
      return { error: 'startDate harus menggunakan format YYYY-MM-DD yang valid.' };
    }
    conditions.push('o.created_at >= ?');
    params.push(`${startDate} 00:00:00`);
  }

  if (endDate !== undefined) {
    if (!isValidDate(endDate)) {
      return { error: 'endDate harus menggunakan format YYYY-MM-DD yang valid.' };
    }
    conditions.push('o.created_at < DATE_ADD(?, INTERVAL 1 DAY)');
    params.push(`${endDate} 00:00:00`);
  }

  if (startDate && endDate && startDate > endDate) {
    return { error: 'startDate tidak boleh lebih besar dari endDate.' };
  }

  if (date && (startDate || endDate)) {
    return { error: 'Gunakan tanggal spesifik atau rentang tanggal, bukan keduanya.' };
  }

  return { where: `WHERE ${conditions.join(' AND ')}`, params };
};

const respondWithFilterError = (res, error) =>
  res.status(400).json({ success: false, message: error });

const getSummary = async (req, res) => {
  const filters = getStatisticsFilters(req.query);
  if (filters.error) return respondWithFilterError(res, filters.error);

  try {
    const [[summary]] = await pool.query(
      `SELECT COUNT(*) AS total_transactions,
              COALESCE(SUM(o.total_price), 0) AS total_revenue
       FROM orders o
       ${filters.where}`,
      filters.params
    );

    return res.status(200).json({
      success: true,
      data: {
        total_revenue: Number(summary.total_revenue) || 0,
        total_transactions: Number(summary.total_transactions) || 0,
      },
    });
  } catch (err) {
    console.error('[statisticsController.getSummary]', err);
    return res.status(500).json({ success: false, message: 'Gagal mengambil ringkasan statistik.' });
  }
};

const getPopularItems = async (req, res) => {
  const filters = getStatisticsFilters(req.query);
  if (filters.error) return respondWithFilterError(res, filters.error);

  try {
    const [rows] = await pool.query(
      `SELECT m.id, m.name, m.category, SUM(oi.quantity) AS quantity_sold
       FROM orders o
       JOIN order_items oi ON oi.order_id = o.id
       JOIN menus m ON m.id = oi.menu_id
       ${filters.where}
       GROUP BY m.id, m.name, m.category
       ORDER BY m.category, quantity_sold DESC, m.name ASC`,
      filters.params
    );

    const data = { food: [], drink: [], snack: [] };
    for (const row of rows) {
      if (data[row.category] && data[row.category].length < 5) {
        data[row.category].push({
          id: row.id,
          name: row.name,
          quantity_sold: Number(row.quantity_sold) || 0,
        });
      }
    }

    return res.status(200).json({ success: true, data });
  } catch (err) {
    console.error('[statisticsController.getPopularItems]', err);
    return res.status(500).json({ success: false, message: 'Gagal mengambil menu terlaris.' });
  }
};

const getPeakHours = async (req, res) => {
  const filters = getStatisticsFilters(req.query);
  if (filters.error) return respondWithFilterError(res, filters.error);

  try {
    const [[summaryRows], [itemRows]] = await Promise.all([
      pool.query(
        `SELECT HOUR(o.created_at) AS hour,
                COUNT(DISTINCT o.id) AS transaction_count,
                COALESCE(SUM(oi.quantity), 0) AS total_items,
                COALESCE(SUM(CASE WHEN m.category = 'food' THEN oi.quantity ELSE 0 END), 0) AS food_items,
                COALESCE(SUM(CASE WHEN m.category = 'drink' THEN oi.quantity ELSE 0 END), 0) AS drink_items,
                COALESCE(SUM(CASE WHEN m.category = 'snack' THEN oi.quantity ELSE 0 END), 0) AS snack_items
         FROM orders o
         LEFT JOIN order_items oi ON oi.order_id = o.id
         LEFT JOIN menus m ON m.id = oi.menu_id
         ${filters.where}
         GROUP BY HOUR(o.created_at)
         ORDER BY hour`,
        filters.params
      ),
      pool.query(
        `SELECT HOUR(o.created_at) AS hour,
                m.id AS menu_id,
                m.name AS menu_name,
                m.category AS menu_category,
                SUM(oi.quantity) AS quantity_sold
       FROM orders o
       JOIN order_items oi ON oi.order_id = o.id
       JOIN menus m ON m.id = oi.menu_id
       ${filters.where}
       GROUP BY HOUR(o.created_at), m.id, m.name, m.category
       ORDER BY hour, quantity_sold DESC, m.name`,
        filters.params
      ),
    ]);

    const data = Array.from({ length: 24 }, (_, hour) => ({
      hour,
      transaction_count: 0,
      items: [],
      jam: `${String(hour).padStart(2, '0')}:00`,
      jumlahTransaksi: 0,
      totalItem: 0,
      makanan: 0,
      minuman: 0,
      cemilan: 0,
      detailItems: [],
    }));
    for (const row of itemRows) {
      const hour = Number(row.hour);
      const hourData = data[hour];
      const quantity = Number(row.quantity_sold) || 0;
      const detailItem = {
        id: row.menu_id,
        nama: row.menu_name,
        qty: quantity,
        kategori: row.menu_category,
      };
      hourData.detailItems.push(detailItem);
      hourData.items.push({
        id: row.menu_id,
        name: row.menu_name,
        category: row.menu_category,
        quantity_sold: quantity,
      });
    }
    for (const row of summaryRows) {
      const hourData = data[Number(row.hour)];
      hourData.transaction_count = Number(row.transaction_count) || 0;
      hourData.jumlahTransaksi = hourData.transaction_count;
      hourData.totalItem = Number(row.total_items) || 0;
      hourData.makanan = Number(row.food_items) || 0;
      hourData.minuman = Number(row.drink_items) || 0;
      hourData.cemilan = Number(row.snack_items) || 0;
    }

    return res.status(200).json({ success: true, data });
  } catch (err) {
    console.error('[statisticsController.getPeakHours]', err);
    return res.status(500).json({ success: false, message: 'Gagal mengambil analisis jam sibuk.' });
  }
};

const getRevenueTrend = async (req, res) => {
  const filters = getStatisticsFilters(req.query);
  if (filters.error) return respondWithFilterError(res, filters.error);

  const conditions = [filters.where.replace(/^WHERE\s+/i, '')];
  const params = [...filters.params];
  if (!req.query.date && !req.query.startDate && !req.query.endDate) {
    conditions.push('o.created_at >= DATE_SUB(CURDATE(), INTERVAL 29 DAY)');
  }

  try {
    const [rows] = await pool.query(
      `SELECT DATE_FORMAT(o.created_at, '%Y-%m-%d') AS report_date,
              COALESCE(SUM(o.total_price), 0) AS total_revenue,
              COUNT(*) AS total_transactions
       FROM orders o
       WHERE ${conditions.join(' AND ')}
       GROUP BY DATE_FORMAT(o.created_at, '%Y-%m-%d')
       ORDER BY report_date`,
      params
    );

    return res.status(200).json({
      success: true,
      data: (rows || []).map((row) => ({
        date: String(row.report_date),
        total_revenue: Number(row.total_revenue) || 0,
        total_transactions: Number(row.total_transactions) || 0,
      })),
    });
  } catch (err) {
    console.error('[statisticsController.getRevenueTrend]', err);
    return res.status(500).json({ success: false, message: 'Gagal mengambil tren pendapatan.' });
  }
};

module.exports = { getSummary, getPopularItems, getPeakHours, getRevenueTrend };
