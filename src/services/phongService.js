const { Phong, Giuong, SinhVien } = require("../models");
const { Op } = require("sequelize");

class PhongService {
  async getAllPhong(filters = {}, pagination = {}) {
    const { page = 1, limit = 10 } = pagination;
    const offset = (page - 1) * limit;

    const whereClause = {};

    if (filters.search) {
      whereClause.SoPhong = { [Op.iLike]: `%${filters.search}%` };
    }

    if (filters.loaiPhong) {
      whereClause.LoaiPhong = filters.loaiPhong;
    }

    if (filters.trangThai) {
      if (filters.trangThai === "available") {
        whereClause.SoLuongHienTai = { [Op.lt]: sequelize.col("SucChua") };
      } else if (filters.trangThai === "full") {
        whereClause.SoLuongHienTai = sequelize.col("SucChua");
      }
    }

    const { rows: phongs, count: total } = await Phong.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [["SoPhong", "ASC"]],
      include: [
        {
          association: "Giuongs",
          include: [
            {
              association: "SinhVien",
              attributes: ["MaSinhVien", "HoTen"],
            },
          ],
        },
      ],
    });

    return {
      phongs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
      },
    };
  }

  async getPhongById(maPhong) {
    const phong = await Phong.findByPk(maPhong, {
      include: [
        {
          association: "Giuongs",
          include: [
            {
              association: "SinhVien",
              attributes: ["MaSinhVien", "HoTen", "SoDienThoai", "Email"],
            },
          ],
        },
        { association: "DangKys" },
        { association: "ChiSoDienNuocs" },
      ],
    });

    if (!phong) {
      throw new Error("Phòng không tồn tại");
    }

    return phong;
  }

  async createPhong(phongData, createdBy) {
    // Check if room number already exists
    const existingPhong = await Phong.findOne({
      where: { SoPhong: phongData.SoPhong },
    });

    if (existingPhong) {
      throw new Error("Số phòng đã tồn tại");
    }

    const phong = await Phong.create({
      ...phongData,
      NgayTao: new Date(),
      NguoiTao: createdBy,
    });

    // Create beds for the room
    const beds = [];
    for (let i = 1; i <= phongData.SucChua; i++) {
      beds.push({
        MaPhong: phong.MaPhong,
        SoGiuong: `G${i}`,
        NgayTao: new Date(),
        NguoiTao: createdBy,
      });
    }

    await Giuong.bulkCreate(beds);

    return await this.getPhongById(phong.MaPhong);
  }

  async updatePhong(maPhong, updateData, updatedBy) {
    const phong = await Phong.findByPk(maPhong);

    if (!phong) {
      throw new Error("Phòng không tồn tại");
    }

    // Check for duplicate room number
    if (updateData.SoPhong && updateData.SoPhong !== phong.SoPhong) {
      const existingPhong = await Phong.findOne({
        where: {
          SoPhong: updateData.SoPhong,
          MaPhong: { [Op.ne]: maPhong },
        },
      });

      if (existingPhong) {
        throw new Error("Số phòng đã tồn tại");
      }
    }

    await phong.update({
      ...updateData,
      NgayCapNhat: new Date(),
      NguoiCapNhat: updatedBy,
    });

    return await this.getPhongById(maPhong);
  }

  async deletePhong(maPhong) {
    const phong = await Phong.findByPk(maPhong);

    if (!phong) {
      throw new Error("Phòng không tồn tại");
    }

    // Check if room has residents
    if (phong.SoLuongHienTai > 0) {
      throw new Error("Không thể xóa phòng đang có người ở");
    }

    // Delete associated beds
    await Giuong.destroy({ where: { MaPhong: maPhong } });

    await phong.destroy();
    return { message: "Xóa phòng thành công" };
  }

  async getAvailableRooms() {
    const phongs = await Phong.findAll({
      where: {
        SoLuongHienTai: {
          [Op.lt]: sequelize.col("SucChua"),
        },
      },
      include: [
        {
          association: "Giuongs",
          where: { DaCoNguoi: false },
          required: false,
        },
      ],
    });

    return phongs;
  }
}

module.exports = new PhongService();
