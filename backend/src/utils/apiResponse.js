class ApiResponse {
  static success(res, statusCode, payload = {}) {
    return res.status(statusCode).json({ success: true, ...payload });
  }

  static error(res, statusCode, message) {
    return res.status(statusCode).json({ success: false, message });
  }
}

module.exports = ApiResponse;
