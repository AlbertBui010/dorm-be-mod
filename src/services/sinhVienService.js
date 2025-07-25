const { SinhVien, sequelize } = require("../models");
const { hashPassword } = require("../utils/auth");
const { Op } = require("sequelize");
const { STUDENT_STATUS } = require("../constants/sinhvien");
const LichSuOPhong = require("../models/LichSuOPhong");
const { STUDENT_ROOM_HISTORY } = require("../constants/LichSuOPhong");

class SinhVienService {
  async getAllSinhVien(filters = {}, pagination = {}) {
    const { page = 1, limit = 10 } = pagination;
    const offset = (page - 1) * limit;

    const whereClause = {};
    const include = [];

    if (filters.search) {
      whereClause[Op.or] = [
        { MaSinhVien: { [Op.iLike]: `%${filters.search}%` } },
        { HoTen: { [Op.iLike]: `%${filters.search}%` } },
        { Email: { [Op.iLike]: `%${filters.search}%` } },
      ];
    }

    if (filters.gioiTinh) {
      whereClause.GioiTinh = filters.gioiTinh;
    }

    if (filters.trangThai) {
      whereClause.TrangThai = filters.trangThai;
    }

    // Nếu có filter maPhong thì join với Giuong và Phong
    if (filters.maPhong) {
      include.push({
        association: "Giuong",
        required: true,
        include: [
          {
            association: "Phong",
            required: true,
            where: { MaPhong: filters.maPhong },
            attributes: ["MaPhong", "SoPhong"],
          },
        ],
        attributes: ["MaGiuong", "MaPhong"],
      });
    } else {
      // Nếu không filter thì vẫn trả về thông tin giường/phòng nếu có
      include.push({
        association: "Giuong",
        required: false,
        include: [
          {
            association: "Phong",
            required: false,
            attributes: ["MaPhong", "SoPhong"],
          },
        ],
        attributes: ["MaGiuong", "MaPhong"],
      });
    }

    const { rows: sinhViens, count: total } = await SinhVien.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [["NgayTao", "DESC"]],
      attributes: { exclude: ["MatKhau", "MaXacThucEmail"] },
      include,
      distinct: true,
    });

    return {
      sinhViens,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getSinhVienById(maSinhVien) {
    const sinhVien = await SinhVien.findByPk(maSinhVien, {
      attributes: { exclude: ["MatKhau", "MaXacThucEmail"] },
      include: [
        { association: "Giuong" },
        { association: "dangKys" },
        { association: "LichSuOPhongs" },
      ],
    });

    if (!sinhVien) {
      throw new Error("Sinh viên không tồn tại");
    }

    return sinhVien;
  }

  async getSinhVienWithoutBed(filters = {}) {
    const { gioiTinhPhong } = filters;

    const whereClause = {};

    // Lọc theo giới tính phù hợp với phòng
    if (gioiTinhPhong && gioiTinhPhong !== "Hỗn hợp") {
      whereClause.GioiTinh = gioiTinhPhong;
    }

    const sinhViens = await SinhVien.findAll({
      where: {
        ...whereClause,
        MaSinhVien: {
          [Op.notIn]: sequelize.literal(`(
            SELECT DISTINCT "MaSinhVienChiEm"
            FROM "Giuong"
            WHERE "MaSinhVienChiEm" IS NOT NULL
          )`),
        },
      },
      attributes: ["MaSinhVien", "HoTen", "GioiTinh", "Email", "SoDienThoai"],
      order: [["HoTen", "ASC"]],
      limit: 100,
    });

    return sinhViens;
  }

  async createSinhVien(sinhVienData, createdBy) {
    // Validate required fields
    if (!sinhVienData.MaSinhVien || !sinhVienData.HoTen) {
      throw new Error("MaSinhVien và HoTen là bắt buộc");
    }

    // Check if student already exists
    const existingSinhVien = await SinhVien.findOne({
      where: {
        [Op.or]: [
          { MaSinhVien: sinhVienData.MaSinhVien },
          ...(sinhVienData.Email ? [{ Email: sinhVienData.Email }] : []),
        ],
      },
    });

    if (existingSinhVien) {
      if (existingSinhVien.MaSinhVien === sinhVienData.MaSinhVien) {
        throw new Error("Mã sinh viên đã tồn tại");
      }
      if (existingSinhVien.Email === sinhVienData.Email) {
        throw new Error("Email đã tồn tại");
      }
    }

    // Hash password if provided
    if (sinhVienData.MatKhau) {
      sinhVienData.MatKhau = await hashPassword(sinhVienData.MatKhau);
    }

    // Set EmailDaXacThuc based on admin decision
    const emailDaXacThuc = sinhVienData.EmailDaXacThuc || false;

    const sinhVien = await SinhVien.create({
      ...sinhVienData,
      EmailDaXacThuc: emailDaXacThuc,
      NgayTao: new Date(),
      NguoiTao: createdBy,
    });

    return await this.getSinhVienById(sinhVien.MaSinhVien);
  }

  async updateSinhVien(maSinhVien, updateData, updatedBy) {
    const sinhVien = await SinhVien.findByPk(maSinhVien);

    if (!sinhVien) {
      throw new Error("Sinh viên không tồn tại");
    }

    // Prevent updating MaSinhVien
    if (updateData.MaSinhVien && updateData.MaSinhVien !== maSinhVien) {
      throw new Error("Không được phép thay đổi mã sinh viên");
    }

    // Check for duplicate email if email is being changed
    if (updateData.Email && updateData.Email !== sinhVien.Email) {
      const existingEmail = await SinhVien.findOne({
        where: {
          Email: updateData.Email,
          MaSinhVien: { [Op.ne]: maSinhVien },
        },
      });

      if (existingEmail) {
        throw new Error("Email đã tồn tại");
      }
    }

    // Hash password if being changed
    if (updateData.MatKhau) {
      updateData.MatKhau = await hashPassword(updateData.MatKhau);
    }

    // Remove MaSinhVien from updateData to prevent accidental update
    const { MaSinhVien: _, ...updateDataWithoutId } = updateData;

    await sinhVien.update({
      ...updateDataWithoutId,
      NgayCapNhat: new Date(),
      NguoiCapNhat: updatedBy,
    });

    return await this.getSinhVienById(maSinhVien);
  }

  async deleteSinhVien(maSinhVien) {
    const sinhVien = await SinhVien.findByPk(maSinhVien);

    if (!sinhVien) {
      throw new Error("Sinh viên không tồn tại");
    }

    // Check all related records before deletion
    const relatedData = await this.checkRelatedRecords(maSinhVien);

    if (relatedData.hasRelatedRecords) {
      throw new Error(
        `Không thể xóa sinh viên do còn có dữ liệu liên quan: ${relatedData.relatedTables.join(
          ", ",
        )}`,
      );
    }

    await sinhVien.destroy();
    return { message: "Xóa sinh viên thành công" };
  }

  async checkRelatedRecords(maSinhVien) {
    const {
      Giuong,
      DangKy,
      LichSuOPhong,
      ChiTietDienNuoc,
      ThanhToan,
      YeuCauChuyenPhong,
    } = require("../models");

    const relatedTables = [];
    let hasRelatedRecords = false;

    // Check Giuong (bed assignment)
    const giuong = await Giuong.findOne({
      where: { MaSinhVienChiEm: maSinhVien },
    });
    if (giuong) {
      relatedTables.push("Giường");
      hasRelatedRecords = true;
    }

    // Check DangKy (registrations)
    const dangKy = await DangKy.findOne({
      where: { MaSinhVien: maSinhVien },
    });
    if (dangKy) {
      relatedTables.push("Đăng ký");
      hasRelatedRecords = true;
    }

    // Check LichSuOPhong (room history)
    const lichSuOPhong = await LichSuOPhong.findOne({
      where: { MaSinhVien: maSinhVien },
    });
    if (lichSuOPhong) {
      relatedTables.push("Lịch sử ở phòng");
      hasRelatedRecords = true;
    }

    // Check ChiTietDienNuoc (utility bills)
    const chiTietDienNuoc = await ChiTietDienNuoc.findOne({
      where: { MaSinhVien: maSinhVien },
    });
    if (chiTietDienNuoc) {
      relatedTables.push("Chi tiết điện nước");
      hasRelatedRecords = true;
    }

    // Check ThanhToan (payments)
    const thanhToan = await ThanhToan.findOne({
      where: { MaSinhVien: maSinhVien },
    });
    if (thanhToan) {
      relatedTables.push("Thanh toán");
      hasRelatedRecords = true;
    }

    // Check YeuCauChuyenPhong (room transfer requests)
    const yeuCauChuyenPhong = await YeuCauChuyenPhong.findOne({
      where: { MaSinhVien: maSinhVien },
    });
    if (yeuCauChuyenPhong) {
      relatedTables.push("Yêu cầu chuyển phòng");
      hasRelatedRecords = true;
    }

    return {
      hasRelatedRecords,
      relatedTables,
    };
  }

  async toggleStudentStatus(maSinhVien, updatedBy) {
    const sinhVien = await SinhVien.findByPk(maSinhVien);

    if (!sinhVien) {
      throw new Error("Sinh viên không tồn tại");
    }

    // Toggle status (assuming we add a TrangThai field)
    const newStatus =
      sinhVien.TrangThai === STUDENT_STATUS.DANG_O
        ? STUDENT_STATUS.NGUNG_O
        : STUDENT_STATUS.DANG_O;

    await sinhVien.update({
      TrangThai: newStatus,
      NgayCapNhat: new Date(),
      NguoiCapNhat: updatedBy,
    });

    return await this.getSinhVienById(maSinhVien);
  }

  async getStudentStats() {
    const totalStudents = await SinhVien.count();

    const activeStudents = await SinhVien.count({
      where: { TrangThai: STUDENT_STATUS.DANG_O },
    });

    const inactiveStudents = await SinhVien.count({
      where: { TrangThai: STUDENT_STATUS.NGUNG_O },
    });

    const verifiedEmails = await SinhVien.count({
      where: { EmailDaXacThuc: true },
    });

    return {
      total: totalStudents,
      active: activeStudents,
      inactive: inactiveStudents,
      verified: verifiedEmails,
    };
  }

  async studentCheckIn(maSinhVien, updatedBy) {
    const sinhvien = await SinhVien.findByPk(maSinhVien);

    if (!sinhvien) {
      throw new Error("Sinh viên không tồn tại");
    }
    if (sinhvien.TrangThai === STUDENT_STATUS.DANG_O) {
      throw new Error("Sinh viên đã đang ở trong ký túc xá");
    }
    if (sinhvien.TrangThai !== STUDENT_STATUS.CHO_NHAN_PHONG) {
      throw new Error("Sinh viên không đủ điều kiện để nhận phòng");
    }
    await sinhvien.update({
      TrangThai: STUDENT_STATUS.DANG_O,
      NgayCapNhat: new Date(),
      NguoiCapNhat: updatedBy,
    });

    return await this.getSinhVienById(maSinhVien);
  }
  async studentCheckOut(maSinhVien, updatedBy) {
    const sinhVien = await SinhVien.findByPk(maSinhVien);
    if (!sinhVien) {
      throw new Error("Sinh viên không tồn tại");
    }

    // Check if student is already checked out
    if (sinhVien.TrangThai !== STUDENT_STATUS.DANG_O) {
      throw new Error("Sinh viên không đang ở trong ký túc xá");
    }

    // Update status to NGUNG_O
    await sinhVien.update({
      TrangThai: STUDENT_STATUS.NGUNG_O,
      NgayCapNhat: new Date(),
      NguoiCapNhat: updatedBy,
    });

    return await this.getSinhVienById(maSinhVien);
  }
}

module.exports = new SinhVienService();
