const { NhanVien, SinhVien } = require("../models");
const {
  hashPassword,
  comparePassword,
  generateToken,
} = require("../utils/auth");
const SinhVienAuthService = require("./sinhVienAuthService");
const { Op } = require("sequelize");
const { NHAN_VIEN_TRANG_THAI } = require("../constants/nhanVien");
const crypto = require("crypto");
const emailService = require("../utils/email");

class AuthService {
  // Handles both employees and students
  async login(credentials) {
    const { username, password } = credentials;

    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(username);

    if (isEmail) {
      // Email input - search in SinhVien table first
      try {
        const result = await SinhVienAuthService.login({
          email: username,
          password,
        });

        return result;
      } catch (error) {
        // If not found in SinhVien, check NhanVien with email
        return await this.loginEmployee({ email: username, password });
      }
    } else {
      // Username input - search in NhanVien table
      return await this.loginEmployee({ username, password });
    }
  }

  async loginEmployee(credentials) {
    const { username, email, password } = credentials;

    const whereClause = {};
    if (email) {
      whereClause.Email = email;
    } else {
      whereClause.TenDangNhap = username;
    }
    whereClause.TrangThai = NHAN_VIEN_TRANG_THAI.HOAT_DONG;

    const user = await NhanVien.findOne({ where: whereClause });

    if (!user) {
      throw new Error("Tên đăng nhập/Email hoặc mật khẩu không đúng");
    }

    const isValidPassword = await comparePassword(password, user.MatKhau);
    if (!isValidPassword) {
      throw new Error("Tên đăng nhập/Email hoặc mật khẩu không đúng");
    }

    const token = generateToken({
      MaNhanVien: user.MaNhanVien,
      TenDangNhap: user.TenDangNhap,
      VaiTro: user.VaiTro,
      type: "employee",
    });

    const userInfo = {
      MaNhanVien: user.MaNhanVien,
      TenDangNhap: user.TenDangNhap,
      HoTen: user.HoTen,
      Email: user.Email,
      VaiTro: user.VaiTro,
    };

    return {
      user: userInfo,
      token,
    };
  }

  async changePassword(userId, currentPassword, newPassword) {
    const user = await NhanVien.findByPk(userId);

    if (!user) {
      throw new Error("Người dùng không tồn tại");
    }

    const isValidPassword = await comparePassword(
      currentPassword,
      user.MatKhau
    );
    if (!isValidPassword) {
      throw new Error("Mật khẩu hiện tại không đúng");
    }

    const hashedNewPassword = await hashPassword(newPassword);

    await user.update({
      MatKhau: hashedNewPassword,
      NgayCapNhat: new Date(),
      NguoiCapNhat: user.TenDangNhap,
    });

    return { message: "Đổi mật khẩu thành công" };
  }

  async getUserProfile(userId) {
    const user = await NhanVien.findByPk(userId, {
      attributes: { exclude: ["MatKhau"] },
    });

    if (!user) {
      throw new Error("Người dùng không tồn tại");
    }

    return user;
  }

  // Forgot Password functionality for Students only
  async forgotPassword(email) {
    try {
      // Find student by email
      const sinhVien = await SinhVien.findOne({
        where: {
          Email: email,
          EmailDaXacThuc: true, // Only for verified accounts
        },
      });

      if (!sinhVien) {
        throw new Error("Email không tồn tại hoặc chưa được xác thực");
      }

      // Generate reset token
      const resetToken = crypto.randomBytes(32).toString("hex");

      // Update student with reset token
      await sinhVien.update({
        MaXacThucEmail: `reset_${resetToken}`, // Prefix to distinguish from verification
        NgayCapNhat: new Date(),
        NguoiCapNhat: "SYSTEM",
      });

      // Send reset password email
      await emailService.sendPasswordResetEmail(
        email,
        sinhVien.HoTen,
        resetToken
      );

      return {
        success: true,
        message:
          "Email reset mật khẩu đã được gửi. Vui lòng kiểm tra hộp thư của bạn.",
      };
    } catch (error) {
      console.error("Lỗi gửi email reset password:", error);
      throw new Error(
        error.message || "Có lỗi xảy ra khi gửi email reset password"
      );
    }
  }

  async resetPassword(email, token, newPassword) {
    try {
      // Find student with reset token
      const sinhVien = await SinhVien.findOne({
        where: {
          Email: email,
          MaXacThucEmail: `reset_${token}`,
          EmailDaXacThuc: true,
        },
      });

      if (!sinhVien) {
        throw new Error("Mã reset không hợp lệ hoặc đã hết hạn");
      }

      // Hash new password
      const hashedPassword = await hashPassword(newPassword);

      // Update password and clear reset token
      await sinhVien.update({
        MatKhau: hashedPassword,
        MaXacThucEmail: null, // Clear reset token
        NgayCapNhat: new Date(),
        NguoiCapNhat: "SYSTEM",
      });

      // Send confirmation email
      await emailService.sendPasswordResetConfirmation(email, sinhVien.HoTen);

      return {
        success: true,
        message:
          "Mật khẩu đã được reset thành công. Bạn có thể đăng nhập với mật khẩu mới.",
      };
    } catch (error) {
      console.error("Lỗi reset password:", error);
      throw new Error(error.message || "Có lỗi xảy ra khi reset password");
    }
  }
}

module.exports = new AuthService();
