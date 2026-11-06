const ServiceError = require('./serviceError');

const isValidDate = (value) => {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
};

class StatisticsService {
  constructor(statisticsRepository) {
    this.statisticsRepository = statisticsRepository;
  }

  getFilters(query) {
    const { date, startDate, endDate } = query;
    const conditions = ["o.status = 'completed'"];
    const params = [];
    if (date !== undefined && date !== '') {
      if (!isValidDate(date)) {
        throw new ServiceError('date harus menggunakan format YYYY-MM-DD yang valid.', 400);
      }
      conditions.push('DATE(o.created_at) = ?');
      params.push(date);
    }
    if (startDate !== undefined) {
      if (!isValidDate(startDate)) {
        throw new ServiceError('startDate harus menggunakan format YYYY-MM-DD yang valid.', 400);
      }
      conditions.push('o.created_at >= ?');
      params.push(`${startDate} 00:00:00`);
    }
    if (endDate !== undefined) {
      if (!isValidDate(endDate)) {
        throw new ServiceError('endDate harus menggunakan format YYYY-MM-DD yang valid.', 400);
      }
      conditions.push('o.created_at < DATE_ADD(?, INTERVAL 1 DAY)');
      params.push(`${endDate} 00:00:00`);
    }
    if (startDate && endDate && startDate > endDate) {
      throw new ServiceError('startDate tidak boleh lebih besar dari endDate.', 400);
    }
    if (date && (startDate || endDate)) {
      throw new ServiceError('Gunakan tanggal spesifik atau rentang tanggal, bukan keduanya.', 400);
    }
    return { where: `WHERE ${conditions.join(' AND ')}`, params };
  }

  async summary(query) {
    const filters = this.getFilters(query);
    const summary = await this.statisticsRepository.getSummary(filters.where, filters.params);
    return {
      total_revenue: Number(summary.total_revenue) || 0,
      total_transactions: Number(summary.total_transactions) || 0,
    };
  }

  async popularItems(query) {
    const filters = this.getFilters(query);
    const rows = await this.statisticsRepository.getPopularItems(filters.where, filters.params);
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
    return data;
  }

  async peakHours(query) {
    const filters = this.getFilters(query);
    const [[summaryRows], [itemRows]] = await this.statisticsRepository.getPeakHourData(
      filters.where,
      filters.params
    );
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
      const hourData = data[Number(row.hour)];
      const quantity = Number(row.quantity_sold) || 0;
      hourData.detailItems.push({
        id: row.menu_id,
        nama: row.menu_name,
        qty: quantity,
        kategori: row.menu_category,
      });
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
    return data;
  }

  async revenueTrend(query) {
    const filters = this.getFilters(query);
    const conditions = [filters.where.replace(/^WHERE\s+/i, '')];
    if (!query.date && !query.startDate && !query.endDate) {
      conditions.push('o.created_at >= DATE_SUB(CURDATE(), INTERVAL 29 DAY)');
    }
    const rows = await this.statisticsRepository.getRevenueTrend(
      `WHERE ${conditions.join(' AND ')}`,
      filters.params
    );
    return rows.map((row) => ({
      date: String(row.report_date),
      total_revenue: Number(row.total_revenue) || 0,
      total_transactions: Number(row.total_transactions) || 0,
    }));
  }
}

module.exports = StatisticsService;
