const ApiResponse = require('../utils/apiResponse');

const createHandler = (operation, fallbackMessage, action) => async (req, res) => {
  try {
    return await action(req, res);
  } catch (error) {
    console.error(`[userController.${operation}]`, error);
    return ApiResponse.error(res, error.statusCode || 500, error.statusCode ? error.message : fallbackMessage);
  }
};

module.exports = (userService) => ({
  getUsers: createHandler('getUsers', 'Gagal mengambil data karyawan.', async (_req, res) => {
    const data = await userService.list();
    return ApiResponse.success(res, 200, { data, total: data.length });
  }),

  createUser: createHandler('createUser', 'Gagal menambahkan karyawan.', async (req, res) => {
    const data = await userService.create(req.body);
    return ApiResponse.success(res, 201, { message: 'Karyawan baru berhasil ditambahkan.', data });
  }),

  toggleUserStatus: createHandler(
    'toggleUserStatus',
    'Gagal memperbarui status karyawan.',
    async (req, res) => {
      await userService.setActive(req.params.id, req.body.is_active);
      return ApiResponse.success(res, 200, { message: 'Status karyawan berhasil diperbarui.' });
    }
  ),

  deleteUser: createHandler('deleteUser', 'Gagal menghapus karyawan.', async (req, res) => {
    await userService.delete(req.params.id, req.user.id);
    return ApiResponse.success(res, 200, { message: 'Akun karyawan berhasil dihapus.' });
  }),
});
