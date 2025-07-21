const {
  ChiSoDienNuoc,
  DonGiaDienNuoc,
  LichSuOPhong,
  ThanhToan,
} = require("../models");
const { Op } = require("sequelize");
const { PAYMENT_TYPE, PAYMENT_STATUS } = require("../constants/payment");
const { SYSTEM_USER } = require("../constants/system");

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
    const chiSo = await ChiSoDienNuoc.create({
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

    // Sau khi tạo chỉ số, tự động tính toán và tạo thanh toán điện nước cho từng sinh viên
    await this._autoCreateElectricWaterPayments(chiSo);
    return chiSo;
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
   */
  async _autoCreateElectricWaterPayments(chiSo) {
    // 1. Lấy đơn giá điện nước hiện hành (áp dụng theo ngày tạo chỉ số hoặc mới nhất)
    const donGia = await DonGiaDienNuoc.findOne({
      where: {},
      order: [["NgayApDung", "DESC"]],
    });
    if (!donGia) return;

    // 2. Tính số điện/nước tiêu thụ và tổng tiền
    const soDien = chiSo.SoDienMoi - chiSo.SoDienCu;
    const soNuoc = chiSo.SoNuocMoi - chiSo.SoNuocCu;
    const tienDien = soDien * parseFloat(donGia.GiaDienPerKWh);
    const tienNuoc = soNuoc * parseFloat(donGia.GiaNuocPerM3);
    const tongTien = tienDien + tienNuoc;
    if (tongTien <= 0) return;

    // 3. Xác định khoảng thời gian tháng
    const [year, month] = chiSo.ThangNam.split("-").map(Number);
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month - 1 + 1, 0); // last day of month

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
    });

    // 5. Tính số ngày ở thực tế cho từng sinh viên
    const sinhVienDays = lichSu
      .map((ls) => {
        const actualStart =
          ls.NgayBatDau > startDate ? new Date(ls.NgayBatDau) : startDate;
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
    if (finalSinhVienDays.length === 0) return;

    // 7. Tổng số ngày ở của cả phòng
    const tongSoNgayO = finalSinhVienDays.reduce(
      (sum, sv) => sum + sv.soNgayO,
      0
    );
    if (tongSoNgayO === 0) return;

    // 8. Giá tiền mỗi ngày
    const giaTienMoiNgay = tongTien / tongSoNgayO;

    // 9. Tạo bản ghi ThanhToan cho từng sinh viên
    for (const sv of finalSinhVienDays) {
      const soTien = Math.round(giaTienMoiNgay * sv.soNgayO);
      await ThanhToan.create({
        MaSinhVien: sv.MaSinhVien,
        MaPhong: chiSo.MaPhong,
        ThangNam: chiSo.ThangNam,
        SoTien: soTien,
        LoaiThanhToan: PAYMENT_TYPE.DIEN_NUOC,
        TrangThai: PAYMENT_STATUS.CHUA_THANH_TOAN,
        NguoiTao: SYSTEM_USER.SYSTEM,
        NguoiCapNhat: SYSTEM_USER.SYSTEM,
        NgayTao: new Date(),
        NgayCapNhat: new Date(),
      });
    }
  }
}

module.exports = new ChiSoDienNuocService();
