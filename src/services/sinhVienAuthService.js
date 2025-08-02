const { SinhVien } = require("../models");
const { throwValidationError } = require("../utils/response");

const {
  hashPassword,
  comparePassword,
  generateToken,
} = require("../utils/auth");
const { Op } = require("sequelize");
const { REGISTRATION_STATUS } = require("../constants/dangky");
const crypto = require("crypto");
const { sendEmail } = require("../utils/email");

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

    // Kiểm tra mật khẩu mới không được trùng với mật khẩu cũ
    const isSamePassword = await comparePassword(
      newPassword,
      sinhVien.MatKhau
    );
    if (isSamePassword) {
      throw new Error("Mật khẩu mới không được trùng với mật khẩu cũ");
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
            TrangThai: {
              [Op.in]: [
                REGISTRATION_STATUS.CHO_DUYET,
                REGISTRATION_STATUS.DA_DUYET,
              ],
            },
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

  /**
   * Gửi email khôi phục mật khẩu
   */
  async sendPasswordResetEmail(email) {
    const sinhVien = await SinhVien.findOne({
      where: {
        Email: email,
        EmailDaXacThuc: true,
      },
    });

    if (!sinhVien) {
      throw new Error("Email không tồn tại hoặc chưa được xác thực");
    }

    // Tạo mã reset mật khẩu
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExpiry = new Date(Date.now() + 30 * 60 * 1000); // 30 phút

    // Lưu token vào database
    await sinhVien.update({
      MaResetMatKhau: resetToken,
      NgayHetHanResetMatKhau: resetTokenExpiry,
      NgayCapNhat: new Date(),
      NguoiCapNhat: "SYSTEM",
    });

    // Gửi email
    const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

    const emailContent = {
      to: email,
      subject: "Khôi phục mật khẩu - Ký túc xá STU",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Khôi phục mật khẩu</h2>
          <p>Xin chào <strong>${sinhVien.HoTen}</strong>,</p>
          <p>Chúng tôi nhận được yêu cầu khôi phục mật khẩu cho tài khoản của bạn.</p>
          <p>Vui lòng nhấp vào nút bên dưới để đặt lại mật khẩu:</p>
          <div style="margin: 20px 0;">
            <a href="${resetLink}" 
               style="background-color: #2563eb; color: white; padding: 12px 24px; 
                      text-decoration: none; border-radius: 4px; display: inline-block;">
              Đặt lại mật khẩu
            </a>
          </div>
          <p>Hoặc copy link sau vào trình duyệt:</p>
          <p style="background-color: #f3f4f6; padding: 10px; border-radius: 4px; word-break: break-all;">
            ${resetLink}
          </p>
          <p><strong>Mã khôi phục:</strong> ${resetToken}</p>
          <p style="color: #666;">Link này sẽ hết hạn sau 30 phút.</p>
          <hr style="margin: 20px 0;">
          <p style="color: #666; font-size: 12px;">
            Nếu bạn không yêu cầu khôi phục mật khẩu, vui lòng bỏ qua email này.
          </p>
        </div>
      `,
    };

    await sendEmail(emailContent);

    return {
      message: "Email khôi phục mật khẩu đã được gửi. Vui lòng kiểm tra hộp thư của bạn.",
    };
  }

  /**
   * Xác thực token reset mật khẩu
   */
  async verifyResetToken(token) {
    const sinhVien = await SinhVien.findOne({
      where: {
        MaResetMatKhau: token,
        NgayHetHanResetMatKhau: {
          [Op.gt]: new Date(),
        },
      },
    });

    if (!sinhVien) {
      throw new Error("Mã khôi phục không hợp lệ hoặc đã hết hạn");
    }

    return {
      maSinhVien: sinhVien.MaSinhVien,
      email: sinhVien.Email,
      hoTen: sinhVien.HoTen,
    };
  }

  /**
   * Reset mật khẩu
   */
  async resetPassword(token, newPassword) {
    const sinhVien = await SinhVien.findOne({
      where: {
        MaResetMatKhau: token,
        NgayHetHanResetMatKhau: {
          [Op.gt]: new Date(),
        },
      },
    });

    if (!sinhVien) {
      throw new Error("Mã khôi phục không hợp lệ hoặc đã hết hạn");
    }

    // Kiểm tra mật khẩu mới không được trùng với mật khẩu cũ
    if (sinhVien.MatKhau) {
      const isSamePassword = await comparePassword(
        newPassword,
        sinhVien.MatKhau
      );
      if (isSamePassword) {
        throwValidationError("newPassword", "Mật khẩu mới không được trùng với mật khẩu cũ", newPassword);
      }
    }

    const hashedPassword = await hashPassword(newPassword);

    await sinhVien.update({
      MatKhau: hashedPassword,
      MaResetMatKhau: null,
      NgayHetHanResetMatKhau: null,
      NgayCapNhat: new Date(),
      NguoiCapNhat: sinhVien.MaSinhVien,
    });

    return {
      message: "Đặt lại mật khẩu thành công",
    };
  }
}

module.exports = new SinhVienAuthService();
