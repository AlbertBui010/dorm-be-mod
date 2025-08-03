const { ChiTietDienNuoc, ChiSoDienNuoc, Phong } = require("../models");
const { Op } = require("sequelize");

class ChiTietDienNuocService {
  async getChiTietDienNuoc(filters = {}) {
    const where = {};
    if (filters.MaSinhVien) {
      where.MaSinhVien = {
        [Op.like]: `%${filters.MaSinhVien}%`,
      };
    }

    if (filters.MaSinhVien) {
      where.MaSinhVien = {
        [Op.like]: `%${filters.MaSinhVien}%`,
      };
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
          include: [
            {
              model: Phong,
              as: "Phong",
              attributes: [
                "MaPhong",
                "SoPhong",
                "LoaiPhong",
                "SucChua",
                "GiaThueThang",
                "DienTich",
                "TrangThai",
              ],
            },
          ],
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
          include: [
            {
              model: Phong,
              as: "Phong",
              attributes: [
                "MaPhong",
                "SoPhong",
                "LoaiPhong",
                "SucChua",
                "GiaThueThang",
                "DienTich",
                "TrangThai",
              ],
            },
          ],
        },
      ],
    });
  }
}

module.exports = new ChiTietDienNuocService();
