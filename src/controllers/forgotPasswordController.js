const authService = require("../services/authService");
const { successResponse, errorResponse } = require("../utils/response");

class ForgotPasswordController {
  /**
   * Gửi email reset mật khẩu
   * POST /api/auth/forgot-password
   */
  async forgotPassword(req, res) {
    try {
      const { email } = req.body;

      const result = await authService.forgotPassword(email);

      if (result.success) {
        return successResponse(res, null, result.message);
      } else {
        return errorResponse(res, result.message, 400);
      }
    } catch (error) {
      console.error("Lỗi forgot password:", error);
      return errorResponse(
        res,
        error.message || "Có lỗi xảy ra khi gửi email reset mật khẩu",
        500
      );
    }
  }

  /**
   * Reset mật khẩu với OTP
   * POST /api/auth/reset-password
   */
  async resetPassword(req, res) {
    try {
      const { email, token, newPassword } = req.body;

      const result = await authService.resetPassword(email, token, newPassword);

      if (result.success) {
        return successResponse(res, null, result.message);
      } else {
        return errorResponse(res, result.message, 400);
      }
    } catch (error) {
      console.error("Lỗi reset password:", error);
      return errorResponse(
        res,
        error.message || "Có lỗi xảy ra khi reset mật khẩu",
        500
      );
    }
  }
}

module.exports = new ForgotPasswordController();
