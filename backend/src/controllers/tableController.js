const ApiResponse = require('../utils/apiResponse');

const createHandler = (operation, fallbackMessage, action) => async (req, res) => {
  try {
    return await action(req, res);
  } catch (error) {
    console.error(`[tableController.${operation}]`, error);
    return ApiResponse.error(res, error.statusCode || 500, error.statusCode ? error.message : fallbackMessage);
  }
};

module.exports = (tableService) => ({
  getAllTables: createHandler('getAllTables', 'Gagal mengambil data meja.', async (req, res) => {
    const data = await tableService.list(req.query.status);
    return ApiResponse.success(res, 200, { data, total: data.length });
  }),

  getTableStatus: createHandler('getTableStatus', 'Gagal memeriksa status meja.', async (req, res) => {
    const data = await tableService.getStatus(req.params.id);
    return ApiResponse.success(res, 200, { data });
  }),

  unlockTable: createHandler('unlockTable', 'Gagal membuka kunci meja.', async (req, res) => {
    const table = await tableService.unlock(req.params.id);
    const io = req.app.get('io');
    if (io) io.emit('table_unlocked', { tableId: Number(req.params.id) });
    return ApiResponse.success(res, 200, {
      message: `Meja ${table.table_number} berhasil dibuka kuncinya.`,
    });
  }),

  completeTableSession: createHandler(
    'completeTableSession',
    'Gagal mengakhiri sesi meja.',
    async (req, res) => {
      const table = await tableService.completeSession(req.params.id);
      const io = req.app.get('io');
      if (io) io.emit('table_session_ended', { tableId: Number(table.id) });
      return ApiResponse.success(res, 200, {
        message: `Sesi Meja ${table.table_number} telah diakhiri dan meja siap digunakan kembali.`,
      });
    }
  ),
});
