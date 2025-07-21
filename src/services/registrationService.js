const { SinhVien, DangKy, sequelize } = require("../models");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const { sendEmail } = require("../utils/email");
const {
  calculateEndDate,
  validateReceiveDate,
  getEndDateCalculationInfo,
} = require("../utils/dateCalculator");
const { Op } = require("sequelize");

class RegistrationService {
  /**
   * Đăng ký ở ký túc xá - Bước 1: Tạo đăng ký và gửi email xác thực
   */
  async createRegistration(registrationData) {
    const transaction = await sequelize.transaction();

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
      } = registrationData;

      // 1. Kiểm tra trùng lặp email
      const existingSinhVienByEmail = await SinhVien.findOne({
        where: { Email: email },
        transaction,
      });

      if (existingSinhVienByEmail) {
        await transaction.rollback();
        return {
          success: false,
          message:
            "Email đã được sử dụng. Nếu bạn đã có tài khoản, vui lòng đăng nhập.",
          shouldLogin: true,
          existingStudent: {
            maSinhVien: existingSinhVienByEmail.MaSinhVien,
            hoTen: existingSinhVienByEmail.HoTen,
            emailDaXacThuc: existingSinhVienByEmail.EmailDaXacThuc,
          },
        };
      }

      // 2. Kiểm tra trùng lặp mã sinh viên (nếu có)
      if (maSinhVien) {
        const existingSinhVienByMaSV = await SinhVien.findOne({
          where: { MaSinhVien: maSinhVien },
          transaction,
        });

        if (existingSinhVienByMaSV) {
          await transaction.rollback();
          return {
            success: false,
            message:
              "Mã sinh viên đã tồn tại. Vui lòng kiểm tra lại hoặc đăng nhập nếu đây là tài khoản của bạn.",
            shouldLogin: true,
            existingStudent: {
              maSinhVien: existingSinhVienByMaSV.MaSinhVien,
              hoTen: existingSinhVienByMaSV.HoTen,
              email: existingSinhVienByMaSV.Email,
            },
          };
        }
      }

      // 3. Tạo mã xác thực email
      const maXacThucEmail = crypto.randomBytes(32).toString("hex");

      // 4. Tạo mã sinh viên tự động nếu không có
      let finalMaSinhVien = maSinhVien;
      if (!finalMaSinhVien) {
        finalMaSinhVien = await this.generateMaSinhVien(transaction);
      }

      // 5. Tạo bản ghi SinhVien
      const newSinhVien = await SinhVien.create(
        {
          MaSinhVien: finalMaSinhVien,
          HoTen: hoTen,
          NgaySinh: ngaySinh,
          GioiTinh: gioiTinh,
          SoDienThoai: soDienThoai,
          Email: email,
          EmailDaXacThuc: false,
          MaXacThucEmail: maXacThucEmail,
          TrangThai: "DANG_KY",
          NgayTao: new Date(),
          NguoiTao: "SYSTEM",
        },
        { transaction }
      );

      // 6. Kiểm tra và tính toán ngày kết thúc hợp đồng
      let ngayKetThucHopDong = null;
      if (ngayNhanPhong) {
        // Validate ngày nhận phòng
        const validation = validateReceiveDate(
          new Date(ngayNhanPhong),
          new Date()
        );
        if (!validation.isValid) {
          await transaction.rollback();
          return {
            success: false,
            message: validation.message,
          };
        }

        // Tính toán ngày kết thúc
        ngayKetThucHopDong = calculateEndDate(new Date(ngayNhanPhong));
      }

      // 7. Tạo bản ghi DangKy với thông tin mới
      const newDangKy = await DangKy.create(
        {
          MaSinhVien: finalMaSinhVien,
          NgayDangKy: new Date(),
          NgayNhanPhong: ngayNhanPhong ? new Date(ngayNhanPhong) : null,
          NgayKetThucHopDong: ngayKetThucHopDong,
          NguyenVong: nguyenVong || null,
          TrangThai: "CHO_DUYET",
          NgayTao: new Date(),
          NguoiTao: "SYSTEM",
        },
        { transaction }
      );

      // 8. Gửi email xác thực
      try {
        await this.sendVerificationEmail(email, hoTen, maXacThucEmail);
      } catch (emailError) {
        console.error("Lỗi gửi email:", emailError);
        // Không rollback transaction vì đăng ký đã thành công
        // Chỉ thông báo rằng email có thể gửi lại
      }

