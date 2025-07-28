const { Sequelize, Op } = require("sequelize");
const dbConfig = require("../src/config/database");
const {
  ChiSoDienNuoc,
  DonGiaDienNuoc,
  LichSuOPhong,
  ThanhToan,
  Phong,
} = require("../src/models");

function getLastDayOfMonth(year, month) {
  return new Date(year, month, 0).getDate();
}

async function calculateAndCreatePayments(maPhong, thangNam) {
  // 1. Kết nối DB
  const sequelize = new Sequelize(dbConfig);
  await sequelize.authenticate();
  console.log("Kết nối database thành công!");

  // 2. Lấy chỉ số điện nước của phòng/tháng
  const chiSo = await ChiSoDienNuoc.findOne({
    where: { MaPhong: maPhong, ThangNam: thangNam },
  });
  if (!chiSo) {
    console.log("Không tìm thấy chỉ số điện nước cho phòng/tháng này.");
    process.exit(1);
  }

  // 3. Lấy đơn giá hiện hành (giả sử lấy theo thời điểm ThangNam)
  const donGia = await DonGiaDienNuoc.findOne({
    where: {},
    order: [["createdAt", "DESC"]],
  });
  if (!donGia) {
    console.log("Không tìm thấy đơn giá điện nước.");
    process.exit(1);
  }

  // 4. Tính số điện/nước tiêu thụ
  const soDien = chiSo.SoDienMoi - chiSo.SoDienCu;
  const soNuoc = chiSo.SoNuocMoi - chiSo.SoNuocCu;
  const tienDien = soDien * donGia.DonGiaDien;
  const tienNuoc = soNuoc * donGia.DonGiaNuoc;
  const tongTien = tienDien + tienNuoc;

  // 5. Xác định khoảng thời gian tháng (format MM/YYYY)
  const [month, year] = thangNam.split("/").map(Number);
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month - 1, getLastDayOfMonth(year, month));

  // 6. Lấy lịch sử ở phòng trong tháng
  const lichSu = await LichSuOPhong.findAll({
    where: {
      MaPhong: maPhong,
      NgayVao: { [Op.lte]: endDate },
      [Op.or]: [{ NgayRa: { [Op.gte]: startDate } }, { NgayRa: null }],
    },
  });

  // 7. Tính số ngày ở thực tế cho từng sinh viên
  const sinhVienDays = lichSu
    .map((ls) => {
      const actualStart = ls.NgayVao > startDate ? ls.NgayVao : startDate;
      const actualEnd = ls.NgayRa && ls.NgayRa < endDate ? ls.NgayRa : endDate;
      const soNgayO =
        Math.floor((actualEnd - actualStart) / (1000 * 60 * 60 * 24)) + 1;
      return {
        MaSinhVien: ls.MaSinhVien,
        soNgayO: soNgayO > 0 ? soNgayO : 0,
      };
    })
    .filter((sv) => sv.soNgayO > 0);

  // 8. Cộng dồn số ngày ở nếu sinh viên có nhiều lần chuyển phòng trong tháng
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
    console.log("Không có sinh viên nào ở phòng này trong tháng này.");
    process.exit(0);
  }

  // 9. Tổng số ngày ở của cả phòng
  const tongSoNgayO = finalSinhVienDays.reduce(
    (sum, sv) => sum + sv.soNgayO,
    0
  );
  if (tongSoNgayO === 0) {
    console.log("Tổng số ngày ở bằng 0. Không tạo thanh toán.");
    process.exit(0);
  }

  // 10. Giá tiền mỗi ngày
  const giaTienMoiNgay = tongTien / tongSoNgayO;

  // 11. Tạo bản ghi ThanhToan cho từng sinh viên
  for (const sv of finalSinhVienDays) {
    const soTien = Math.round(giaTienMoiNgay * sv.soNgayO);

    // Kiểm tra trùng lặp hóa đơn điện nước
    const existed = await ThanhToan.findOne({
      where: {
        MaSinhVien: sv.MaSinhVien,
        MaPhong: maPhong,
        ThangNam: thangNam,
        LoaiThanhToan: "TIEN_DIEN_NUOC",
      },
    });
    if (existed) {
      console.log(
        `Đã tồn tại hóa đơn điện nước cho sinh viên ${sv.MaSinhVien} tháng ${thangNam}, bỏ qua.`
      );
      continue;
    }

    // Tạo hóa đơn mới
    await ThanhToan.create({
      MaSinhVien: sv.MaSinhVien,
      MaPhong: maPhong,
      ThangNam: thangNam,
      SoTien: soTien,
      LoaiThanhToan: "TIEN_DIEN_NUOC",
      TrangThai: "CHUA_THANH_TOAN",
      NguoiTao: "he-thong",
      NguoiCapNhat: "he-thong",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    console.log(
      `Đã tạo hóa đơn điện nước cho sinh viên ${sv.MaSinhVien}: ${soTien} VND (${sv.soNgayO} ngày)`
    );
  }

  console.log("Hoàn tất tạo thanh toán điện nước cho phòng/tháng này!");
  process.exit(0);
}

// Ví dụ chạy: node scripts/calculate-electric-water-payments.js A101 2024-06
if (require.main === module) {
  const [, , maPhong, thangNam] = process.argv;
  if (!maPhong || !thangNam) {
    console.log(
      "Cách dùng: node scripts/calculate-electric-water-payments.js <MaPhong> <ThangNam>"
    );
    process.exit(1);
  }
  calculateAndCreatePayments(maPhong, thangNam);
}
