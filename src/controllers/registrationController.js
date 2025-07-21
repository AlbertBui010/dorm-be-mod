const registrationService = require("../services/registrationService");
const { successResponse, errorResponse } = require("../utils/response");
const {
  calculateEndDate,
  getEndDateCalculationInfo,
} = require("../utils/dateCalculator");

class RegistrationController {
  /**
   * Đăng ký ở ký túc xá
   * POST /api/registration/register
   */
  async register(req, res) {
    try {
      const {
        email,
        hoTen,
        ngaySinh,
        gioiTinh,
        soDienThoai,
        maSinhVien,
        ngayNhanPhong,
        nguyenVong,
      } = req.body;

      // Validation cơ bản
      if (!email || !hoTen) {
        return errorResponse(res, "Email và họ tên là bắt buộc.", 400);
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return errorResponse(res, "Email không hợp lệ.", 400);
      }

      const result = await registrationService.createRegistration({
        email,
        hoTen,
        ngaySinh,
        gioiTinh,
        soDienThoai,
        maSinhVien,
        ngayNhanPhong,
        nguyenVong,
      });

      if (result.success) {
        return successResponse(res, result.data, result.message);
      } else {
        // Trường hợp sinh viên đã tồn tại
        return errorResponse(res, result.message, 409, {
          shouldLogin: result.shouldLogin,
          existingStudent: result.existingStudent,
        });
      }
    } catch (error) {
      console.error("Lỗi đăng ký:", error);
      return errorResponse(
        res,
        "Có lỗi xảy ra khi đăng ký. Vui lòng thử lại.",
        500
      );
    }
  }

  /**
   * Xác thực email
   * POST /api/registration/verify-email
   */
  async verifyEmail(req, res) {
    try {
      const { token } = req.body;

      if (!token) {
        return errorResponse(res, "Mã xác thực là bắt buộc.", 400);
      }

      const result = await registrationService.verifyEmail(token);

      if (result.success) {
        return successResponse(res, result.data, result.message);
      } else {
        return errorResponse(res, result.message, 400);
      }
    } catch (error) {
      console.error("Lỗi xác thực email:", error);
      return errorResponse(
        res,
        "Có lỗi xảy ra khi xác thực email. Vui lòng thử lại.",
        500
      );
    }
  }

  /**
   * Xác thực email qua GET (từ link trong email)
   * GET /api/registration/verify-email/:token
   */
  async verifyEmailByLink(req, res) {
    try {
      const { token } = req.params;

      if (!token) {
        return res.redirect(
          `${process.env.FRONTEND_URL}/verify-email?error=missing_token`
        );
      }

      const result = await registrationService.verifyEmail(token);

      if (result.success) {
        // Redirect về trang thiết lập mật khẩu
        return res.redirect(
          `${process.env.FRONTEND_URL}/setup-password?maSinhVien=${result.data.maSinhVien}&verified=true`
        );
      } else {
        return res.redirect(
          `${process.env.FRONTEND_URL}/verify-email?error=invalid_token`
        );
      }
    } catch (error) {
      console.error("Lỗi xác thực email qua link:", error);
      return res.redirect(
        `${process.env.FRONTEND_URL}/verify-email?error=server_error`
      );
    }
  }

  /**
   * Thiết lập mật khẩu
   * POST /api/registration/setup-password
   */
  async setupPassword(req, res) {
    try {
      const { maSinhVien, matKhau, xacNhanMatKhau } = req.body;

      // Validation
      if (!maSinhVien || !matKhau || !xacNhanMatKhau) {
        return errorResponse(
          res,
          "Mã sinh viên, mật khẩu và xác nhận mật khẩu là bắt buộc.",
          400
        );
      }

      if (matKhau !== xacNhanMatKhau) {
        return errorResponse(
          res,
          "Mật khẩu và xác nhận mật khẩu không khớp.",
          400
        );
      }

      // Validate password strength
      if (matKhau.length < 6) {
        return errorResponse(res, "Mật khẩu phải có ít nhất 6 ký tự.", 400);
      }

      const result = await registrationService.setupPassword(
        maSinhVien,
        matKhau
      );

      if (result.success) {
        return successResponse(res, result.data, result.message);
      } else {
        return errorResponse(res, result.message, 400);
      }
    } catch (error) {
      console.error("Lỗi thiết lập mật khẩu:", error);
      return errorResponse(
        res,
        "Có lỗi xảy ra khi thiết lập mật khẩu. Vui lòng thử lại.",
        500
      );
    }
  }

