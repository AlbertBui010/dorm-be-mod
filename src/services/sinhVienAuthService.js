const { SinhVien } = require("../models");
const {
  hashPassword,
  comparePassword,
  generateToken,
} = require("../utils/auth");
const { Op } = require("sequelize");

class SinhVienAuthService {
  async login(credentials) {
    const { email, password } = credentials;

    // Find student by email
    const sinhVien = await SinhVien.findOne({
      where: {
        Email: email,
        EmailDaXacThuc: true, // Must be verified
      },
    });

    if (!sinhVien) {
      throw new Error("Email không tồn tại hoặc chưa được xác thực");
    }

    if (!sinhVien.MatKhau) {
      throw new Error("Tài khoản chưa được thiết lập mật khẩu");
    }

    const isValidPassword = await comparePassword(password, sinhVien.MatKhau);
    if (!isValidPassword) {
      throw new Error("Email hoặc mật khẩu không đúng");
    }

    const token = generateToken({
      MaSinhVien: sinhVien.MaSinhVien,
      Email: sinhVien.Email,
      VaiTro: "SinhVien",
      type: "student",
    });

    return {
      user: {
        MaSinhVien: sinhVien.MaSinhVien,
        HoTen: sinhVien.HoTen,
        Email: sinhVien.Email,
        VaiTro: "SinhVien",
      },
      token,
    };
  }

  async changePassword(maSinhVien, currentPassword, newPassword) {
    const sinhVien = await SinhVien.findByPk(maSinhVien);

    if (!sinhVien) {
      throw new Error("Sinh viên không tồn tại");
    }

    if (!sinhVien.MatKhau) {
      throw new Error("Tài khoản chưa có mật khẩu");
    }

    const isValidPassword = await comparePassword(
      currentPassword,
      sinhVien.MatKhau
    );
    if (!isValidPassword) {
      throw new Error("Mật khẩu hiện tại không đúng");
    }

    const hashedNewPassword = await hashPassword(newPassword);

    await sinhVien.update({
      MatKhau: hashedNewPassword,
      NgayCapNhat: new Date(),
      NguoiCapNhat: sinhVien.MaSinhVien,
    });

    return { message: "Đổi mật khẩu thành công" };
  }

  async setPassword(maSinhVien, newPassword, updatedBy = null) {
    const sinhVien = await SinhVien.findByPk(maSinhVien);

    if (!sinhVien) {
      throw new Error("Sinh viên không tồn tại");
    }

    const hashedPassword = await hashPassword(newPassword);

    await sinhVien.update({
      MatKhau: hashedPassword,
      NgayCapNhat: new Date(),
      NguoiCapNhat: updatedBy || maSinhVien,
    });

    return { message: "Thiết lập mật khẩu thành công" };
  }

  async getProfile(maSinhVien) {
    const sinhVien = await SinhVien.findByPk(maSinhVien, {
      attributes: { exclude: ["MatKhau", "MaXacThucEmail"] },
      include: [
        {
          association: "Giuong",
          include: [{ association: "Phong" }],
        },
        {
          association: "dangKys",
          where: {
            TrangThai: { [Op.in]: ["CHO_DUYET", "DA_DUYET", "DANG_O"] },
          },
          required: false,
          include: [{ association: "Phong" }, { association: "Giuong" }],
          order: [["NgayTao", "DESC"]],
          limit: 1,
        },
      ],
    });

    if (!sinhVien) {
      throw new Error("Sinh viên không tồn tại");
    }

    return sinhVien;
  }
}

module.exports = new SinhVienAuthService();
