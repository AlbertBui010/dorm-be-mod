#!/usr/bin/env node

/**
 * Script seed tài khoản Quản trị viên
 * Tạo 1 tài khoản có role QuanTriVien với thông tin mặc định
 *
 * Cách sử dụng:
 * node scripts/seed-admin.js
 */

require("dotenv").config();
const bcrypt = require("bcryptjs");
const { sequelize } = require("../src/models");
const NhanVien = require("../src/models/NhanVien");
const {
  NHAN_VIEN_TRANG_THAI,
  NHAN_VIEN_VAI_TRO,
} = require("../src/constants/nhanVien");

const seedAdmin = async () => {
  try {
    console.log("🔐 Starting admin account seeding...");

    // Kết nối database
    await sequelize.authenticate();
    console.log("✅ Database connection established.");

    // Sync models (không force để không mất dữ liệu)
    await sequelize.sync({ alter: true });
    console.log("✅ Database synchronized.");

    // Mật khẩu mặc định
    const defaultPassword = "admin123456";
    const hashedPassword = await bcrypt.hash(defaultPassword, 12);

    // Thông tin tài khoản admin
    const adminAccount = {
      TenDangNhap: "admin",
      MatKhau: hashedPassword,
      HoTen: "Quản Trị Viên",
      Email: "admin@stu.edu.vn",
      SoDienThoai: "0123456789",
      VaiTro: NHAN_VIEN_VAI_TRO.QUAN_TRI_VIEN,
      TrangThai: NHAN_VIEN_TRANG_THAI.HOAT_DONG,
      NguoiTao: "SYSTEM",
      NguoiCapNhat: "SYSTEM",
    };

    // Tạo hoặc cập nhật tài khoản admin
    const [admin, created] = await NhanVien.findOrCreate({
      where: { TenDangNhap: adminAccount.TenDangNhap },
      defaults: adminAccount,
    });

    if (created) {
      console.log("✅ Tạo tài khoản admin thành công!");
    } else {
      // Cập nhật thông tin nếu tài khoản đã tồn tại
      await admin.update({
        MatKhau: hashedPassword,
        HoTen: adminAccount.HoTen,
        Email: adminAccount.Email,
        SoDienThoai: adminAccount.SoDienThoai,
        VaiTro: adminAccount.VaiTro,
        TrangThai: adminAccount.TrangThai,
        NguoiCapNhat: "SYSTEM",
        NgayCapNhat: new Date(),
      });
      console.log("✅ Cập nhật tài khoản admin thành công!");
    }

    console.log("\n🎉 HOÀN THÀNH!");
    console.log("=====================================");
    console.log("📋 THÔNG TIN TÀI KHOẢN QUẢN TRỊ VIÊN");
    console.log("=====================================");
    console.log(`👤 Tên đăng nhập: ${adminAccount.TenDangNhap}`);
    console.log(`📧 Email: ${adminAccount.Email}`);
    console.log(`🔑 Mật khẩu: ${defaultPassword}`);
    console.log(`👔 Vai trò: ${adminAccount.VaiTro}`);
    console.log(`📱 Số điện thoại: ${adminAccount.SoDienThoai}`);
    console.log(`✅ Trạng thái: ${adminAccount.TrangThai}`);
    console.log("=====================================");
    console.log("📝 GHI CHÚ:");
    console.log("• Có thể đăng nhập bằng tên đăng nhập HOẶC email");
    console.log("• QuanTriVien có toàn quyền trên hệ thống");
    console.log("• Hãy đổi mật khẩu sau lần đăng nhập đầu tiên");
    console.log("=====================================");
  } catch (error) {
    console.error("❌ Lỗi khi tạo tài khoản admin:", error);
    console.error("Chi tiết:", error.message);
    process.exit(1);
  } finally {
    await sequelize.close();
    console.log("\n🔌 Database connection closed.");
  }
};

// Xử lý Ctrl+C
process.on("SIGINT", async () => {
  console.log("\n\n❌ Đã hủy bỏ thao tác");
  await sequelize.close();
  process.exit(0);
});

// Chạy script
seedAdmin();
