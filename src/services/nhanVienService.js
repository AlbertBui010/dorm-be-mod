const bcrypt = require("bcryptjs");
const { Op } = require("sequelize");
const NhanVien = require("../models/NhanVien");
const { AppError } = require("../middleware/error");
const { NHAN_VIEN_TRANG_THAI } = require("../constants/nhanVien");

class NhanVienService {
  async getAll(filters = {}) {
    const {
      page = 1,
      limit = 10,
      search = "",
      vaiTro = "",
      trangThai = "",
    } = filters;

    const offset = (page - 1) * limit;
    const whereClause = {};

    // Search filter
    if (search) {
      whereClause[Op.or] = [
        { HoTen: { [Op.iLike]: `%${search}%` } },
        { TenDangNhap: { [Op.iLike]: `%${search}%` } },
        { Email: { [Op.iLike]: `%${search}%` } },
      ];
    }

    // Role filter
    if (vaiTro) {
      whereClause.VaiTro = vaiTro;
    }

    // Status filter
    if (trangThai) {
      whereClause.TrangThai = trangThai;
    }

    const { count, rows } = await NhanVien.findAndCountAll({
      where: whereClause,
      attributes: { exclude: ["MatKhau"] },
      order: [["NgayTao", "DESC"]],
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    return {
      data: rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        totalPages: Math.ceil(count / limit),
      },
    };
  }

  async getById(id) {
    const nhanVien = await NhanVien.findByPk(id, {
      attributes: { exclude: ["MatKhau"] },
    });

    if (!nhanVien) {
      throw new AppError("Không tìm thấy nhân viên", 404);
    }

    return nhanVien;
  }

  async create(data, adminId) {
    const { TenDangNhap, Email, MatKhau, ...otherData } = data;

    // Check uniqueness
    const existingUser = await NhanVien.findOne({
      where: {
        [Op.or]: [{ TenDangNhap }, ...(Email ? [{ Email }] : [])],
      },
    });

    if (existingUser) {
      if (existingUser.TenDangNhap === TenDangNhap) {
        throw new AppError("Tên đăng nhập đã tồn tại", 400);
      }
      if (existingUser.Email === Email) {
        throw new AppError("Email đã tồn tại", 400);
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(MatKhau, 12);

    // Create employee
    const nhanVien = await NhanVien.create({
      TenDangNhap,
      Email,
      MatKhau: hashedPassword,
      ...otherData,
      TrangThai: NHAN_VIEN_TRANG_THAI.HOAT_DONG, // Mặc định là HOAT_DONG khi tạo mới.
      NguoiTao: adminId,
      NguoiCapNhat: adminId,
    });

    return { ...nhanVien.toJSON(), MatKhau: undefined };
  }

  async update(id, data, adminId) {
    const nhanVien = await NhanVien.findByPk(id);
    if (!nhanVien) {
      throw new AppError("Không tìm thấy nhân viên", 404);
    }

    const { TenDangNhap, Email, MatKhau, TrangThai, ...otherData } = data;

    // Check uniqueness if changing username or email
    if (TenDangNhap && TenDangNhap !== nhanVien.TenDangNhap) {
      const existing = await NhanVien.findOne({ where: { TenDangNhap } });
      if (existing) {
        throw new AppError("Tên đăng nhập đã tồn tại", 400);
      }
    }

    // Không thể tự cập nhật chính mình
    if (parseInt(id) === parseInt(adminId) && TrangThai) {
      throw new AppError("Không thể cập nhật trạng thái của chính mình", 400);
    }

    if (Email && Email !== nhanVien.Email) {
      const existing = await NhanVien.findOne({ where: { Email } });
      if (existing) {
        throw new AppError("Email đã tồn tại", 400);
      }
    }

    const updateData = {
      ...otherData,
      NguoiCapNhat: adminId,
    };

    if (TrangThai) updateData.TrangThai = TrangThai;
    if (TenDangNhap) updateData.TenDangNhap = TenDangNhap;
    if (Email) updateData.Email = Email;

    if (MatKhau) {
      updateData.MatKhau = await bcrypt.hash(MatKhau, 12);
    }

    await nhanVien.update(updateData);

    return { ...nhanVien.toJSON(), MatKhau: undefined };
  }

  async canDelete(id) {
    const nhanVien = await NhanVien.findByPk(id);
    if (!nhanVien) {
      throw new AppError("Không tìm thấy nhân viên", 404);
    }

    // Check if employee has created other employees
    const createdEmployees = await NhanVien.count({
      where: { NguoiTao: id },
    });

    // Check if employee has updated records
    const updatedEmployees = await NhanVien.count({
      where: { NguoiCapNhat: id },
    });

    const canDelete = createdEmployees === 0 && updatedEmployees === 0;

    return {
      canDelete,
      reason: canDelete
        ? null
        : "Nhân viên này có liên quan đến dữ liệu khác trong hệ thống",
      relatedData: {
        createdEmployees,
        updatedEmployees,
      },
    };
  }

  async delete(id, adminId) {
    const nhanVien = await NhanVien.findByPk(id);
    if (!nhanVien) {
      throw new AppError("Không tìm thấy nhân viên", 404);
    }

    // Cannot delete own account
    if (parseInt(id) === parseInt(adminId)) {
      throw new AppError("Không thể xóa tài khoản của chính mình", 400);
    }

    // Check if can delete
    const deleteCheck = await this.canDelete(id);
    if (!deleteCheck.canDelete) {
      throw new AppError(deleteCheck.reason, 400);
    }

    await nhanVien.destroy();

    return true;
  }

  async getStats() {
    const total = await NhanVien.count();
    const active = await NhanVien.count({
      where: { TrangThai: NHAN_VIEN_TRANG_THAI.HOAT_DONG },
    });
    const locked = await NhanVien.count({
      where: { TrangThai: NHAN_VIEN_TRANG_THAI.KHOA },
    });

    const roleStats = await NhanVien.findAll({
      attributes: [
        "VaiTro",
        [
          NhanVien.sequelize.fn("COUNT", NhanVien.sequelize.col("VaiTro")),
          "count",
        ],
      ],
      group: ["VaiTro"],
      raw: true,
    });

    return {
      total,
      active,
      locked,
      roles: roleStats,
    };
  }

  async getRoles() {
    return [
      { value: "QuanTriVien", label: "Quản trị viên" },
      { value: "NhanVien", label: "Nhân viên" },
    ];
  }
}

module.exports = new NhanVienService();
