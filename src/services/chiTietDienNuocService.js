const { ChiTietDienNuoc, ChiSoDienNuoc } = require("../models");
const { Op } = require("sequelize");

class ChiTietDienNuocService {
  // Lấy chi tiết điện nước theo id sinh viên hoặc theo bộ lọc
  async getChiTietDienNuoc(maSinhVien, filters = {}) {
    const where = {};
    if (maSinhVien) {
      where.MaSinhVien = maSinhVien;
    }
    // Thêm các bộ lọc khác nếu cần
    if (filters.MaChiSo) where.MaChiSo = filters.MaChiSo;
    if (filters.TuThangNam && filters.DenThangNam) {
      where[Op.and] = [
        { "$ChiSoDienNuoc.ThangNam$": { [Op.gte]: filters.TuThangNam } },
        { "$ChiSoDienNuoc.ThangNam$": { [Op.lte]: filters.DenThangNam } },
      ];
    } else if (filters.ThangNam) {
      where["$ChiSoDienNuoc.ThangNam$"] = filters.ThangNam;
    }
    if (filters.MaPhong) {
      where["$ChiSoDienNuoc.MaPhong$"] = filters.MaPhong;
    }

    return await ChiTietDienNuoc.findAll({
      where,
      include: [
        {
          model: ChiSoDienNuoc,
          as: "ChiSoDienNuoc",
        },
      ],
      order: [["ID", "DESC"]],
    });
  }

  // Lấy chi tiết điện nước theo ID (primary key)
  async getById(id) {
    return await ChiTietDienNuoc.findByPk(id, {
      include: [
        {
          model: ChiSoDienNuoc,
          as: "ChiSoDienNuoc",
        },
      ],
    });
  }
}

module.exports = new ChiTietDienNuocService();