      await transaction.commit();

      return {
        success: true,
        message:
          "Đăng ký thành công! Vui lòng kiểm tra email để xác thực tài khoản.",
        data: {
          maSinhVien: finalMaSinhVien,
          maDangKy: newDangKy.MaDangKy,
          email: email,
          needEmailVerification: true,
        },
      };
    } catch (error) {
      await transaction.rollback();
      console.error("Lỗi tạo đăng ký:", error);
      throw new Error(`Có lỗi xảy ra khi tạo đăng ký: ${error.message}`);
    }
  }

  /**
   * Xác thực email thông qua mã xác thực
   */
  async verifyEmail(maXacThuc) {
    const transaction = await sequelize.transaction();

    try {
      // Tìm sinh viên theo mã xác thực
      const sinhVien = await SinhVien.findOne({
        where: {
          MaXacThucEmail: maXacThuc,
          EmailDaXacThuc: false,
        },
        transaction,
      });

      if (!sinhVien) {
        await transaction.rollback();
        return {
          success: false,
          message: "Mã xác thực không hợp lệ hoặc email đã được xác thực.",
        };
      }

      // Cập nhật trạng thái email đã xác thức
      await sinhVien.update(
        {
          EmailDaXacThuc: true,
          MaXacThucEmail: null, // Xóa mã xác thực sau khi sử dụng
          NgayCapNhat: new Date(),
          NguoiCapNhat: "SYSTEM",
        },
        { transaction }
      );

      await transaction.commit();

      return {
        success: true,
        message:
          "Xác thực email thành công! Bạn có thể thiết lập mật khẩu để hoàn tất đăng ký.",
        data: {
          maSinhVien: sinhVien.MaSinhVien,
          hoTen: sinhVien.HoTen,
          email: sinhVien.Email,
          needPasswordSetup: true,
        },
      };
    } catch (error) {
      await transaction.rollback();
      console.error("Lỗi xác thực email:", error);
      throw new Error(`Có lỗi xảy ra khi xác thực email: ${error.message}`);
    }
  }

  /**
   * Thiết lập mật khẩu sau khi xác thực email
   */
  async setupPassword(maSinhVien, matKhau) {
    const transaction = await sequelize.transaction();

    try {
      // Kiểm tra sinh viên tồn tại và email đã xác thực
      const sinhVien = await SinhVien.findOne({
        where: {
          MaSinhVien: maSinhVien,
          EmailDaXacThuc: true,
          MatKhau: null, // Chưa thiết lập mật khẩu
        },
        transaction,
      });

      if (!sinhVien) {
        await transaction.rollback();
        return {
          success: false,
          message:
            "Không tìm thấy sinh viên hoặc email chưa được xác thực, hoặc mật khẩu đã được thiết lập.",
        };
      }

      // Băm mật khẩu
      const hashedPassword = await bcrypt.hash(matKhau, 12);

      // Cập nhật mật khẩu
      await sinhVien.update(
        {
          MatKhau: hashedPassword,
          NgayCapNhat: new Date(),
          NguoiCapNhat: "SYSTEM",
        },
        { transaction }
      );

      await transaction.commit();

      // Gửi email xác nhận hoàn tất (không rollback nếu lỗi email)
      try {
        const { sendPasswordSetupConfirmation } = require("../utils/email");
        await sendPasswordSetupConfirmation(
          sinhVien.Email,
          sinhVien.HoTen,
          sinhVien.MaSinhVien
        );
      } catch (emailError) {
        console.error("Lỗi gửi email xác nhận:", emailError);
        // Không ảnh hưởng đến kết quả thiết lập mật khẩu
      }

      return {
        success: true,
        message:
          "Thiết lập mật khẩu thành công! Bạn có thể đăng nhập vào hệ thống.",
        data: {
          maSinhVien: sinhVien.MaSinhVien,
          hoTen: sinhVien.HoTen,
          canLogin: true,
        },
      };
    } catch (error) {
      await transaction.rollback();
      console.error("Lỗi thiết lập mật khẩu:", error);
      throw new Error(`Có lỗi xảy ra khi thiết lập mật khẩu: ${error.message}`);
    }
  }

  /**
   * Gửi lại email xác thực
   */
  async resendVerificationEmail(email) {
    const transaction = await sequelize.transaction();

    try {
      const sinhVien = await SinhVien.findOne({
        where: {
          Email: email,
          EmailDaXacThuc: false,
        },
        transaction,
      });

      if (!sinhVien) {
        return {
          success: false,
          message:
            "Không tìm thấy tài khoản với email này hoặc email đã được xác thực.",
        };
      }

      // Tạo mã xác thực mới
      const maXacThucEmail = crypto.randomBytes(32).toString("hex");

      await sinhVien.update(
        {
          MaXacThucEmail: maXacThucEmail,
          NgayCapNhat: new Date(),
          NguoiCapNhat: "SYSTEM",
        },
        { transaction }
      );

      // Gửi email xác thực
      await this.sendVerificationEmail(email, sinhVien.HoTen, maXacThucEmail);

      await transaction.commit();

      return {
        success: true,
        message:
          "Email xác thực đã được gửi lại. Vui lòng kiểm tra hộp thư của bạn.",
      };
    } catch (error) {
      await transaction.rollback();
      console.error("Lỗi gửi lại email:", error);
      throw new Error(`Có lỗi xảy ra khi gửi lại email: ${error.message}`);
    }
  }

  /**
   * Kiểm tra trạng thái đăng ký của sinh viên
   */
  async getRegistrationStatus(maSinhVien) {
    try {
      const sinhVien = await SinhVien.findByPk(maSinhVien, {
        include: [
          {
            model: DangKy,
            as: "dangKy",
          },
        ],
      });

      if (!sinhVien) {
        return {
          success: false,
          message: "Không tìm thấy sinh viên.",
        };
      }

      return {
        success: true,
        data: {
          maSinhVien: sinhVien.MaSinhVien,
          hoTen: sinhVien.HoTen,
          email: sinhVien.Email,
          emailDaXacThuc: sinhVien.EmailDaXacThuc,
          matKhauDaThietLap: !!sinhVien.MatKhau,
          dangKy: sinhVien.dangKy || null,
        },
      };
    } catch (error) {
      console.error("Lỗi kiểm tra trạng thái:", error);
      throw new Error(
        `Có lỗi xảy ra khi kiểm tra trạng thái: ${error.message}`
      );
    }
  }

  /**
   * Gia hạn hợp đồng ở ký túc xá cho sinh viên
   */
  async renewContract(maSinhVien) {
    const transaction = await sequelize.transaction();
    try {
      // 1. Tìm hợp đồng hiện tại của sinh viên (đang ở, đã duyệt, gần nhất)
      const currentContract = await DangKy.findOne({
        where: {
          MaSinhVien: maSinhVien,
          TrangThai: "DA_DUYET",
        },
        order: [["NgayKetThucHopDong", "DESC"]],
        transaction,
      });
      if (!currentContract) {
        await transaction.rollback();
        return { success: false, message: "Không tìm thấy hợp đồng hiện tại." };
      }
      // 2. Kiểm tra hợp đồng sắp hết hạn (trong 7 ngày)
      const today = new Date();
      const endDate = new Date(currentContract.NgayKetThucHopDong);
      const diffDays = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));
      if (diffDays > 7) {
        await transaction.rollback();
        return { success: false, message: "Hợp đồng chưa đến hạn gia hạn." };
      }
      // 3. Tính ngày bắt đầu/kết thúc quý mới
      const newStartDate = new Date(currentContract.NgayKetThucHopDong);
      newStartDate.setDate(newStartDate.getDate() + 1);
      const newEndDate = calculateEndDate(newStartDate);
      // 4. Lấy thông tin phòng
      const maPhong = currentContract.MaPhong;
      if (!maPhong) {
        await transaction.rollback();
        return { success: false, message: "Không xác định được phòng ở." };
      }
      const Phong = require("../models/Phong");
      const room = await Phong.findByPk(maPhong, { transaction });
      if (!room) {
        await transaction.rollback();
        return { success: false, message: "Không tìm thấy thông tin phòng." };
      }
      // 5. Tính tiền phòng quý mới
      const registrationApprovalService = require("./registrationApprovalService");
      const fee = registrationApprovalService.prototype.calculateRoomFee(
        parseFloat(room.GiaThueThang),
        newStartDate,
        newEndDate
      );
      // 6. Tạo hóa đơn tiền phòng mới
      const ThanhToan = require("../models/ThanhToan");
      const thangNam = `${String(newStartDate.getMonth() + 1).padStart(
        2,
        "0"
      )}/${newStartDate.getFullYear()}`;
      await ThanhToan.create(
        {
          MaSinhVien: maSinhVien,
          MaPhong: maPhong,
          LoaiThanhToan: "TIEN_PHONG",
          HinhThuc: "CHUYEN_KHOAN",
          ThangNam: thangNam,
          SoTien: fee.soTien,
          TrangThai: "CHUA_THANH_TOAN",
          NgayTao: new Date(),
          NguoiTao: maSinhVien,
        },
        { transaction }
      );
      // 7. (Tùy chọn) Tạo bản ghi đăng ký mới hoặc cập nhật hợp đồng hiện tại
      // Ở đây: tạo bản ghi DangKy mới cho kỳ mới
      await DangKy.create(
        {
          MaSinhVien: maSinhVien,
          MaPhong: maPhong,
          NgayDangKy: new Date(),
          NgayNhanPhong: newStartDate,
          NgayKetThucHopDong: newEndDate,
          TrangThai: "CHO_DUYET",
          NgayTao: new Date(),
          NguoiTao: maSinhVien,
        },
        { transaction }
      );
      await transaction.commit();
      return {
        success: true,
        message:
          "Gia hạn hợp đồng thành công. Đã tạo hóa đơn tiền phòng cho kỳ mới.",
        data: {
          newStartDate,
          newEndDate,
          soTien: fee.soTien,
        },
      };
    } catch (error) {
      await transaction.rollback();
      console.error("Lỗi gia hạn hợp đồng:", error);
      return { success: false, message: "Có lỗi xảy ra khi gia hạn hợp đồng." };
    }
  }

  // Helper methods
  async generateMaSinhVien(transaction) {
    const currentYear = new Date().getFullYear();
    const prefix = currentYear.toString().substr(-2); // Lấy 2 số cuối của năm

    // Tìm mã sinh viên cao nhất trong năm
    const lastStudent = await SinhVien.findOne({
      where: {
        MaSinhVien: {
          [Op.like]: `${prefix}%`,
        },
      },
      order: [["MaSinhVien", "DESC"]],
      transaction,
    });

    if (lastStudent) {
      const lastNumber = parseInt(lastStudent.MaSinhVien.substr(2));
      const newNumber = (lastNumber + 1).toString().padStart(8, "0");
      return `${prefix}${newNumber}`;
    } else {
      return `${prefix}00000001`;
    }
  }

  async sendVerificationEmail(email, hoTen, maXacThuc) {
    const verificationLink = `${process.env.FRONTEND_URL}/verify-email?token=${maXacThuc}`;

    const emailContent = {
      to: email,
      subject: "Xác thực email đăng ký ký túc xá",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Xác thực email đăng ký ký túc xá</h2>
          <p>Xin chào <strong>${hoTen}</strong>,</p>
          <p>Cảm ơn bạn đã đăng ký ở ký túc xá. Để hoàn tất quá trình đăng ký, vui lòng xác thực email của bạn.</p>
          <div style="margin: 20px 0;">
            <a href="${verificationLink}" 
               style="background-color: #2563eb; color: white; padding: 12px 24px; 
                      text-decoration: none; border-radius: 4px; display: inline-block;">
              Xác thực Email
            </a>
          </div>
          <p>Hoặc bạn có thể copy link sau vào trình duyệt:</p>
          <p style="background-color: #f3f4f6; padding: 10px; border-radius: 4px; word-break: break-all;">
            ${verificationLink}
          </p>
          <p><strong>Mã xác thực:</strong> ${maXacThuc}</p>
          <p style="color: #666;">Link này sẽ hết hạn sau 24 giờ.</p>
          <hr style="margin: 20px 0;">
          <p style="color: #666; font-size: 12px;">
            Nếu bạn không thực hiện đăng ký này, vui lòng bỏ qua email này.
          </p>
        </div>
      `,
    };

    return await sendEmail(emailContent);
  }
}

module.exports = new RegistrationService();
