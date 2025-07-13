const AuthService = require("../services/authService");
const { successResponse, errorResponse } = require("../utils/response");
const { validationResult } = require("express-validator");

class AuthController {
  async login(req, res, next) {
    try {
      const { username, password } = req.body;

      const result = await AuthService.login({ username, password });

      return successResponse(res, result, "Đăng nhập thành công");
    } catch (error) {
      next(error);
    }
  }

  async changePassword(req, res, next) {
    try {
      const { currentPassword, newPassword } = req.body;
      const userId = req.user.MaNhanVien;

      const result = await AuthService.changePassword(
        userId,
        currentPassword,
        newPassword
      );

      return successResponse(res, result, "Đổi mật khẩu thành công");
    } catch (error) {
      next(error);
    }
  }

  async getProfile(req, res, next) {
    try {
      const userId = req.user.MaNhanVien;

      const profile = await AuthService.getUserProfile(userId);

      return successResponse(res, profile, "Lấy thông tin profile thành công");
    } catch (error) {
      next(error);
    }
  }

  async logout(req, res) {
    // In JWT-based auth, logout is typically handled on client-side
    // But we can implement token blacklisting if needed
    return successResponse(res, null, "Đăng xuất thành công");
  }
}

module.exports = new AuthController();
