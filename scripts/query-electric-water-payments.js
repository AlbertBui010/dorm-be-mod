const { Sequelize, Op } = require("sequelize");
const dbConfig = require("../src/config/database");
const { ThanhToan, SinhVien } = require("../src/models");
const { PAYMENT_TYPE } = require("../src/constants/payment");

async function queryElectricWaterPayments(maPhong, thangNam) {
  const sequelize = new Sequelize(dbConfig);
  await sequelize.authenticate();

  const payments = await ThanhToan.findAll({
    where: {
      MaPhong: maPhong,
      ThangNam: thangNam,
      LoaiThanhToan: PAYMENT_TYPE.DIEN_NUOC,
    },
    include: [
      {
        model: SinhVien,
        as: "SinhVien",
        attributes: ["MaSinhVien", "HoTen"],
      },
    ],
    order: [["MaSinhVien", "ASC"]],
  });

  if (!payments.length) {
    console.log("Không có khoản thanh toán điện nước nào cho phòng/tháng này.");
    process.exit(0);
  }

  console.log(
    `Danh sách thanh toán điện nước cho phòng ${maPhong}, tháng ${thangNam}:`
  );
  payments.forEach((p) => {
    console.log(
      `- ${p.SinhVien?.HoTen || p.MaSinhVien}: ${p.SoTien} VND, trạng thái: ${
        p.TrangThai
      }`
    );
  });
  process.exit(0);
}

// node scripts/query-electric-water-payments.js <MaPhong> <ThangNam>
if (require.main === module) {
  const [, , maPhong, thangNam] = process.argv;
  if (!maPhong || !thangNam) {
    console.log(
      "Cách dùng: node scripts/query-electric-water-payments.js <MaPhong> <ThangNam>"
    );
    process.exit(1);
  }
  queryElectricWaterPayments(maPhong, thangNam);
}