  /**
   * Gửi lại email xác thực
   * POST /api/registration/resend-verification
   */
  async resendVerification(req, res) {
    try {
      const { email } = req.body;

      if (!email) {
        return errorResponse(res, "Email là bắt buộc.", 400);
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return errorResponse(res, "Email không hợp lệ.", 400);
      }

      const result = await registrationService.resendVerificationEmail(email);

      if (result.success) {
        return successResponse(res, null, result.message);
      } else {
        return errorResponse(res, result.message, 400);
      }
    } catch (error) {
      console.error("Lỗi gửi lại email:", error);
      return errorResponse(
        res,
        "Có lỗi xảy ra khi gửi email. Vui lòng thử lại.",
        500
      );
    }
  }

  /**
   * Kiểm tra trạng thái đăng ký
   * GET /api/registration/status/:maSinhVien
   */
  async getRegistrationStatus(req, res) {
    try {
      const { maSinhVien } = req.params;

      if (!maSinhVien) {
        return errorResponse(res, "Mã sinh viên là bắt buộc.", 400);
      }

      const result = await registrationService.getRegistrationStatus(
        maSinhVien
      );

      if (result.success) {
        return successResponse(res, result.data, "Lấy thông tin thành công.");
      } else {
        return errorResponse(res, result.message, 404);
      }
    } catch (error) {
      console.error("Lỗi lấy trạng thái:", error);
      return errorResponse(
        res,
        "Có lỗi xảy ra khi lấy thông tin. Vui lòng thử lại.",
        500
      );
    }
  }

  /**
   * Kiểm tra email/mã sinh viên có tồn tại không
   * POST /api/registration/check-existing
   */
  async checkExisting(req, res) {
    try {
      const { email, maSinhVien } = req.body;

      if (!email && !maSinhVien) {
        return errorResponse(res, "Email hoặc mã sinh viên là bắt buộc.", 400);
      }

      const SinhVien = require("../models/SinhVien");
      const where = {};

      if (email) where.Email = email;
      if (maSinhVien) where.MaSinhVien = maSinhVien;

      const existingSinhVien = await SinhVien.findOne({ where });

      if (existingSinhVien) {
        return successResponse(
          res,
          {
            exists: true,
            student: {
              maSinhVien: existingSinhVien.MaSinhVien,
              hoTen: existingSinhVien.HoTen,
              email: existingSinhVien.Email,
              emailDaXacThuc: existingSinhVien.EmailDaXacThuc,
              matKhauDaThietLap: !!existingSinhVien.MatKhau,
            },
          },
          "Tìm thấy thông tin sinh viên."
        );
      } else {
        return successResponse(
          res,
          {
            exists: false,
          },
          "Không tìm thấy thông tin sinh viên."
        );
      }
    } catch (error) {
      console.error("Lỗi kiểm tra thông tin:", error);
      return errorResponse(
        res,
        "Có lỗi xảy ra khi kiểm tra thông tin. Vui lòng thử lại.",
        500
      );
    }
  }

  /**
   * Tính toán ngày kết thúc hợp đồng dựa trên ngày nhận phòng
   * POST /api/registration/calculate-end-date
   */
  async calculateEndDate(req, res) {
    try {
      const { ngayNhanPhong } = req.body;

      if (!ngayNhanPhong) {
        return errorResponse(res, "Ngày nhận phòng là bắt buộc.", 400);
      }

      const receiveDate = new Date(ngayNhanPhong);
      if (isNaN(receiveDate.getTime())) {
        return errorResponse(res, "Ngày nhận phòng không hợp lệ.", 400);
      }

      const endDate = calculateEndDate(receiveDate);
      const calculationInfo = getEndDateCalculationInfo(receiveDate);

      return successResponse(
        res,
        {
          ngayNhanPhong: receiveDate.toISOString().split("T")[0],
          ngayTinhTienPhongDuKien: endDate.toISOString().split("T")[0],
          thongTinTinhToan: calculationInfo,
        },
        "Tính toán ngày tính tiền phòng thành công."
      );
    } catch (error) {
      console.error("Lỗi tính toán ngày kết thúc:", error);
      return errorResponse(
        res,
        "Có lỗi xảy ra khi tính toán ngày kết thúc. Vui lòng thử lại.",
        500
      );
    }
  }

  /**
   * Gia hạn hợp đồng ở ký túc xá
   * POST /api/registration/renew
   */
  async renewContract(req, res) {
    try {
      const maSinhVien = req.user?.MaSinhVien || req.body.maSinhVien;
      if (!maSinhVien) {
        return errorResponse(res, "Thiếu mã sinh viên.", 400);
      }
      const result = await registrationService.renewContract(maSinhVien);
      if (result.success) {
        return successResponse(res, result.data, result.message);
      } else {
        return errorResponse(res, result.message, 400);
      }
    } catch (error) {
      console.error("Lỗi gia hạn hợp đồng:", error);
      return errorResponse(res, "Có lỗi xảy ra khi gia hạn hợp đồng.", 500);
    }
  }
}

module.exports = new RegistrationController();
