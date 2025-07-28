const { DonGiaDienNuoc, ChiTietDienNuoc } = require("../models");
const { Op } = require("sequelize");
const sequelize = require("../config/database");

// Helper function để kiểm tra ThangNam có trong khoảng thời gian không
const isThangNamInRange = (thangNam, startDate, endDate) => {
  if (!thangNam) return false;

  // Parse ThangNam (MM/YYYY) thành Date
  const [month, year] = thangNam.split("/").map(Number);
  const chiSoDate = new Date(year, month - 1, 1);

  // Parse startDate và endDate
  const startDateObj = new Date(startDate);
  const endDateObj = new Date(endDate);

  return chiSoDate >= startDateObj && chiSoDate <= endDateObj;
};

const donGiaDienNuocService = {
  // Lấy tất cả đơn giá với phân trang
  async getAllDonGia(page = 1, limit = 10, search = "") {
    const offset = (page - 1) * limit;
    const whereClause = {};

    if (search) {
      whereClause[Op.or] = [
        { GiaDienPerKWh: { [Op.iLike]: `%${search}%` } },
        { GiaNuocPerM3: { [Op.iLike]: `%${search}%` } },
      ];
    }

    const { count, rows } = await DonGiaDienNuoc.findAndCountAll({
      where: whereClause,
      order: [["NgayApDung", "DESC"]],
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    return {
      data: rows,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(count / limit),
        totalItems: count,
        itemsPerPage: parseInt(limit),
      },
    };
  },

  // Lấy đơn giá theo ID
  async getDonGiaById(maDonGia) {
    const donGia = await DonGiaDienNuoc.findByPk(maDonGia);
    if (!donGia) {
      throw new Error("Không tìm thấy đơn giá");
    }
    return donGia;
  },

  // Lấy đơn giá hiện hành
  async getCurrentDonGia() {
    try {
      const currentDate = new Date().toISOString().split("T")[0]; // YYYY-MM-DD format

      const donGia = await DonGiaDienNuoc.findOne({
        where: {
          NgayApDung: { [Op.lte]: currentDate },
          [Op.or]: [
            { NgayKetThuc: null },
            { NgayKetThuc: { [Op.gte]: currentDate } },
          ],
        },
        order: [["NgayApDung", "DESC"]],
      });

      // Nếu không tìm thấy đơn giá cho ngày hiện tại
      if (!donGia) {
        // Tìm đơn giá gần nhất trong tương lai
        const futureDonGia = await DonGiaDienNuoc.findOne({
          where: {
            NgayApDung: {
              [Op.gt]: currentDate,
            },
          },
          order: [["NgayApDung", "ASC"]],
        });

        if (futureDonGia) {
          throw new Error(
            `Hiện tại chưa có đơn giá áp dụng. Đơn giá tiếp theo sẽ có hiệu lực từ ${futureDonGia.NgayApDung}`
          );
        } else {
          throw new Error(
            "Hiện tại chưa có đơn giá nào được thiết lập trong hệ thống"
          );
        }
      }

      return donGia;
    } catch (error) {
      throw error;
    }
  },

  // Kiểm tra trùng lặp thời gian - cải tiến logic
  async checkDateOverlap(ngayApDung, maDonGiaExclude = null) {
    const whereClause = {
      NgayApDung: ngayApDung, // Kiểm tra ngày áp dụng trùng nhau
    };

    if (maDonGiaExclude) {
      whereClause.MaDonGia = { [Op.ne]: maDonGiaExclude };
    }

    const existingRecord = await DonGiaDienNuoc.findOne({
      where: whereClause,
    });

    return existingRecord;
  },

  // Kiểm tra khoảng thời gian hợp lệ
  async validateDateRange(ngayApDung, maDonGiaExclude = null) {
    // Kiểm tra ngày áp dụng không được trùng
    const duplicateDate = await this.checkDateOverlap(
      ngayApDung,
      maDonGiaExclude
    );
    if (duplicateDate) {
      throw new Error("Ngày áp dụng đã tồn tại trong hệ thống");
    }

    // Kiểm tra ngày áp dụng không được trong quá khứ (trừ khi cập nhật)
    if (!maDonGiaExclude) {
      const today = new Date().toISOString().split("T")[0];
      if (ngayApDung < today) {
        throw new Error("Ngày áp dụng không được trong quá khứ");
      }
    }

    return true;
  },

  // Tạo đơn giá mới
  async createDonGia(donGiaData, maNhanVien) {
    const transaction = await sequelize.transaction();

    try {
      const { NgayApDung, GiaDienPerKWh, GiaNuocPerM3 } = donGiaData;

      // Validate dữ liệu đầu vào
      if (!NgayApDung || !GiaDienPerKWh || !GiaNuocPerM3) {
        throw new Error(
          "NgayApDung, GiaDienPerKWh và GiaNuocPerM3 là bắt buộc"
        );
      }

      if (GiaDienPerKWh < 0 || GiaNuocPerM3 < 0) {
        throw new Error("Giá điện và giá nước phải lớn hơn hoặc bằng 0");
      }

      // Kiểm tra ngày áp dụng hợp lệ
      await this.validateDateRange(NgayApDung);

      // Lấy tất cả đơn giá hiện tại để phân tích timeline
      const allDonGia = await DonGiaDienNuoc.findAll({
        order: [["NgayApDung", "ASC"]],
        transaction,
      });

      // Xử lý logic timeline phức tạp
      await this.updateTimelineForNewDonGia(
        NgayApDung,
        allDonGia,
        maNhanVien,
        transaction
      );

      // Tạo đơn giá mới
      const newDonGia = await DonGiaDienNuoc.create(
        {
          NgayApDung,
          GiaDienPerKWh: parseFloat(GiaDienPerKWh),
          GiaNuocPerM3: parseFloat(GiaNuocPerM3),
          NgayKetThuc: null, // Sẽ được xác định trong updateTimelineForNewDonGia
          NguoiTao: maNhanVien,
          NgayTao: new Date(),
          NgayCapNhat: new Date(),
          NguoiCapNhat: maNhanVien,
        },
        { transaction }
      );

      // Cập nhật NgayKetThuc cho đơn giá mới dựa trên timeline
      const nextDonGia = allDonGia.find((dg) => dg.NgayApDung > NgayApDung);
      if (nextDonGia) {
        const ngayKetThuc = new Date(nextDonGia.NgayApDung);
        ngayKetThuc.setDate(ngayKetThuc.getDate() - 1);
        await newDonGia.update(
          {
            NgayKetThuc: ngayKetThuc.toISOString().split("T")[0],
          },
          { transaction }
        );
      }

      await transaction.commit();
      return newDonGia;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  // Helper function để cập nhật timeline khi thêm đơn giá mới
  async updateTimelineForNewDonGia(
    newNgayApDung,
    allDonGia,
    maNhanVien,
    transaction
  ) {
    // Tìm đơn giá trước đó (gần nhất với newNgayApDung)
    const previousDonGia = allDonGia
      .filter((dg) => dg.NgayApDung < newNgayApDung)
      .sort((a, b) => new Date(b.NgayApDung) - new Date(a.NgayApDung))[0];

    // Tìm đơn giá sau đó (gần nhất với newNgayApDung)
    const nextDonGia = allDonGia
      .filter((dg) => dg.NgayApDung > newNgayApDung)
      .sort((a, b) => new Date(a.NgayApDung) - new Date(b.NgayApDung))[0];

    // Cập nhật đơn giá trước đó (nếu có)
    if (previousDonGia) {
      const ngayKetThucMoi = new Date(newNgayApDung);
      ngayKetThucMoi.setDate(ngayKetThucMoi.getDate() - 1);

      await previousDonGia.update(
        {
          NgayKetThuc: ngayKetThucMoi.toISOString().split("T")[0],
          NgayCapNhat: new Date(),
          NguoiCapNhat: maNhanVien,
        },
        { transaction }
      );
    }

    // Cập nhật tất cả đơn giá từ newNgayApDung trở về sau để đảm bảo NgayKetThuc = null chỉ có ở đơn giá cuối cùng
    const laterDonGia = allDonGia.filter(
      (dg) => dg.NgayApDung >= newNgayApDung
    );

    for (let i = 0; i < laterDonGia.length; i++) {
      const currentDg = laterDonGia[i];
      const nextDg = laterDonGia[i + 1];

      if (nextDg) {
        // Có đơn giá tiếp theo, set NgayKetThuc
        const ngayKetThuc = new Date(nextDg.NgayApDung);
        ngayKetThuc.setDate(ngayKetThuc.getDate() - 1);

        await currentDg.update(
          {
            NgayKetThuc: ngayKetThuc.toISOString().split("T")[0],
            NgayCapNhat: new Date(),
            NguoiCapNhat: maNhanVien,
          },
          { transaction }
        );
      } else {
        // Đơn giá cuối cùng, set NgayKetThuc = null
        await currentDg.update(
          {
            NgayKetThuc: null,
            NgayCapNhat: new Date(),
            NguoiCapNhat: maNhanVien,
          },
          { transaction }
        );
      }
    }
  },

  // Kiểm tra điều kiện cho phép chỉnh sửa
  async canEditDonGia(maDonGia) {
    const donGia = await this.getDonGiaById(maDonGia);
    const currentDate = new Date().toISOString().split("T")[0];

    // Logic chỉnh sửa:
    // 1. NgayApDung chưa đến (trong tương lai)
    // 2. HOẶC là đơn giá hiện hành (NgayKetThuc = null) và chưa có đơn giá mới hơn
    let canEdit = false;
    let reason = "";

    if (donGia.NgayApDung > currentDate) {
      // Trường hợp 1: Ngày áp dụng chưa đến
      canEdit = true;
    } else if (donGia.NgayKetThuc === null) {
      // Trường hợp 2: Đơn giá hiện hành - kiểm tra có đơn giá mới hơn không
      const newerDonGia = await DonGiaDienNuoc.findOne({
        where: {
          NgayApDung: { [Op.gt]: donGia.NgayApDung },
        },
      });

      if (!newerDonGia) {
        canEdit = true;
      } else {
        reason = "Không thể sửa đơn giá hiện hành vì đã có đơn giá mới hơn";
      }
    } else {
      reason = "Không thể sửa đơn giá đã kết thúc";
    }

    return { canEdit, donGia, reason };
  },

  // Cập nhật đơn giá
  async updateDonGia(maDonGia, updateData, maNhanVien) {
    const transaction = await sequelize.transaction();

    try {
      const { canEdit, donGia, reason } = await this.canEditDonGia(maDonGia);

      if (!canEdit) {
        throw new Error(reason || "Không thể chỉnh sửa đơn giá này");
      }

      // Validate dữ liệu cập nhật
      if (
        updateData.GiaDienPerKWh !== undefined &&
        updateData.GiaDienPerKWh < 0
      ) {
        throw new Error("Giá điện phải lớn hơn hoặc bằng 0");
      }

      if (
        updateData.GiaNuocPerM3 !== undefined &&
        updateData.GiaNuocPerM3 < 0
      ) {
        throw new Error("Giá nước phải lớn hơn hoặc bằng 0");
      }

      // Nếu có thay đổi NgayApDung, kiểm tra hợp lệ
      if (
        updateData.NgayApDung &&
        updateData.NgayApDung !== donGia.NgayApDung
      ) {
        await this.validateDateRange(updateData.NgayApDung, maDonGia);

        // Nếu thay đổi NgayApDung, cần cập nhật lại NgayKetThuc của đơn giá trước đó
        await this.updatePreviousDonGiaEndDate(
          updateData.NgayApDung,
          donGia.NgayApDung,
          transaction
        );
      }

      // Chuẩn bị dữ liệu cập nhật
      const dataToUpdate = {
        NgayCapNhat: new Date(),
        NguoiCapNhat: maNhanVien,
      };

      // Chỉ cập nhật các field được phép
      if (updateData.NgayApDung)
        dataToUpdate.NgayApDung = updateData.NgayApDung;
      if (updateData.GiaDienPerKWh !== undefined)
        dataToUpdate.GiaDienPerKWh = parseFloat(updateData.GiaDienPerKWh);
      if (updateData.GiaNuocPerM3 !== undefined)
        dataToUpdate.GiaNuocPerM3 = parseFloat(updateData.GiaNuocPerM3);

      // Cập nhật đơn giá
      const updatedDonGia = await donGia.update(dataToUpdate, { transaction });

      await transaction.commit();
      return updatedDonGia;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  // Helper function để cập nhật NgayKetThuc của đơn giá trước đó khi thay đổi NgayApDung
  async updatePreviousDonGiaEndDate(newNgayApDung, oldNgayApDung, transaction) {
    // Tìm đơn giá trước đó (có NgayApDung < newNgayApDung và NgayKetThuc = oldNgayApDung - 1)
    const previousDonGia = await DonGiaDienNuoc.findOne({
      where: {
        NgayApDung: { [Op.lt]: newNgayApDung },
        NgayKetThuc: {
          [Op.eq]: new Date(
            new Date(oldNgayApDung).setDate(
              new Date(oldNgayApDung).getDate() - 1
            )
          )
            .toISOString()
            .split("T")[0],
        },
      },
      order: [["NgayApDung", "DESC"]],
      transaction,
    });

    if (previousDonGia) {
      // Cập nhật NgayKetThuc = newNgayApDung - 1
      const newEndDate = new Date(newNgayApDung);
      newEndDate.setDate(newEndDate.getDate() - 1);

      await previousDonGia.update(
        {
          NgayKetThuc: newEndDate.toISOString().split("T")[0],
          NgayCapNhat: new Date(),
        },
        { transaction }
      );
    }
  },

  // Kiểm tra có thể xóa không
  async canDeleteDonGia(maDonGia) {
    const donGia = await this.getDonGiaById(maDonGia);

    // Logic kiểm tra:
    // 1. Không được xóa đơn giá hiện hành (NgayKetThuc = null)
    if (donGia.NgayKetThuc === null) {
      return { canDelete: false, reason: "Không thể xóa đơn giá hiện hành" };
    }

    // 2. Kiểm tra xem có ChiTietDienNuoc nào được tính toán trong khoảng thời gian của đơn giá này không
    // Vì ChiTietDienNuoc được tính dựa trên ChiSoDienNuoc và thời gian áp dụng đơn giá
    const { ChiSoDienNuoc } = require("../models");

    // Tìm các ChiSoDienNuoc trong khoảng thời gian áp dụng của đơn giá
    const startDate = donGia.NgayApDung;
    const endDate = donGia.NgayKetThuc;

    // Kiểm tra xem có ChiSoDienNuoc nào trong khoảng thời gian áp dụng của đơn giá không
    const allChiSo = await ChiSoDienNuoc.findAll();
    const relatedChiSo = allChiSo.find((chiSo) =>
      isThangNamInRange(chiSo.ThangNam, startDate, endDate)
    );

    if (relatedChiSo) {
      return {
        canDelete: false,
        reason:
          "Không thể xóa đơn giá đã được sử dụng để tính toán chi tiết điện nước",
      };
    }

    return { canDelete: true };
  },

  // Xóa đơn giá
  async deleteDonGia(maDonGia) {
    const donGia = await this.getDonGiaById(maDonGia);

    const { canDelete, reason } = await this.canDeleteDonGia(maDonGia);
    if (!canDelete) {
      throw new Error(reason);
    }

    await donGia.destroy();
    return { message: "Xóa đơn giá thành công" };
  },

  // Kiểm tra các bản ghi liên quan
  async checkRelatedRecords(maDonGia) {
    const donGia = await this.getDonGiaById(maDonGia);
    const { ChiSoDienNuoc } = require("../models");

    // Tìm các ChiSoDienNuoc trong khoảng thời gian áp dụng của đơn giá
    const startDate = donGia.NgayApDung;
    const endDate = donGia.NgayKetThuc;

    // Lấy tất cả ChiSoDienNuoc và filter theo khoảng thời gian
    const allChiSo = await ChiSoDienNuoc.findAll();
    const relatedChiSo = allChiSo
      .filter((chiSo) => isThangNamInRange(chiSo.ThangNam, startDate, endDate))
      .slice(0, 5);

    const totalCount = allChiSo.filter((chiSo) =>
      isThangNamInRange(chiSo.ThangNam, startDate, endDate)
    ).length;

    return {
      hasRelatedRecords: relatedChiSo.length > 0,
      relatedRecords: relatedChiSo,
      totalCount,
    };
  },
};

module.exports = donGiaDienNuocService;
