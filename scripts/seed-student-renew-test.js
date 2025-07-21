const { Sequelize } = require("sequelize");
const { SinhVien, Phong, DangKy, Giuong } = require("../src/models");
const sequelize = require("../src/config/database");
const bcrypt = require("bcryptjs");

async function seedStudentRenewTest() {
  await sequelize.authenticate();
  const t = await sequelize.transaction();
  try {
    // 1. Tạo phòng mẫu
    const soPhong = "A101";
    let phong = await Phong.findOne({
      where: { SoPhong: soPhong },
      transaction: t,
    });
    if (!phong) {
      phong = await Phong.create(
        {
          SoPhong: soPhong,
          SucChua: 4,
          LoaiPhong: "Nam",
          GiaThueThang: 1000000,
          DienTich: 20,
          TrangThai: "HoatDong",
          NgayTao: new Date(),
          NguoiTao: "seed",
        },
        { transaction: t }
      );
      // Tạo giường cho phòng
      for (let i = 1; i <= 4; i++) {
        await Giuong.create(
          {
            MaPhong: phong.MaPhong,
            SoGiuong: `G${i.toString().padStart(2, "0")}`,
            DaCoNguoi: false,
            NgayTao: new Date(),
            NguoiTao: "seed",
          },
          { transaction: t }
        );
      }
    }

    // 2. Tạo sinh viên mẫu
    const maSinhVien = "SVTEST01";
    const matKhauHash = await bcrypt.hash("123456", 10);
    let sv = await SinhVien.findByPk(maSinhVien, { transaction: t });
    if (!sv) {
      sv = await SinhVien.create(
        {
          MaSinhVien: maSinhVien,
          HoTen: "Nguyen Van Test",
          NgaySinh: "2002-01-01",
          GioiTinh: "Nam",
          SoDienThoai: "0900000001",
          Email: "teststudent@example.com",
          EmailDaXacThuc: true,
          MatKhau: matKhauHash,
          TrangThai: "HoatDong",
          NgayTao: new Date(),
          NguoiTao: "seed",
        },
        { transaction: t }
      );
    } else {
      // Update mật khẩu nếu đã tồn tại
      await sv.update({ MatKhau: matKhauHash }, { transaction: t });
    }

    // 3. Gán sinh viên vào giường đầu tiên còn trống
    let giuong = await Giuong.findOne({
      where: { MaPhong: phong.MaPhong, DaCoNguoi: false },
      transaction: t,
    });
    if (giuong) {
      await giuong.update(
        {
          DaCoNguoi: true,
          MaSinhVienChiEm: maSinhVien,
          NgayCapNhat: new Date(),
          NguoiCapNhat: "seed",
        },
        { transaction: t }
      );
    }

    // 4. Tạo hợp đồng đã duyệt, sắp hết hạn
    const today = new Date();
    const endDate = new Date(today);
    endDate.setDate(today.getDate() + 3); // Hết hạn sau 3 ngày
    await DangKy.create(
      {
        MaSinhVien: maSinhVien,
        MaPhong: phong.MaPhong,
        MaGiuong: giuong ? giuong.MaGiuong : null,
        NgayDangKy: today,
        NgayNhanPhong: today,
        NgayKetThucHopDong: endDate,
        TrangThai: "DA_DUYET",
        NgayTao: today,
        NguoiTao: "seed",
      },
      { transaction: t }
    );

    await t.commit();
    console.log("✅ Seed dữ liệu test gia hạn hợp đồng thành công!");
    console.log("Tài khoản sinh viên: teststudent@example.com hoặc SVTEST01");
    console.log("Mật khẩu: 123456");
    process.exit(0);
  } catch (err) {
    await t.rollback();
    console.error("❌ Lỗi seed dữ liệu:", err);
    process.exit(1);
  }
}

seedStudentRenewTest();
