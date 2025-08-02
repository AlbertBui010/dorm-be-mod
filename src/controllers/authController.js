const AuthService = require("../services/authService");
const SinhVienAuthService = require("../services/sinhVienAuthService");
const { successResponse, errorResponse } = require("../utils/response");

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

      let result;
      if (req.user.userType === "employee") {
        const userId = req.user.MaNhanVien;
        result = await AuthService.changePassword(
          userId,
          currentPassword,
          newPassword
        );
      } else {
        const maSinhVien = req.user.MaSinhVien;
        result = await SinhVienAuthService.changePassword(
          maSinhVien,
          currentPassword,
          newPassword
        );
      }

      return successResponse(res, result, "Đổi mật khẩu thành công");
    } catch (error) {
      next(error);
    }
  }

  async getProfile(req, res, next) {
    try {
      let profile;
      if (req.user.userType === "employee") {
        const userId = req.user.MaNhanVien;
        profile = await AuthService.getUserProfile(userId);
      } else {
        const maSinhVien = req.user.MaSinhVien;
        profile = await SinhVienAuthService.getProfile(maSinhVien);
      }

      return successResponse(res, profile, "Lấy thông tin profile thành công");
    } catch (error) {
      next(error);
    }
  }

  async logout(req, res) {
    return successResponse(res, null, "Đăng xuất thành công");
  }

  // Student-specific endpoints
  async setPassword(req, res, next) {
    try {
      const { newPassword } = req.body;

      if (req.user.userType !== "student") {
        return errorResponse(
          res,
          "Chỉ sinh viên mới có thể thiết lập mật khẩu",
          403
        );
      }

      const maSinhVien = req.user.MaSinhVien;
      const result = await SinhVienAuthService.setPassword(
        maSinhVien,
        newPassword,
        maSinhVien
      );

      return successResponse(res, result, "Thiết lập mật khẩu thành công");
    } catch (error) {
      next(error);
    }
  }

  // Password reset endpoints (public)
  async sendPasswordResetEmail(req, res, next) {
    try {
      const { email } = req.body;
      const result = await SinhVienAuthService.sendPasswordResetEmail(email);
      return successResponse(res, result, "Email khôi phục mật khẩu đã được gửi");
    } catch (error) {
      next(error);
    }
  }

  async verifyResetToken(req, res, next) {
    try {
      const { token } = req.params;
      const result = await SinhVienAuthService.verifyResetToken(token);
      return successResponse(res, result, "Token hợp lệ");
    } catch (error) {
      next(error);
    }
  }

  async resetPassword(req, res, next) {
    try {
      const { token, newPassword } = req.body;
      const result = await SinhVienAuthService.resetPassword(token, newPassword);
      return successResponse(res, result, "Đặt lại mật khẩu thành công");
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AuthController();
