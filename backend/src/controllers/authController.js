const ApiResponse = require('../utils/apiResponse');

const createHandler = (operation, fallbackMessage, action) => async (req, res) => {
  try {
    return await action(req, res);
  } catch (error) {
    console.error(`[authController.${operation}]`, error);
    return ApiResponse.error(res, error.statusCode || 500, error.statusCode ? error.message : fallbackMessage);
  }
};

module.exports = (authService) => ({
  login: createHandler('login', 'Terjadi kesalahan pada server saat login.', async (req, res) => {
    const { token, user } = await authService.login(req.body.email, req.body.password);
    return ApiResponse.success(res, 200, { message: 'Login berhasil.', token, user });
  }),

  getMe: (req, res) => ApiResponse.success(res, 200, { user: req.user }),

  changePassword: createHandler('changePassword', 'Gagal mengubah password.', async (req, res) => {
    await authService.changePassword(req.user.id, req.body.oldPassword, req.body.newPassword);
    return ApiResponse.success(res, 200, { message: 'Password berhasil diubah.' });
  }),
});
