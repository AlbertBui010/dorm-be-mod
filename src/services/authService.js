const { NhanVien } = require("../models");
const {
  hashPassword,
  comparePassword,
  generateToken,
} = require("../utils/auth");
const { Op } = require("sequelize");

class AuthService {
  async login(credentials) {
    const { username, password } = credentials;

    // Find user by username or email
    const user = await NhanVien.findOne({
      where: {
        [Op.or]: [{ TenDangNhap: username }, { Email: username }],
        TrangThai: "HoatDong",
      },
    });

    if (!user) {
      throw new Error("Tên đăng nhập hoặc mật khẩu không đúng");
    }

    const isValidPassword = await comparePassword(password, user.MatKhau);
    if (!isValidPassword) {
      throw new Error("Tên đăng nhập hoặc mật khẩu không đúng");
    }

    const token = generateToken({
      MaNhanVien: user.MaNhanVien,
      TenDangNhap: user.TenDangNhap,
      VaiTro: user.VaiTro,
    });

    return {
      user: {
        MaNhanVien: user.MaNhanVien,
        TenDangNhap: user.TenDangNhap,
        HoTen: user.HoTen,
        Email: user.Email,
        VaiTro: user.VaiTro,
      },
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
