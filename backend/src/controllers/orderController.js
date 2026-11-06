const ApiResponse = require('../utils/apiResponse');

const createHandler = (operation, fallbackMessage, action) => async (req, res) => {
  try {
    return await action(req, res);
  } catch (error) {
    console.error(`[orderController.${operation}]`, error);
    return ApiResponse.error(res, error.statusCode || 500, error.statusCode ? error.message : fallbackMessage);
  }
};

module.exports = (orderService) => ({
  createOrder: createHandler(
    'createOrder',
    'Terjadi kesalahan server. Pesanan dibatalkan.',
    async (req, res) => {
      const { response, notification } = await orderService.create(req.body);
      const io = req.io || req.app.get('io');
      if (io) {
        io.emit('new_order', notification);
        console.log(
          `📢 [Socket] new_order emitted → Order #${notification.order_id} | Meja ${notification.table_number}`
        );
      }
      return ApiResponse.success(res, 201, {
        message: 'Pesanan berhasil dibuat.',
        data: response,
      });
    }
  ),

  getOrders: createHandler('getOrders', 'Gagal mengambil data pesanan.', async (req, res) => {
    const data = await orderService.list(req.query.status);
    return ApiResponse.success(res, 200, { data, total: data.length });
  }),

  updateOrderStatus: createHandler(
    'updateOrderStatus',
    'Gagal mengubah status pesanan.',
    async (req, res) => {
      const result = await orderService.updateStatus(req.params.id, req.body.status);
      const io = req.io || req.app.get('io');
      if (io) {
        io.emit('order_updated', { order_id: result.orderId, status: result.status });
        if (result.status === 'completed') {
          io.emit('order_completed', {
            order_id: result.orderId,
            table_id: result.tableId,
          });
        }
      }
      return ApiResponse.success(res, 200, {
        message: `Status pesanan #${req.params.id} diubah ke '${result.status}'.`,
      });
    }
  ),

  getOrderHistory: createHandler(
    'getOrderHistory',
    'Gagal mengambil riwayat pesanan.',
    async (req, res) => {
      const result = await orderService.history(req.query);
      return ApiResponse.success(res, 200, result);
    }
  ),

  getDashboardStats: createHandler(
    'getDashboardStats',
    'Gagal mengambil statistik.',
    async (_req, res) => {
      const data = await orderService.dashboardStats();
      return ApiResponse.success(res, 200, { data });
    }
  ),
});
