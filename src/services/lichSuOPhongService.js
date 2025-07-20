const { LichSuOPhong, SinhVien, Phong } = require("../models");
const { Op } = require("sequelize");
const sequelize = require("../config/database");

class LichSuOPhongService {
  async getAllLichSuOPhong(filters = {}, pagination = {}) {
    const { page = 1, limit = 10 } = pagination;
    const offset = (page - 1) * limit;

    const whereClause = {};

    // Filter by student code
    if (filters.MaSinhVien) {
      whereClause.MaSinhVien = { [Op.iLike]: `%${filters.MaSinhVien}%` };
    }

    // Filter by room number
    if (filters.MaPhong) {
      whereClause.MaPhong = filters.MaPhong;
    }

    const { rows: lichSuOPhongs, count: total } =
      await LichSuOPhong.findAndCountAll({
        where: whereClause,
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [["NgayTao", "DESC"]],
        distinct: true,
        col: "ID",
        include: [
          {
            association: "SinhVien",
            attributes: ["MaSinhVien", "HoTen", "SoDienThoai", "Email"],
          },
          {
            association: "Phong",
            attributes: ["MaPhong", "SoPhong", "LoaiPhong", "SucChua"],
          },
        ],
      });

    return {
      lichSuOPhongs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
      },
    };
  }

  async getLichSuOPhongById(id) {
    const lichSuOPhong = await LichSuOPhong.findByPk(id, {
      include: [
        {
          association: "SinhVien",
          attributes: [
            "MaSinhVien",
            "HoTen",
            "SoDienThoai",
            "Email",
            "NgaySinh",
          ],
        },
        {
          association: "Phong",
          attributes: [
            "MaPhong",
            "SoPhong",
            "LoaiPhong",
            "SucChua",
            "DienTich",
            "GiaThueThang",
          ],
        },
      ],
    });

    if (!lichSuOPhong) {
      throw new Error("Lịch sử ở phòng không tồn tại");
    }

    return lichSuOPhong;
  }

  async getLichSuOPhongBySinhVien(maSinhVien) {
    const lichSuOPhongs = await LichSuOPhong.findAll({
      where: { MaSinhVien: maSinhVien },
      order: [["NgayBatDau", "DESC"]],
      include: [
        {
          association: "Phong",
          attributes: ["MaPhong", "SoPhong", "LoaiPhong", "SucChua"],
        },
      ],
    });

    return lichSuOPhongs;
  }

  async getLichSuOPhongByPhong(maPhong) {
    const lichSuOPhongs = await LichSuOPhong.findAll({
      where: { MaPhong: maPhong },
      order: [["NgayBatDau", "DESC"]],
      include: [
        {
          association: "SinhVien",
          attributes: ["MaSinhVien", "HoTen", "SoDienThoai", "Email"],
        },
      ],
    });

    return lichSuOPhongs;
  }

  async getLichSuOPhongStatistics() {
    const totalRecords = await LichSuOPhong.count();

    const activeRecords = await LichSuOPhong.count({
      where: {
        NgayKetThuc: {
          [Op.or]: [null, { [Op.gt]: new Date() }],
        },
      },
    });

    const inactiveRecords = await LichSuOPhong.count({
      where: {
        NgayKetThuc: {
          [Op.and]: [{ [Op.ne]: null }, { [Op.lte]: new Date() }],
        },
      },
    });

    const currentMonthRecords = await LichSuOPhong.count({
      where: {
        NgayTao: {
          [Op.gte]: new Date(
            new Date().getFullYear(),
            new Date().getMonth(),
            1
          ),
        },
      },
    });

    return {
      totalRecords,
      activeRecords,
      inactiveRecords,
      currentMonthRecords,
    };
  }
}

module.exports = new LichSuOPhongService();
