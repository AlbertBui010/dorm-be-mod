const bcrypt = require("bcryptjs");
const { Op } = require("sequelize");
const NhanVien = require("../models/NhanVien");
const { AppError } = require("../middleware/error");
const { NHAN_VIEN_TRANG_THAI } = require("../constants/nhanVien");

// Hằng số cấu hình
const BCRYPT_SALT_ROUNDS = 12;
const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;

// Thông báo lỗi
const ERROR_MESSAGES = {
  EMPLOYEE_NOT_FOUND: "Không tìm thấy nhân viên",
  USERNAME_EXISTS: "Tên đăng nhập đã tồn tại",
  EMAIL_EXISTS: "Email đã tồn tại",
  PHONE_EXISTS: "Số điện thoại đã tồn tại",
  CANNOT_UPDATE_SELF_STATUS: "Không thể cập nhật trạng thái của chính mình",
  CANNOT_DELETE_SELF: "Không thể xóa tài khoản của chính mình",
  EMPLOYEE_HAS_RELATED_DATA:
    "Nhân viên này có liên quan đến dữ liệu khác trong hệ thống",
};

// Ánh xạ trường dữ liệu với thông báo lỗi
const UNIQUE_FIELDS = {
  TenDangNhap: "USERNAME_EXISTS",
  Email: "EMAIL_EXISTS",
  SoDienThoai: "PHONE_EXISTS",
};

class NhanVienService {
  // Phương thức tiện ích
  // Chuyển đổi giá trị thành số nguyên an toàn
  _parseIntSafely(value, defaultValue = DEFAULT_PAGE) {
    const parsed = parseInt(value);
    return isNaN(parsed) ? defaultValue : parsed;
  }

  // Loại bỏ mật khẩu khỏi dữ liệu nhân viên trả về
  _sanitizeEmployee(nhanVien) {
    return { ...nhanVien.toJSON(), MatKhau: undefined };
  }

  // Xây dựng điều kiện tìm kiếm theo từ khóa
  _buildSearchQuery(search) {
    return {
      [Op.or]: [
        { HoTen: { [Op.iLike]: `%${search}%` } },
        { TenDangNhap: { [Op.iLike]: `%${search}%` } },
        { Email: { [Op.iLike]: `%${search}%` } },
      ],
    };
  }

  // Xây dựng điều kiện lọc dữ liệu
  _buildWhereClause(filters) {
    const { search, vaiTro, trangThai } = filters;
    const whereClause = {};

    if (search) {
      whereClause[Op.or] = this._buildSearchQuery(search);
    }

    if (vaiTro) {
      whereClause.VaiTro = vaiTro;
    }

    if (trangThai) {
      whereClause.TrangThai = trangThai;
    }

    return whereClause;
  }

  // Kiểm tra tính duy nhất của một trường dữ liệu
  async _checkFieldUniqueness(field, value, excludeId = null) {
    if (!value) return;

    const whereClause = { [field]: value };
    if (excludeId) {
      whereClause.MaNhanVien = { [Op.ne]: excludeId };
    }

    const existing = await NhanVien.findOne({ where: whereClause });
    if (existing) {
      const errorKey = UNIQUE_FIELDS[field];
      throw new AppError(ERROR_MESSAGES[errorKey], 400);
    }
  }

  // Validate tính duy nhất của tất cả các trường bắt buộc
  async _validateUniqueFields(data, excludeId = null) {
    const { TenDangNhap, Email, SoDienThoai } = data;

    await Promise.all([
      this._checkFieldUniqueness("TenDangNhap", TenDangNhap, excludeId),
      this._checkFieldUniqueness("Email", Email, excludeId),
      this._checkFieldUniqueness("SoDienThoai", SoDienThoai, excludeId),
    ]);
  }

  // Tìm nhân viên theo ID (phương thức tiện ích)
  async _findEmployeeById(id) {
    const nhanVien = await NhanVien.findByPk(id);
    if (!nhanVien) {
      throw new AppError(ERROR_MESSAGES.EMPLOYEE_NOT_FOUND, 404);
    }
    return nhanVien;
  }

  // Kiểm tra việc tự cập nhật trạng thái của chính mình
  _validateSelfUpdate(employeeId, adminId, hasStatusChange) {
    if (parseInt(employeeId) === parseInt(adminId) && hasStatusChange) {
      throw new AppError(ERROR_MESSAGES.CANNOT_UPDATE_SELF_STATUS, 400);
    }
  }

  // Kiểm tra việc tự xóa tài khoản của chính mình
  _validateSelfDelete(employeeId, adminId) {
    if (parseInt(employeeId) === parseInt(adminId)) {
      throw new AppError(ERROR_MESSAGES.CANNOT_DELETE_SELF, 400);
    }
  }

  // Phương thức chính
  // Lấy tất cả nhân viên với bộ lọc và phân trang
  async getAll(filters = {}) {
    const {
      page = DEFAULT_PAGE,
      limit = DEFAULT_LIMIT,
      ...filterOptions
    } = filters;

    const parsedPage = this._parseIntSafely(page, DEFAULT_PAGE);
    const parsedLimit = this._parseIntSafely(limit, DEFAULT_LIMIT);
    const offset = (parsedPage - 1) * parsedLimit;

    const whereClause = this._buildWhereClause(filterOptions);

    const { count, rows } = await NhanVien.findAndCountAll({
      where: whereClause,
      attributes: { exclude: ["MatKhau"] },
      order: [["NgayTao", "DESC"]],
      limit: parsedLimit,
      offset: offset,
    });

    return {
      data: rows,
      pagination: {
        page: parsedPage,
        limit: parsedLimit,
        total: count,
        totalPages: Math.ceil(count / parsedLimit),
      },
    };
  }

