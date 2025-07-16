const { ChiSoDienNuoc, Phong } = require("../models");
const { Op } = require("sequelize");

class ChiSoDienNuocService {
  async create(data, user) {
    // Kiểm tra trùng MaPhong + ThangNam
    const exists = await ChiSoDienNuoc.findOne({
      where: {
        MaPhong: data.MaPhong,
        ThangNam: data.ThangNam,
      },
    });
    if (exists) throw new Error("Đã tồn tại chỉ số cho phòng/tháng này");
    // Tạo mới
    return await ChiSoDienNuoc.create({
      MaPhong: data.MaPhong,
      ThangNam: data.ThangNam,
      SoDienCu: data.SoDienCu,
      SoDienMoi: data.SoDienMoi,
      SoNuocCu: data.SoNuocCu,
      SoNuocMoi: data.SoNuocMoi,
      NgayTao: new Date(),
      NguoiTao: user?.MaNhanVien || null,
      NgayCapNhat: new Date(),
      NguoiCapNhat: user?.MaNhanVien || null,
    });
  }

  async update(id, data, user) {
    const record = await ChiSoDienNuoc.findByPk(id);
    if (!record) throw new Error("Không tìm thấy chỉ số");
    // Chỉ cho phép update các field số liệu và cập nhật
    const updateData = {};
    if (data.SoDienCu !== undefined) updateData.SoDienCu = data.SoDienCu;
    if (data.SoDienMoi !== undefined) updateData.SoDienMoi = data.SoDienMoi;
    if (data.SoNuocCu !== undefined) updateData.SoNuocCu = data.SoNuocCu;
    if (data.SoNuocMoi !== undefined) updateData.SoNuocMoi = data.SoNuocMoi;
    updateData.NgayCapNhat = new Date();
    updateData.NguoiCapNhat = user?.MaNhanVien || null;
    await record.update(updateData);
    return record;
  }

  async getById(id) {
    return await ChiSoDienNuoc.findByPk(id);
  }

  async getList(filter = {}) {
    const where = {};
    const include = [];
    if (filter.search) {
      where[Op.or] = [{ ThangNam: { [Op.like]: `%${filter.search}%` } }];
    }

    const { page, limit } = filter;
    const offset = (page - 1) * limit;

    const { count, rows } = await ChiSoDienNuoc.findAndCountAll({
      where,
      include,
      offset,
      limit,
      order: [["ThangNam", "DESC"]],
      distinct: true,
    });

    return {
      data: rows,
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit),
      },
    };
  }
}

module.exports = new ChiSoDienNuocService();
