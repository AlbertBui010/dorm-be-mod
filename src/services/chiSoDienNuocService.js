const {
  ChiSoDienNuoc,
  DonGiaDienNuoc,
  LichSuOPhong,
  ThanhToan,
  sequelize,
} = require("../models");
const { Op } = require("sequelize");
const { PAYMENT_TYPE, PAYMENT_STATUS } = require("../constants/payment");

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
    // Kiểm tra đơn giá điện nước mới nhất trước khi tạo chỉ số
    const donGia = await DonGiaDienNuoc.findOne({
      order: [["NgayApDung", "DESC"]],
    });
    if (!donGia)
      throw new Error(
        "Không tìm thấy đơn giá điện nước. Vui lòng nhập đơn giá trước khi nhập chỉ số điện nước!"
      );
    // Tạo mới
    const transaction = await sequelize.transaction();
    try {
      const chiSo = await ChiSoDienNuoc.create(
        {
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
        },
        { transaction }
      );

      // Sau khi tạo chỉ số, tự động tính toán và tạo thanh toán điện nước cho từng sinh viên
      await this._autoCreateElectricWaterPayments(
        chiSo,
        transaction,
        user.MaNhanVien
      );
      await transaction.commit();
      return chiSo;
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
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

  /**
   * Tự động tính toán và tạo bản ghi thanh toán điện nước cho từng sinh viên ở phòng/tháng
   * @param {ChiSoDienNuoc} chiSo
   * @param {Transaction} transaction
   */
  async _autoCreateElectricWaterPayments(chiSo, transaction, adminId) {
    try {
      // 1. Lấy đơn giá điện nước mới nhất
      const donGia = await DonGiaDienNuoc.findOne({
        order: [["NgayApDung", "DESC"]],
        transaction,
      });
      if (!donGia) {
        throw new Error("Không tìm thấy đơn giá điện nước.");
      }

      // 2. Tính số điện/nước tiêu thụ và tổng tiền
      const soDien = chiSo.SoDienMoi - chiSo.SoDienCu;
      const soNuoc = chiSo.SoNuocMoi - chiSo.SoNuocCu;
      const tienDien = soDien * parseFloat(donGia.GiaDienPerKWh);
      const tienNuoc = soNuoc * parseFloat(donGia.GiaNuocPerM3);
      const tongTien = tienDien + tienNuoc;
      if (tongTien <= 0) {
        throw new Error("Tổng tiền điện nước bằng 0, không tạo hóa đơn.");
      }

      // 3. Xác định khoảng thời gian tháng (format MM/YYYY)
      const [month, year] = chiSo.ThangNam.split("/").map(Number);
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0); // ngày cuối tháng

      // 4. Lấy lịch sử ở phòng trong tháng
      const lichSu = await LichSuOPhong.findAll({
        where: {
          MaPhong: chiSo.MaPhong,
          NgayBatDau: { [Op.lte]: endDate },
          [Op.or]: [
            { NgayKetThuc: { [Op.gte]: startDate } },
            { NgayKetThuc: null },
          ],
        },
        transaction,
      });

      // 5. Tính số ngày ở thực tế cho từng sinh viên
      const sinhVienDays = lichSu
        .map((ls) => {
          const actualStart =
            ls.NgayBatDau && new Date(ls.NgayBatDau) > startDate
              ? new Date(ls.NgayBatDau)
              : startDate;
          const actualEnd =
            ls.NgayKetThuc && new Date(ls.NgayKetThuc) < endDate
              ? new Date(ls.NgayKetThuc)
              : endDate;
          const soNgayO =
            Math.floor((actualEnd - actualStart) / (1000 * 60 * 60 * 24)) + 1;
          return {
            MaSinhVien: ls.MaSinhVien,
            soNgayO: soNgayO > 0 ? soNgayO : 0,
          };
        })
        .filter((sv) => sv.soNgayO > 0);

      // 6. Cộng dồn số ngày ở nếu sinh viên có nhiều lần chuyển phòng trong tháng
      const aggregatedSinhVienDays = {};
      sinhVienDays.forEach((sv) => {
        if (aggregatedSinhVienDays[sv.MaSinhVien]) {
          aggregatedSinhVienDays[sv.MaSinhVien].soNgayO += sv.soNgayO;
        } else {
          aggregatedSinhVienDays[sv.MaSinhVien] = { ...sv };
        }
      });
      const finalSinhVienDays = Object.values(aggregatedSinhVienDays);
      if (finalSinhVienDays.length === 0) {
        throw new Error("Không có sinh viên nào ở phòng này trong tháng này.");
      }

      // 7. Tổng số ngày ở của cả phòng
      const tongSoNgayO = finalSinhVienDays.reduce(
        (sum, sv) => sum + sv.soNgayO,
        0
      );
      if (tongSoNgayO === 0) {
        throw new Error("Tổng số ngày ở bằng 0. Không tạo hóa đơn.");
      }

      // 8. Giá tiền mỗi ngày
      const giaTienMoiNgay = tongTien / tongSoNgayO;

      // 9. Tạo bản ghi ChiTietDienNuoc và ThanhToan cho từng sinh viên
      for (const sv of finalSinhVienDays) {
        const soTien = Math.round(giaTienMoiNgay * sv.soNgayO);
        const tiendienSV = Math.round((sv.soNgayO / tongSoNgayO) * tienDien);
        const tiennuocSV = Math.round((sv.soNgayO / tongSoNgayO) * tienNuoc);

        // Tạo chi tiết điện nước cho sinh viên
        await require("../models").ChiTietDienNuoc.create(
          {
            MaChiSo: chiSo.MaChiSo,
            MaSinhVien: sv.MaSinhVien,
            SoNgayO: sv.soNgayO,
            TienDien: tiendienSV,
            TienNuoc: tiennuocSV,
            NgayTao: new Date(),
            NguoiTao: adminId,
            NgayCapNhat: new Date(),
            NguoiCapNhat: adminId,
          },
          { transaction }
        );

        // Kiểm tra trùng lặp hóa đơn điện nước
        const existed = await ThanhToan.findOne({
          where: {
            MaSinhVien: sv.MaSinhVien,
            MaPhong: chiSo.MaPhong,
            ThangNam: chiSo.ThangNam,
            LoaiThanhToan: PAYMENT_TYPE.TIEN_DIEN_NUOC,
          },
          transaction,
        });
        if (existed) {
          // Nếu đã tồn tại hóa đơn, bỏ qua, không throw lỗi
          continue;
        }

        await ThanhToan.create({
          MaSinhVien: sv.MaSinhVien,
          MaPhong: chiSo.MaPhong,
          ThangNam: chiSo.ThangNam,
          SoTien: soTien,
          LoaiThanhToan: PAYMENT_TYPE.TIEN_DIEN_NUOC,
          TrangThai: PAYMENT_STATUS.CHUA_THANH_TOAN,
          NguoiTao: adminId,
          NguoiCapNhat: adminId,
          NgayTao: new Date(),
          NgayCapNhat: new Date(),
          transaction,
        });
      }
    } catch (err) {
      // Nếu có lỗi, throw để transaction bên ngoài rollback
      throw err;
    }
    // Nếu không có lỗi, log thành công
    console.log(
      "Hoàn tất tạo hóa đơn và chi tiết điện nước cho phòng/tháng này!"
    );
  }
}

module.exports = new ChiSoDienNuocService();
