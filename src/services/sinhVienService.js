const { SinhVien, sequelize } = require("../models");
const { hashPassword } = require("../utils/auth");
const { Op } = require("sequelize");

class SinhVienService {
  async getAllSinhVien(filters = {}, pagination = {}) {
    const { page = 1, limit = 10 } = pagination;
    const offset = (page - 1) * limit;

    const whereClause = {};

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

    const { rows: sinhViens, count: total } = await SinhVien.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [["NgayTao", "DESC"]],
      attributes: { exclude: ["MatKhau", "MaXacThucEmail"] },
    });

    return {
      sinhViens,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
      },
    };
  }

  async getSinhVienById(maSinhVien) {
    const sinhVien = await SinhVien.findByPk(maSinhVien, {
      attributes: { exclude: ["MatKhau", "MaXacThucEmail"] },
      include: [
        { association: "Giuong" },
        { association: "DangKys" },
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
    // Check if student already exists
    const existingSinhVien = await SinhVien.findOne({
      where: {
        [Op.or]: [
          { MaSinhVien: sinhVienData.MaSinhVien },
          { Email: sinhVienData.Email },
        ],
      },
    });

    if (existingSinhVien) {
      throw new Error("Sinh viên hoặc email đã tồn tại");
    }

    // Hash password if provided
    if (sinhVienData.MatKhau) {
      sinhVienData.MatKhau = await hashPassword(sinhVienData.MatKhau);
    }

    const sinhVien = await SinhVien.create({
      ...sinhVienData,
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

    // Check for duplicate email
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

    // Hash password if provided
    if (updateData.MatKhau) {
      updateData.MatKhau = await hashPassword(updateData.MatKhau);
    }

    await sinhVien.update({
      ...updateData,
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

    // Check if student has any registrations or is assigned to a bed
    const hasActiveRegistrations = await sinhVien.countDangKys();
    const hasAssignedBed = await sinhVien.getGiuong();

    if (hasActiveRegistrations > 0 || hasAssignedBed) {
      throw new Error(
        "Không thể xóa sinh viên đang có đăng ký hoặc được phân giường"
      );
    }

    await sinhVien.destroy();
    return { message: "Xóa sinh viên thành công" };
  }
}

module.exports = new SinhVienService();
