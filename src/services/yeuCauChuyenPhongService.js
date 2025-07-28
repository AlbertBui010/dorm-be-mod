const { YeuCauChuyenPhong, SinhVien, Phong, Giuong } = require("../models");
const { Op } = require("sequelize");
const sequelize = require("../config/database");
const { PHONG_STATUS } = require("../constants/phong");
const { GIUONG_STATUS } = require("../constants/giuong");

class YeuCauChuyenPhongService {
  /**
   * Lấy danh sách yêu cầu chuyển phòng
   */
  async getAllYeuCau(filters = {}, pagination = {}) {
    const { page = 1, limit = 10 } = pagination;
    const offset = (page - 1) * limit;

    const whereClause = {};

    // Filter theo trạng thái
    if (filters.trangThai) {
      whereClause.TrangThai = filters.trangThai;
    }

    // Filter theo sinh viên
    if (filters.maSinhVien) {
      whereClause.MaSinhVien = filters.maSinhVien;
    }

    // Filter theo phòng mới
    if (filters.maPhongMoi) {
      whereClause.MaPhongMoi = filters.maPhongMoi;
    }

    // Filter theo ngày yêu cầu
    if (filters.tuNgay && filters.denNgay) {
      whereClause.NgayYeuCau = {
        [Op.between]: [filters.tuNgay, filters.denNgay],
      };
    }

    // Search theo từ khóa
    if (filters.search && filters.search.trim() !== "") {
      whereClause[Op.or] = [
        {
          MaSinhVien: {
            [Op.like]: `%${filters.search.trim()}%`,
          },
        },
        {
          "$SinhVien.HoTen$": {
            [Op.like]: `%${filters.search.trim()}%`,
          },
        },
        {
          "$SinhVien.Email$": {
            [Op.like]: `%${filters.search.trim()}%`,
          },
        },
      ];
    }

    const { rows: yeuCaus, count: total } =
      await YeuCauChuyenPhong.findAndCountAll({
        where: whereClause,
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [["NgayTao", "DESC"]],
        include: [
          {
            model: SinhVien,
            as: "SinhVien",
            attributes: ["MaSinhVien", "HoTen", "Email", "SoDienThoai"],
          },
          {
            model: Phong,
            as: "PhongMoi",
            attributes: [
              "MaPhong",
              "SoPhong",
              "LoaiPhong",
              "SucChua",
              "SoLuongHienTai",
            ],
          },
        ],
      });

    // Add current room information for each request
    const yeuCausWithCurrentRoom = await Promise.all(
      yeuCaus.map(async (yeuCau) => {
        const giuongHienTai = await Giuong.findOne({
          where: {
            MaSinhVienChiEm: yeuCau.MaSinhVien,
            DaCoNguoi: true,
          },
        });

        if (giuongHienTai) {
          const phongHienTai = await Phong.findByPk(giuongHienTai.MaPhong);
          yeuCau.dataValues.PhongHienTai = phongHienTai;
        }

        return yeuCau;
      })
    );

    return {
      yeuCaus: yeuCausWithCurrentRoom,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit),
      },
    };
  }

  /**
   * Lấy yêu cầu chuyển phòng theo ID
   */
  async getYeuCauById(maYeuCau) {
    const yeuCau = await YeuCauChuyenPhong.findByPk(maYeuCau, {
      include: [
        {
          model: SinhVien,
          as: "SinhVien",
          attributes: [
            "MaSinhVien",
            "HoTen",
            "Email",
            "SoDienThoai",
            "GioiTinh",
          ],
        },
        {
          model: Phong,
          as: "PhongMoi",
          attributes: [
            "MaPhong",
            "SoPhong",
            "LoaiPhong",
            "SucChua",
            "SoLuongHienTai",
          ],
        },
      ],
    });

    if (!yeuCau) {
      throw new Error("Yêu cầu chuyển phòng không tồn tại");
    }

    // Thêm thông tin phòng hiện tại
    const giuongHienTai = await Giuong.findOne({
      where: {
        MaSinhVienChiEm: yeuCau.MaSinhVien,
        DaCoNguoi: true,
      },
    });

    if (giuongHienTai) {
      const phongHienTai = await Phong.findByPk(giuongHienTai.MaPhong);
      yeuCau.dataValues.PhongHienTai = phongHienTai;
    }

    return yeuCau;
  }

  /**
   * Tạo yêu cầu chuyển phòng mới
   */
  async createYeuCau(yeuCauData, createdBy) {
    const transaction = await sequelize.transaction();

    try {
      // 1. Kiểm tra sinh viên tồn tại
      const sinhVien = await SinhVien.findByPk(yeuCauData.MaSinhVien);
      if (!sinhVien) {
        throw new Error("Sinh viên không tồn tại");
      }

      // 2. Kiểm tra sinh viên đang ở phòng thông qua bảng Giuong
      const giuongHienTai = await Giuong.findOne({
        where: {
          MaSinhVienChiEm: yeuCauData.MaSinhVien,
          DaCoNguoi: true,
        },
      });

      if (!giuongHienTai) {
        throw new Error("Sinh viên chưa được phân phòng hoặc chưa có giường");
      }

      const phongHienTai = await Phong.findByPk(giuongHienTai.MaPhong);
      if (!phongHienTai) {
        throw new Error("Không tìm thấy thông tin phòng hiện tại");
      }

      // 3. Kiểm tra phòng mới tồn tại và hợp lệ
      if (yeuCauData.MaPhongMoi) {
        const phongMoi = await Phong.findByPk(yeuCauData.MaPhongMoi);
        if (!phongMoi) {
          throw new Error("Phòng mới không tồn tại");
        }

        // Kiểm tra không chuyển về chính phòng hiện tại
        if (phongMoi.MaPhong === phongHienTai.MaPhong) {
          throw new Error("Không thể chuyển về chính phòng hiện tại");
        }

        // Kiểm tra giới tính phòng
        if (phongMoi.LoaiPhong) {
          if (sinhVien.GioiTinh !== phongMoi.LoaiPhong) {
            throw new Error(
              `Sinh viên ${sinhVien.GioiTinh} không thể chuyển đến phòng dành cho ${phongMoi.LoaiPhong}`
            );
          }
        }

        // Kiểm tra sức chứa phòng
        if (phongMoi.SoLuongHienTai >= phongMoi.SucChua) {
          throw new Error("Phòng mới đã đầy, không thể chuyển đến");
        }

        // Kiểm tra có giường trống trong phòng mới không
        const giuongTrong = await Giuong.findOne({
          where: {
            MaPhong: yeuCauData.MaPhongMoi,
            DaCoNguoi: false,
          },
        });

        if (!giuongTrong) {
          throw new Error("Không có giường trống trong phòng mới");
        }
      }

      // 4. Kiểm tra yêu cầu đang chờ xử lý
      const existingYeuCau = await YeuCauChuyenPhong.findOne({
        where: {
          MaSinhVien: yeuCauData.MaSinhVien,
          TrangThai: { [Op.in]: ["CHO_DUYET", "DANG_XU_LY"] },
        },
        transaction,
      });

      if (existingYeuCau) {
        throw new Error("Sinh viên đã có yêu cầu chuyển phòng đang chờ xử lý");
      }

      // 5. Tạo yêu cầu chuyển phòng
      const yeuCau = await YeuCauChuyenPhong.create(
        {
          ...yeuCauData,
          NgayYeuCau: yeuCauData.NgayYeuCau || new Date(),
          TrangThai: "CHO_DUYET",
          NgayTao: new Date(),
          NguoiTao: createdBy,
        },
        { transaction }
      );

      await transaction.commit();
      return await this.getYeuCauById(yeuCau.MaYeuCau);
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Cập nhật yêu cầu chuyển phòng
   */
  async updateYeuCau(maYeuCau, updateData, updatedBy) {
    const transaction = await sequelize.transaction();

    try {
      const yeuCau = await YeuCauChuyenPhong.findByPk(maYeuCau);
      if (!yeuCau) {
        throw new Error("Yêu cầu chuyển phòng không tồn tại");
      }

      // Chỉ cho phép cập nhật khi yêu cầu chưa được xử lý
      if (yeuCau.TrangThai !== "CHO_DUYET") {
        throw new Error("Không thể cập nhật yêu cầu đã được xử lý");
      }

      // Kiểm tra phòng mới nếu có thay đổi
      if (
        updateData.MaPhongMoi &&
        updateData.MaPhongMoi !== yeuCau.MaPhongMoi
      ) {
        const phongMoi = await Phong.findByPk(updateData.MaPhongMoi);
        if (!phongMoi) {
          throw new Error("Phòng mới không tồn tại");
        }

        // Kiểm tra sức chứa phòng
        if (phongMoi.SoLuongHienTai >= phongMoi.SucChua) {
          throw new Error("Phòng mới đã đầy, không thể chuyển đến");
        }
      }

      await yeuCau.update(
        {
          ...updateData,
          NgayCapNhat: new Date(),
          NguoiCapNhat: updatedBy,
        },
        { transaction }
      );

      await transaction.commit();
      return await this.getYeuCauById(maYeuCau);
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Duyệt yêu cầu chuyển phòng
   */
  async approveYeuCau(
    maYeuCau,
    approvedBy,
    ghiChu = "",
    selectedRoom = null,
    selectedBed = null
  ) {
    const transaction = await sequelize.transaction();

    try {
      const yeuCau = await YeuCauChuyenPhong.findByPk(maYeuCau, {
        include: [
          {
            model: SinhVien,
            as: "SinhVien",
          },
          {
            model: Phong,
            as: "PhongMoi",
          },
        ],
        transaction,
      });

      if (!yeuCau) {
        throw new Error("Yêu cầu chuyển phòng không tồn tại");
      }

      if (yeuCau.TrangThai !== "CHO_DUYET") {
        throw new Error("Yêu cầu không ở trạng thái chờ duyệt");
      }

      // Xác định phòng và giường mới
      let phongMoi, giuongMoi;

      if (selectedRoom && selectedBed) {
        // Admin đã chọn phòng và giường cụ thể
        phongMoi = await Phong.findByPk(selectedRoom, { transaction });
        if (!phongMoi) {
          throw new Error("Phòng được chọn không tồn tại");
        }

        giuongMoi = await Giuong.findByPk(selectedBed, { transaction });
        if (!giuongMoi) {
          throw new Error("Giường được chọn không tồn tại");
        }

        if (giuongMoi.MaPhong !== selectedRoom) {
          throw new Error("Giường không thuộc phòng được chọn");
        }

        if (giuongMoi.DaCoNguoi) {
          throw new Error("Giường đã có người ở");
        }
      } else {
        // Sử dụng phòng từ yêu cầu (logic cũ)
        if (!yeuCau.MaPhongMoi) {
          throw new Error("Yêu cầu chưa chỉ định phòng mới");
        }

        // Kiểm tra phòng mới có sẵn
        if (yeuCau.PhongMoi.SoLuongHienTai >= yeuCau.PhongMoi.SucChua) {
          throw new Error("Phòng mới đã đầy, không thể chuyển đến");
        }

        phongMoi = yeuCau.PhongMoi;

        // Tìm giường trống trong phòng mới
        giuongMoi = await Giuong.findOne({
          where: {
            MaPhong: yeuCau.MaPhongMoi,
            DaCoNguoi: false,
          },
          transaction,
        });

        if (!giuongMoi) {
          throw new Error("Không có giường trống trong phòng mới");
        }
      }

      // Lấy phòng hiện tại của sinh viên thông qua bảng Giuong
      const giuongHienTaiCheck = await Giuong.findOne({
        where: {
          MaSinhVienChiEm: yeuCau.MaSinhVien,
          DaCoNguoi: true,
        },
        transaction,
      });

      if (!giuongHienTaiCheck) {
        throw new Error("Không tìm thấy giường hiện tại của sinh viên");
      }

      const phongHienTai = await Phong.findByPk(giuongHienTaiCheck.MaPhong, {
        transaction,
      });

      if (!phongHienTai) {
        throw new Error("Không tìm thấy phòng hiện tại của sinh viên");
      }

      // Thực hiện chuyển phòng
      // 1. Cập nhật giường hiện tại
      await giuongHienTai.update(
        {
          DaCoNguoi: false,
          MaSinhVienChiEm: null,
          NgayCapNhat: new Date(),
          NguoiCapNhat: approvedBy,
        },
        { transaction }
      );

      // 2. Cập nhật giường mới
      await giuongMoi.update(
        {
          DaCoNguoi: true,
          MaSinhVienChiEm: yeuCau.MaSinhVien,
          NgayCapNhat: new Date(),
          NguoiCapNhat: approvedBy,
        },
        { transaction }
      );

      // 3. Cập nhật số lượng phòng hiện tại
      await phongHienTai.update(
        {
          SoLuongHienTai: phongHienTai.SoLuongHienTai - 1,
          NgayCapNhat: new Date(),
          NguoiCapNhat: approvedBy,
        },
        { transaction }
      );

      // 4. Cập nhật số lượng phòng mới
      await yeuCau.PhongMoi.update(
        {
          SoLuongHienTai: yeuCau.PhongMoi.SoLuongHienTai + 1,
          NgayCapNhat: new Date(),
          NguoiCapNhat: approvedBy,
        },
        { transaction }
      );

      // 5. Cập nhật thông tin sinh viên (không cần cập nhật MaPhong vì không có trong model SinhVien)
      // Thông tin phòng được lưu trong bảng Giuong

      // 6. Tạo lịch sử ở phòng
      const LichSuOPhong = require("../models/LichSuOPhong");

      // Cập nhật lịch sử phòng cũ (kết thúc)
      const lichSuCu = await LichSuOPhong.findOne({
        where: {
          MaSinhVien: yeuCau.MaSinhVien,
          MaPhong: giuongHienTaiCheck.MaPhong,
          NgayKetThuc: null,
        },
        order: [["NgayBatDau", "DESC"]],
        transaction,
      });
      if (lichSuCu) {
        await lichSuCu.update(
          {
            NgayKetThuc: new Date().toISOString().split("T")[0],
            NgayCapNhat: new Date(),
            NguoiCapNhat: approvedBy,
          },
          { transaction }
        );
      }

      // Tạo lịch sử phòng mới (bắt đầu)
      await LichSuOPhong.create(
        {
          MaSinhVien: yeuCau.MaSinhVien,
          MaPhong: yeuCau.MaPhongMoi,
          NgayBatDau: new Date().toISOString().split("T")[0], // Ngày bắt đầu = ngày chuyển phòng
          NgayKetThuc: null, // Chưa có ngày kết thúc
          NgayTao: new Date(),
          NguoiTao: approvedBy,
        },
        { transaction }
      );

      // 7. Cập nhật trạng thái yêu cầu
      await yeuCau.update(
        {
          TrangThai: "DA_DUYET",
          LyDo: ghiChu || yeuCau.LyDo, // Lưu lý do duyệt vào trường LyDo
          NgayCapNhat: new Date(),
          NguoiCapNhat: approvedBy,
        },
        { transaction }
      );

      await transaction.commit();
      return await this.getYeuCauById(maYeuCau);
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Từ chối yêu cầu chuyển phòng
   */
  async rejectYeuCau(maYeuCau, rejectedBy, lyDoTuChoi = "") {
    const transaction = await sequelize.transaction();

    try {
      const yeuCau = await YeuCauChuyenPhong.findByPk(maYeuCau, {
        transaction,
      });

      if (!yeuCau) {
        throw new Error("Yêu cầu chuyển phòng không tồn tại");
      }

      if (yeuCau.TrangThai !== "CHO_DUYET") {
        throw new Error("Yêu cầu không ở trạng thái chờ duyệt");
      }

      await yeuCau.update(
        {
          TrangThai: "TU_CHOI",
          LyDo: lyDoTuChoi || yeuCau.LyDo, // Lưu lý do từ chối vào trường LyDo
          NgayCapNhat: new Date(),
          NguoiCapNhat: rejectedBy,
        },
        { transaction }
      );

      await transaction.commit();
      return await this.getYeuCauById(maYeuCau);
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Lấy yêu cầu chuyển phòng của sinh viên
   */
  async getYeuCauBySinhVien(maSinhVien) {
    const yeuCaus = await YeuCauChuyenPhong.findAll({
      where: { MaSinhVien: maSinhVien },
      include: [
        {
          model: Phong,
          as: "PhongMoi",
          attributes: ["MaPhong", "SoPhong", "LoaiPhong"],
        },
      ],
      order: [["NgayTao", "DESC"]],
    });

    return yeuCaus;
  }

  /**
   * Lấy chi tiết yêu cầu chuyển phòng của sinh viên đang đăng nhập
   */
  async getMyYeuCauById(maYeuCau, maSinhVien) {
    const yeuCau = await YeuCauChuyenPhong.findOne({
      where: {
        MaYeuCau: maYeuCau,
        MaSinhVien: maSinhVien,
      },
      include: [
        {
          model: SinhVien,
          as: "SinhVien",
          attributes: [
            "MaSinhVien",
            "HoTen",
            "Email",
            "SoDienThoai",
            "GioiTinh",
          ],
        },
        {
          model: Phong,
          as: "PhongMoi",
          attributes: [
            "MaPhong",
            "SoPhong",
            "LoaiPhong",
            "SucChua",
            "SoLuongHienTai",
            "MoTa",
          ],
        },
      ],
    });

    if (!yeuCau) {
      throw new Error(
        "Yêu cầu chuyển phòng không tồn tại hoặc không thuộc về bạn"
      );
    }

    return yeuCau;
  }

  /**
   * Lấy thống kê yêu cầu chuyển phòng
   */
  async getYeuCauStats() {
    const stats = await YeuCauChuyenPhong.findAll({
      attributes: [
        "TrangThai",
        [sequelize.fn("COUNT", sequelize.col("MaYeuCau")), "count"],
      ],
      group: ["TrangThai"],
    });

    const total = await YeuCauChuyenPhong.count();

    // Transform data to match frontend expectations
    const byStatus = stats.reduce((acc, stat) => {
      acc[stat.TrangThai] = parseInt(stat.dataValues.count);
      return acc;
    }, {});

    return {
      tongYeuCau: total,
      choDuyet: byStatus.CHO_DUYET || 0,
      daDuyet: byStatus.DA_DUYET || 0,
      tuChoi: byStatus.TU_CHOI || 0,
    };
  }

  /**
   * Lấy danh sách phòng và giường có sẵn cho chuyển phòng
   */
  async getAvailableRoomsAndBeds() {
    const rooms = await Phong.findAll({
      where: {
        TrangThai: PHONG_STATUS.HOAT_DONG,
      },
      include: [
        {
          model: Giuong,
          as: "Giuongs",
          where: {
            DaCoNguoi: false,
          },
          required: false,
          TrangThai: GIUONG_STATUS.HOAT_DONG,
        },
      ],
      order: [["SoPhong", "ASC"]],
    });

    return rooms.filter((room) => room.Giuongs && room.Giuongs.length > 0);
  }
}

module.exports = new YeuCauChuyenPhongService();
