const { Giuong, Phong, SinhVien, DangKy, sequelize } = require("../models");
const { Op } = require("sequelize");
const { PHONG_STATUS } = require("../constants/phong");

class GiuongService {
  async getAllGiuong(filters = {}, pagination = {}) {
    const { page = 1, limit = 10 } = pagination;
    const offset = (page - 1) * limit;

    const whereClause = {};

    if (filters.search) {
      whereClause[Op.or] = [
        { SoGiuong: { [Op.iLike]: `%${filters.search}%` } },
        { "$Phong.SoPhong$": { [Op.iLike]: `%${filters.search}%` } },
      ];
    }

    if (filters.maPhong) {
      whereClause.MaPhong = filters.maPhong;
    }

    if (filters.trangThai) {
      if (filters.trangThai === "occupied") {
        whereClause.DaCoNguoi = true;
      } else if (filters.trangThai === "available") {
        whereClause.DaCoNguoi = false;
      }
    }

    const { rows: giuongs, count: total } = await Giuong.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [
        ["MaPhong", "ASC"],
        ["SoGiuong", "ASC"],
      ],
      distinct: true,
      col: "MaGiuong",
      include: [
        {
          model: Phong,
          as: "Phong",
          attributes: ["MaPhong", "SoPhong", "LoaiPhong", "SucChua"],
        },
        {
          model: SinhVien,
          as: "SinhVien",
          attributes: ["MaSinhVien", "HoTen", "Email", "SoDienThoai"],
          required: false,
        },
      ],
    });

    return {
      giuongs,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit),
      },
    };
  }

  async getGiuongById(maGiuong) {
    const giuong = await Giuong.findByPk(maGiuong, {
      include: [
        {
          model: Phong,
          as: "Phong",
          attributes: [
            "MaPhong",
            "SoPhong",
            "LoaiPhong",
            "SucChua",
            "SoLuongHienTai",
          ],
        },
        {
          model: SinhVien,
          as: "SinhVien",
          attributes: ["MaSinhVien", "HoTen", "Email", "SoDienThoai"],
          required: false,
        },
      ],
    });

    if (!giuong) {
      throw new Error("Giường không tồn tại");
    }

    return giuong;
  }

  async createGiuong(giuongData, createdBy) {
    const transaction = await sequelize.transaction();

    try {
      // 1. Validate required fields
      if (!giuongData.MaPhong || !giuongData.SoGiuong) {
        throw new Error("MaPhong và SoGiuong là bắt buộc");
      }

      // 2. Check if room exists
      const phong = await Phong.findByPk(giuongData.MaPhong);
      if (!phong) {
        throw new Error("Phòng không tồn tại");
      }

      // 3. Check SoGiuong uniqueness within the same room
      const existingGiuong = await Giuong.findOne({
        where: {
          MaPhong: giuongData.MaPhong,
          SoGiuong: giuongData.SoGiuong,
        },
        transaction,
      });

      if (existingGiuong) {
        throw new Error("Số giường đã tồn tại trong phòng này");
      }

      // 4. If MaSinhVienChiEm is provided, validate student assignment
      if (giuongData.MaSinhVienChiEm) {
        // Check if student exists
        const sinhVien = await SinhVien.findByPk(giuongData.MaSinhVienChiEm);
        if (!sinhVien) {
          throw new Error("Sinh viên không tồn tại");
        }

        // Check if student is already assigned to another bed
        const existingAssignment = await Giuong.findOne({
          where: {
            MaSinhVienChiEm: giuongData.MaSinhVienChiEm,
          },
          transaction,
        });

        if (existingAssignment) {
          throw new Error("Sinh viên đã được gán giường khác");
        }

        // Check room capacity
        if (phong.SoLuongHienTai >= phong.SucChua) {
          throw new Error("Phòng đã đầy, không thể gán thêm sinh viên");
        }

        // Update room current count
        await phong.increment("SoLuongHienTai", { transaction });
      }

      // 5. Create bed
      const giuong = await Giuong.create(
        {
          MaPhong: giuongData.MaPhong,
          SoGiuong: giuongData.SoGiuong,
          DaCoNguoi: giuongData.MaSinhVienChiEm ? true : false,
          MaSinhVienChiEm: giuongData.MaSinhVienChiEm || null,
          NgayTao: new Date(),
          NguoiTao: createdBy,
        },
        { transaction }
      );

      await transaction.commit();
      return await this.getGiuongById(giuong.MaGiuong);
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async updateGiuong(maGiuong, trangThai, updatedBy) {
    // Kiểm tra giường đang không có ngưởi ở mới cho chuyển sang trạng thái BAO_TRI, NGUNG_HOAT_DONG
    try {
      const giuong = await Giuong.findByPk(maGiuong);
      if (!giuong) {
        throw new Error("Giường không tồn tại");
      }

      if (giuong.DaCoNguoi) {
        throw new Error("Không thể chuyển trạng thái giường đang có người ở");
      }

      await giuong.update({
        TrangThai: trangThai,
        NgayCapNhat: new Date(),
        NguoiCapNhat: updatedBy,
      });

      return await this.getGiuongById(maGiuong);
    } catch (error) {
      throw error;
    }
  }

  async deleteGiuong(maGiuong) {
    const transaction = await sequelize.transaction();

    try {
      const giuong = await Giuong.findByPk(maGiuong, {
        include: [{ model: Phong, as: "Phong" }],
        transaction,
      });

      if (!giuong) {
        throw new Error("Giường không tồn tại");
      }

      // 1. Check if bed is occupied
      if (giuong.DaCoNguoi) {
        throw new Error("Không thể xóa giường đang có người ở");
      }

      // 2. Check if there are any registration records referencing this bed
      const hasRegistrations = await DangKy.findOne({
        where: { MaGiuong: maGiuong },
        transaction,
      });

      if (hasRegistrations) {
        throw new Error("Không thể xóa giường có lịch sử đăng ký");
      }

      // 3. Delete bed
      await giuong.destroy({ transaction });

      await transaction.commit();
      return { message: "Xóa giường thành công" };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async assignStudentToBed(maGiuong, maSinhVien, assignedBy) {
    const transaction = await sequelize.transaction();

    try {
      const giuong = await Giuong.findByPk(maGiuong, {
        include: [{ model: Phong, as: "Phong" }],
        transaction,
      });

      if (!giuong) {
        throw new Error("Giường không tồn tại");
      }

      if (giuong.DaCoNguoi) {
        throw new Error("Giường đã có người ở");
      }

      // Check if student exists
      const sinhVien = await SinhVien.findByPk(maSinhVien);
      if (!sinhVien) {
        throw new Error("Sinh viên không tồn tại");
      }

      // Check gender compatibility with room type
      if (giuong.Phong.LoaiPhong && giuong.Phong.LoaiPhong !== "Hỗn hợp") {
        if (sinhVien.GioiTinh !== giuong.Phong.LoaiPhong) {
          throw new Error(
            `Sinh viên ${sinhVien.GioiTinh} không thể ở phòng dành cho ${giuong.Phong.LoaiPhong}`
          );
        }
      }

      // Check if student is already assigned to another bed
      const existingAssignment = await Giuong.findOne({
        where: { MaSinhVienChiEm: maSinhVien },
        transaction,
      });

      if (existingAssignment) {
        throw new Error("Sinh viên đã được gán giường khác");
      }

      // Check room capacity
      if (giuong.Phong.SoLuongHienTai >= giuong.Phong.SucChua) {
        throw new Error("Phòng đã đầy, không thể gán thêm sinh viên");
      }

      // Update bed and room
      await giuong.update(
        {
          DaCoNguoi: true,
          MaSinhVienChiEm: maSinhVien,
          NgayCapNhat: new Date(),
          NguoiCapNhat: assignedBy,
        },
        { transaction }
      );

      await giuong.Phong.increment("SoLuongHienTai", { transaction });

      await transaction.commit();
      return await this.getGiuongById(maGiuong);
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async removeStudentFromBed(maGiuong, removedBy) {
    const transaction = await sequelize.transaction();

    try {
      const giuong = await Giuong.findByPk(maGiuong, {
        include: [{ model: Phong, as: "Phong" }],
        transaction,
      });

      if (!giuong) {
        throw new Error("Giường không tồn tại");
      }

      if (!giuong.DaCoNguoi) {
        throw new Error("Giường hiện tại không có người ở");
      }

      // Update bed and room
      await giuong.update(
        {
          DaCoNguoi: false,
          MaSinhVienChiEm: null,
          NgayCapNhat: new Date(),
          NguoiCapNhat: removedBy,
        },
        { transaction }
      );

      await giuong.Phong.decrement("SoLuongHienTai", { transaction });

      await transaction.commit();
      return await this.getGiuongById(maGiuong);
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async getGiuongByRoom(maPhong) {
    const giuongs = await Giuong.findAll({
      where: { MaPhong: maPhong },
      order: [["SoGiuong", "ASC"]],
      include: [
        {
          model: SinhVien,
          as: "SinhVien",
          attributes: ["MaSinhVien", "HoTen", "Email"],
          required: false,
        },
      ],
    });

    return giuongs;
  }

  async getAvailableBeds() {
    const giuongs = await Giuong.findAll({
      where: { DaCoNguoi: false },
      include: [
        {
          model: Phong,
          as: "Phong",
          attributes: ["MaPhong", "SoPhong", "LoaiPhong"],
          where: { TrangThai: PHONG_STATUS.HOAT_DONG },
        },
      ],
      order: [
        ["MaPhong", "ASC"],
        ["SoGiuong", "ASC"],
      ],
    });

    return giuongs;
  }

  async getBedStatistics() {
    const stats = await Giuong.findAll({
      attributes: [
        [sequelize.fn("COUNT", sequelize.col("MaGiuong")), "TongSoGiuong"],
        [
          sequelize.fn(
            "SUM",
            sequelize.cast(sequelize.col("DaCoNguoi"), "integer")
          ),
          "SoGiuongDangO",
        ],
        [
          sequelize.fn(
            "SUM",
            sequelize.cast(
              sequelize.literal(
                'CASE WHEN "DaCoNguoi" = false THEN 1 ELSE 0 END'
              ),
              "integer"
            )
          ),
          "SoGiuongTrong",
        ],
      ],
      include: [
        {
          model: Phong,
          as: "Phong",
          attributes: ["LoaiPhong"],
        },
      ],
      group: ["Phong.LoaiPhong"],
    });

    return stats;
  }
}

module.exports = new GiuongService();
