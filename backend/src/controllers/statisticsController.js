const ApiResponse = require('../utils/apiResponse');

const createHandler = (operation, fallbackMessage, action) => async (req, res) => {
  try {
    const data = await action(req.query);
    return ApiResponse.success(res, 200, { data });
  } catch (error) {
    console.error(`[statisticsController.${operation}]`, error);
    return ApiResponse.error(res, error.statusCode || 500, error.statusCode ? error.message : fallbackMessage);
  }
};

module.exports = (statisticsService) => ({
  getSummary: createHandler(
    'getSummary',
    'Gagal mengambil ringkasan statistik.',
    (query) => statisticsService.summary(query)
  ),
  getPopularItems: createHandler(
    'getPopularItems',
    'Gagal mengambil menu terlaris.',
    (query) => statisticsService.popularItems(query)
  ),
  getPeakHours: createHandler(
    'getPeakHours',
    'Gagal mengambil analisis jam sibuk.',
    (query) => statisticsService.peakHours(query)
  ),
  getRevenueTrend: createHandler(
    'getRevenueTrend',
    'Gagal mengambil tren pendapatan.',
    (query) => statisticsService.revenueTrend(query)
  ),
});
