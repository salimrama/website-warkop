const ApiResponse = require('../utils/apiResponse');

module.exports = (databaseService) => ({
  getTableData: async (req, res) => {
    try {
      const { columns, rows } = await databaseService.readTable(req.params.tableName);
      return ApiResponse.success(res, 200, { columns, data: rows });
    } catch (error) {
      console.error('[databaseController.getTableData]', error);
      return ApiResponse.error(
        res,
        error.statusCode || 500,
        error.statusCode ? error.message : 'Gagal mengambil data tabel.'
      );
    }
  },
});
