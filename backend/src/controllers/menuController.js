const ApiResponse = require('../utils/apiResponse');

const createHandler = (operation, fallbackMessage, action) => async (req, res) => {
  try {
    return await action(req, res);
  } catch (error) {
    console.error(`[menuController.${operation}]`, error);
    return ApiResponse.error(res, error.statusCode || 500, error.statusCode ? error.message : fallbackMessage);
  }
};

module.exports = (menuService) => ({
  getAllMenus: createHandler('getAllMenus', 'Gagal mengambil data menu.', async (req, res) => {
    const data = await menuService.list(req.query);
    return ApiResponse.success(res, 200, { data, total: data.length });
  }),

  createMenu: createHandler('createMenu', 'Gagal menambahkan menu.', async (req, res) => {
    const data = await menuService.create(req.body);
    return ApiResponse.success(res, 201, { message: 'Menu berhasil ditambahkan.', data });
  }),

  updateMenu: createHandler('updateMenu', 'Gagal memperbarui menu.', async (req, res) => {
    await menuService.update(req.params.id, req.body);
    return ApiResponse.success(res, 200, { message: 'Menu berhasil diperbarui.' });
  }),

  deleteMenu: createHandler(
    'deleteMenu',
    'Gagal menghapus menu. Kemungkinan menu sudah terhubung ke data pesanan.',
    async (req, res) => {
      await menuService.delete(req.params.id);
      return ApiResponse.success(res, 200, { message: 'Menu berhasil dihapus.' });
    }
  ),
});