  // Lấy thông tin nhân viên theo ID
  async getById(id) {
    const nhanVien = await NhanVien.findByPk(id, {
      attributes: { exclude: ["MatKhau"] },
    });

    if (!nhanVien) {
      throw new AppError(ERROR_MESSAGES.EMPLOYEE_NOT_FOUND, 404);
    }

    return nhanVien;
  }

  // Tạo nhân viên mới
  async create(data, adminId) {
    const { MatKhau, ...otherData } = data;

    // Kiểm tra tính duy nhất của tất cả các trường
    await this._validateUniqueFields(data);

    // Mã hóa mật khẩu
    const hashedPassword = await bcrypt.hash(MatKhau, BCRYPT_SALT_ROUNDS);

    // Tạo nhân viên
    const nhanVien = await NhanVien.create({
      ...otherData,
      MatKhau: hashedPassword,
      TrangThai: NHAN_VIEN_TRANG_THAI.HOAT_DONG,
      NguoiTao: adminId,
      NguoiCapNhat: adminId,
    });

    return this._sanitizeEmployee(nhanVien);
  }

  // Cập nhật thông tin nhân viên
  async update(id, data, adminId) {
    const nhanVien = await this._findEmployeeById(id);

    const { MatKhau, TrangThai, ...otherData } = data;

    // Kiểm tra việc tự cập nhật trạng thái
    this._validateSelfUpdate(id, adminId, !!TrangThai);

    // Kiểm tra tính duy nhất chỉ cho các trường đã thay đổi
    const changedData = {};
    if (data.TenDangNhap && data.TenDangNhap !== nhanVien.TenDangNhap) {
      changedData.TenDangNhap = data.TenDangNhap;
    }
    if (data.Email && data.Email !== nhanVien.Email) {
      changedData.Email = data.Email;
    }
    if (data.SoDienThoai && data.SoDienThoai !== nhanVien.SoDienThoai) {
      changedData.SoDienThoai = data.SoDienThoai;
    }

    if (Object.keys(changedData).length > 0) {
      await this._validateUniqueFields(changedData, id);
    }

    // Xây dựng dữ liệu cập nhật
    const updateData = {
      ...otherData,
      NguoiCapNhat: adminId,
    };

    if (TrangThai) updateData.TrangThai = TrangThai;
    if (data.TenDangNhap) updateData.TenDangNhap = data.TenDangNhap;
    if (data.Email) updateData.Email = data.Email;
    if (data.SoDienThoai) updateData.SoDienThoai = data.SoDienThoai;

    if (MatKhau) {
      updateData.MatKhau = await bcrypt.hash(MatKhau, BCRYPT_SALT_ROUNDS);
    }

    await nhanVien.update(updateData);

    return this._sanitizeEmployee(nhanVien);
  }

  // Kiểm tra xem có thể xóa nhân viên hay không
  async canDelete(id) {
    const nhanVien = await this._findEmployeeById(id);

    // Kiểm tra xem nhân viên có tạo hoặc cập nhật bản ghi khác không
    const [createdEmployees, updatedEmployees] = await Promise.all([
      NhanVien.count({ where: { NguoiTao: id } }),
      NhanVien.count({ where: { NguoiCapNhat: id } }),
    ]);

    const canDelete = createdEmployees === 0 && updatedEmployees === 0;

    return {
      canDelete,
      reason: canDelete ? null : ERROR_MESSAGES.EMPLOYEE_HAS_RELATED_DATA,
      relatedData: {
        createdEmployees,
        updatedEmployees,
      },
    };
  }

  // Xóa nhân viên
  async delete(id, adminId) {
    const nhanVien = await this._findEmployeeById(id);

    // Kiểm tra việc tự xóa
    this._validateSelfDelete(id, adminId);

    // Kiểm tra xem có thể xóa không
    const deleteCheck = await this.canDelete(id);
    if (!deleteCheck.canDelete) {
      throw new AppError(deleteCheck.reason, 400);
    }

    await nhanVien.destroy();

    return true;
  }

  // Lấy thống kê nhân viên
  async getStats() {
    const [total, active, locked, roleStats] = await Promise.all([
      NhanVien.count(),
      NhanVien.count({ where: { TrangThai: NHAN_VIEN_TRANG_THAI.HOAT_DONG } }),
      NhanVien.count({ where: { TrangThai: NHAN_VIEN_TRANG_THAI.KHOA } }),
      NhanVien.findAll({
        attributes: [
          "VaiTro",
          [
            NhanVien.sequelize.fn("COUNT", NhanVien.sequelize.col("VaiTro")),
            "count",
          ],
        ],
        group: ["VaiTro"],
        raw: true,
      }),
    ]);

    return {
      total,
      active,
      locked,
      roles: roleStats,
    };
  }

  // Lấy danh sách vai trò
  async getRoles() {
    return [
      { value: "QuanTriVien", label: "Quản trị viên" },
      { value: "NhanVien", label: "Nhân viên" },
    ];
  }
}

module.exports = new NhanVienService();
