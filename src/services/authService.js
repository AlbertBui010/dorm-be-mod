const { NhanVien } = require("../models");
const {
  hashPassword,
  comparePassword,
  generateToken,
} = require("../utils/auth");
const SinhVienAuthService = require("./sinhVienAuthService");
const { Op } = require("sequelize");
const { NHAN_VIEN_TRANG_THAI } = require("../constants/nhanVien");

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
}

module.exports = new AuthService();
