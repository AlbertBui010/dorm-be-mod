const { Sequelize } = require("sequelize");
const dbConfig = require("../src/config/database");
const {
  Phong,
  SinhVien,
  LichSuOPhong,
  DonGiaDienNuoc,
  ChiSoDienNuoc,
} = require("../src/models");

async function seed() {
  const sequelize = new Sequelize(dbConfig);
  await sequelize.authenticate();

  // 1. Seed phòng (bổ sung đủ trường required)
  await Phong.create({
    MaPhong: 101,
    SoPhong: "A101",
    LoaiPhong: "Nam",
    SucChua: 6,
    GiaThueThang: 1200000,
    SoLuongHienTai: 0,
    DienTich: 20,
    TrangThai: "Hoạt động",
    NgayTao: new Date(),
    NgayCapNhat: new Date(),
  });

  // 2. Seed sinh viên
  await SinhVien.create({
    MaSinhVien: "SV001",
    HoTen: "Nguyen Van A",
  });
  await SinhVien.create({
    MaSinhVien: "SV002",
    HoTen: "Le Thi B",
  });
  await SinhVien.create({
    MaSinhVien: "SV003",
    HoTen: "Tran Van C",
  });

  // 3. Seed lịch sử ở phòng (tháng 6/2024)
  await LichSuOPhong.bulkCreate([
    // SV001 ở cả tháng
    {
      MaSinhVien: "SV001",
      MaPhong: 101,
      NgayBatDau: "2024-06-01",
      NgayKetThuc: null,
    },
    // SV002 ở nửa đầu tháng
    {
      MaSinhVien: "SV002",
      MaPhong: 101,
      NgayBatDau: "2024-06-01",
      NgayKetThuc: "2024-06-15",
    },
    // SV003 ở nửa sau tháng
    {
      MaSinhVien: "SV003",
      MaPhong: 101,
      NgayBatDau: "2024-06-16",
      NgayKetThuc: null,
    },
  ]);

  // 4. Seed đơn giá điện nước
  await DonGiaDienNuoc.create({
    NgayApDung: "2024-01-01",
    GiaDienPerKWh: 3500,
    GiaNuocPerM3: 15000,
  });

  // 5. Seed chỉ số điện nước cho phòng/tháng
  await ChiSoDienNuoc.create({
    MaPhong: 101,
    ThangNam: "2024-06",
    SoDienCu: 1000,
    SoDienMoi: 1200,
    SoNuocCu: 500,
    SoNuocMoi: 530,
    NgayTao: new Date(),
    NguoiTao: "seed",
    NgayCapNhat: new Date(),
    NguoiCapNhat: "seed",
  });

  console.log("Đã seed dữ liệu test tính tiền điện nước!");
  process.exit(0);
}

seed();
