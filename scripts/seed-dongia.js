require("dotenv").config();
const { sequelize } = require("../src/models");
const DonGiaDienNuoc = require("../src/models/DonGiaDienNuoc");

const seedDonGia = async () => {
  try {
    console.log("🌱 Starting đơn giá seeding...");

    // Connect to database
    await sequelize.authenticate();
    console.log("✅ Database connection established.");

    // Xóa tất cả đơn giá cũ
    await DonGiaDienNuoc.destroy({ where: {} });
    console.log("🗑️  Cleared existing đơn giá records");

    // Seed Đơn giá điện nước
    const donGiaList = [
      {
        NgayApDung: "2024-01-01",
        GiaDienPerKWh: 3000,
        GiaNuocPerM3: 20000,
        NgayKetThuc: "2024-06-30",
        NguoiTao: "1", // Admin MaNhanVien
        NgayTao: new Date("2024-01-01"),
        NgayCapNhat: new Date("2024-01-01"),
        NguoiCapNhat: "1",
      },
      {
        NgayApDung: "2024-07-01",
        GiaDienPerKWh: 3200,
        GiaNuocPerM3: 22000,
        NgayKetThuc: "2024-12-31",
        NguoiTao: "1",
        NgayTao: new Date("2024-07-01"),
        NgayCapNhat: new Date("2024-07-01"),
        NguoiCapNhat: "1",
      },
      {
        NgayApDung: "2025-01-01",
        GiaDienPerKWh: 3500,
        GiaNuocPerM3: 25000,
        NgayKetThuc: null, // Đơn giá hiện hành
        NguoiTao: "1",
        NgayTao: new Date("2025-01-01"),
        NgayCapNhat: new Date("2025-01-01"),
        NguoiCapNhat: "1",
      },
    ];

    // Insert đơn giá
    for (const donGia of donGiaList) {
      const record = await DonGiaDienNuoc.create(donGia);
      console.log(
        `✅ Created đơn giá: ${donGia.NgayApDung} (ID: ${record.MaDonGia})`
      );
    }

    console.log("\n🎉 Đơn giá seeding completed successfully!");
    console.log("\n💰 ĐỞN GIÁ ĐIỆN NƯỚC (Pricing):");
    console.log("=====================================");
    console.log("• 2024-01-01 → 2024-06-30: Điện 3,000đ/kWh - Nước 20,000đ/m³");
    console.log("• 2024-07-01 → 2024-12-31: Điện 3,200đ/kWh - Nước 22,000đ/m³");
    console.log(
      "• 2025-01-01 → Hiện tại: Điện 3,500đ/kWh - Nước 25,000đ/m³ ⭐"
    );
    console.log("\n📝 NOTES:");
    console.log("• Chỉ đơn giá 2025-01-01 có NgayKetThuc = null (hiện hành)");
    console.log("• Các đơn giá cũ đã có NgayKetThuc xác định");
  } catch (error) {
    console.error("❌ Đơn giá seeding failed:", error);
  } finally {
    await sequelize.close();
    console.log("\n🔌 Database connection closed.");
    process.exit(0);
  }
};

// Run seeding
seedDonGia();
