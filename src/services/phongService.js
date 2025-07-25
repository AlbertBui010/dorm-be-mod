const { Phong, Giuong, SinhVien } = require("../models");
const { Op } = require("sequelize");
const sequelize = require("../config/database");
const { PHONG_STATUS } = require("../constants/phong");

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

    // Handle status filter with raw SQL
    if (filters.trangThai) {
      if (filters.trangThai === "available") {
        whereClause[Op.and] = [
          sequelize.literal('"SoLuongHienTai" < "SucChua"'),
        ];
      } else if (filters.trangThai === "full") {
        whereClause[Op.and] = [
          sequelize.literal('"SoLuongHienTai" >= "SucChua"'),
        ];
      }
    }

    const { rows: phongs, count: total } = await Phong.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [["SoPhong", "ASC"]],
      distinct: true,
      col: "MaPhong",
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
    // 1. Check if room number already exists
    const existingPhong = await Phong.findOne({
      where: { SoPhong: phongData.SoPhong },
    });

    if (existingPhong) {
      throw new Error("Số phòng đã tồn tại");
    }

    // 2. Validate business rules
    if (phongData.SucChua < 1 || phongData.SucChua > 10) {
      throw new Error("Sức chứa phòng phải từ 1 đến 10 người");
    }

    if (phongData.DienTich < 10 || phongData.DienTich > 100) {
      throw new Error("Diện tích phòng phải từ 10 đến 100 m²");
    }

    if (phongData.GiaThueThang < 0) {
      throw new Error("Giá phòng phải lớn hơn hoặc bằng 0");
    }

    // 3. Create room with initial values
    const phong = await Phong.create({
      ...phongData,
      SoLuongHienTai: 0,
      TrangThai: phongData.TrangThai || PHONG_STATUS.HOAT_DONG,
      NgayTao: new Date(),
      NguoiTao: createdBy,
    });

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

    // Validate business rules if being updated
    if (updateData.SucChua !== undefined) {
      if (updateData.SucChua < 1 || updateData.SucChua > 10) {
        throw new Error("Sức chứa phòng phải từ 1 đến 10 người");
      }

      // Kiểm tra xem sức chứa có giảm xuống dưới số lượng giường hiện tại không
      const currentBeds = await Giuong.findAll({
        where: { MaPhong: maPhong },
      });
      if (currentBeds.length > updateData.SucChua) {
        throw new Error(
          "Không thể giảm sức chứa xuống dưới số lượng hiện tại đang ở"
        );
      }

      // Check if reducing capacity would affect current residents
      if (updateData.SucChua < phong.SoLuongHienTai) {
        throw new Error(
          "Không thể giảm sức chứa xuống dưới số lượng hiện tại đang ở"
        );
      }
    }

    if (updateData.DienTich !== undefined) {
      if (updateData.DienTich < 10 || updateData.DienTich > 100) {
        throw new Error("Diện tích phòng phải từ 10 đến 100 m²");
      }
    }

    if (updateData.GiaThueThang !== undefined) {
      if (updateData.GiaThueThang < 0) {
        throw new Error("Giá phòng phải lớn hơn hoặc bằng 0");
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

    // Check if room has any registrations
    const hasRegistrations = await phong.countDangKys();
    if (hasRegistrations > 0) {
      throw new Error("Không thể xóa phòng có lịch sử đăng ký");
    }

    // Delete associated beds (should be empty already due to previous check)
    await Giuong.destroy({ where: { MaPhong: maPhong } });

    await phong.destroy();
    return { message: "Xóa phòng thành công" };
  }

  async getAvailableRooms() {
    const phongs = await Phong.findAll({
      where: {
        [Op.where]: sequelize.literal('"SoLuongHienTai" < "SucChua"'),
        TrangThai: PHONG_STATUS.HOAT_DONG,
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

  async getRoomStatistics() {
    const stats = await Phong.findAll({
      attributes: [
        "LoaiPhong",
        [sequelize.fn("COUNT", sequelize.col("MaPhong")), "TongSoPhong"],
        [sequelize.fn("SUM", sequelize.col("SucChua")), "TongSucChua"],
        [sequelize.fn("SUM", sequelize.col("SoLuongHienTai")), "TongDangO"],
      ],
      group: ["LoaiPhong"],
    });

    return stats;
  }
}

module.exports = new PhongService();
