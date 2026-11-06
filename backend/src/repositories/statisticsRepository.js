class StatisticsRepository {
  constructor(db) {
    this.db = db;
  }

  async getSummary(where, params) {
    const [[summary]] = await this.db.query(
      `SELECT COUNT(*) AS total_transactions,
              COALESCE(SUM(o.total_price), 0) AS total_revenue
       FROM orders o
       ${where}`,
      params
    );
    return summary || null;
  }

  async getPopularItems(where, params) {
    const [rows] = await this.db.query(
      `SELECT m.id, m.name, m.category, SUM(oi.quantity) AS quantity_sold
       FROM orders o
       JOIN order_items oi ON oi.order_id = o.id
       JOIN menus m ON m.id = oi.menu_id
       ${where}
       GROUP BY m.id, m.name, m.category
       ORDER BY m.category, quantity_sold DESC, m.name ASC`,
      params
    );
    return rows;
  }

  async getPeakHourData(where, params) {
    return Promise.all([
      this.db.query(
        `SELECT HOUR(o.created_at) AS hour,
                COUNT(DISTINCT o.id) AS transaction_count,
                COALESCE(SUM(oi.quantity), 0) AS total_items,
                COALESCE(SUM(CASE WHEN m.category = 'food' THEN oi.quantity ELSE 0 END), 0) AS food_items,
                COALESCE(SUM(CASE WHEN m.category = 'drink' THEN oi.quantity ELSE 0 END), 0) AS drink_items,
                COALESCE(SUM(CASE WHEN m.category = 'snack' THEN oi.quantity ELSE 0 END), 0) AS snack_items
         FROM orders o
         LEFT JOIN order_items oi ON oi.order_id = o.id
         LEFT JOIN menus m ON m.id = oi.menu_id
         ${where}
         GROUP BY HOUR(o.created_at)
         ORDER BY hour`,
        params
      ),
      this.db.query(
        `SELECT HOUR(o.created_at) AS hour, m.id AS menu_id, m.name AS menu_name,
                m.category AS menu_category, SUM(oi.quantity) AS quantity_sold
         FROM orders o
         JOIN order_items oi ON oi.order_id = o.id
         JOIN menus m ON m.id = oi.menu_id
         ${where}
         GROUP BY HOUR(o.created_at), m.id, m.name, m.category
         ORDER BY hour, quantity_sold DESC, m.name`,
        params
      ),
    ]);
  }

  async getRevenueTrend(where, params) {
    const [rows] = await this.db.query(
      `SELECT DATE_FORMAT(o.created_at, '%Y-%m-%d') AS report_date,
              COALESCE(SUM(o.total_price), 0) AS total_revenue,
              COUNT(*) AS total_transactions
       FROM orders o
       ${where}
       GROUP BY DATE_FORMAT(o.created_at, '%Y-%m-%d')
       ORDER BY report_date`,
      params
    );
    return rows;
  }
}

module.exports = StatisticsRepository;
