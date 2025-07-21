require("dotenv").config();
const bcrypt = require("bcryptjs");
const { sequelize } = require("../src/models");
const NhanVien = require("../src/models/NhanVien");
const SinhVien = require("../src/models/SinhVien");

const seedData = async () => {
  try {
    console.log("🌱 Starting database seeding...");

    // Connect to database
    await sequelize.authenticate();
    console.log("✅ Database connection established.");

    // Sync models
    await sequelize.sync({ alter: true });
    console.log("✅ Database synchronized.");

    // Hash password
    const password = "123456";
    const hashedPassword = await bcrypt.hash(password, 12);

    // Seed Nhân viên (Employees)
    const employees = [
      {
        TenDangNhap: "admin",
        MatKhau: hashedPassword,
        HoTen: "Nguyễn Văn Admin",
        Email: "admin@stu.edu.vn",
        SoDienThoai: "0123456789",
        VaiTro: "QuanTriVien",
        TrangThai: "HoatDong",
        NguoiTao: "SYSTEM",
        NguoiCapNhat: "SYSTEM",
      },
      {
        TenDangNhap: "staff1",
        MatKhau: hashedPassword,
        HoTen: "Lê Văn Nhân Viên",
        Email: "staff1@stu.edu.vn",
        SoDienThoai: "0369852147",
        VaiTro: "NhanVien",
        TrangThai: "HoatDong",
        NguoiTao: "SYSTEM",
        NguoiCapNhat: "SYSTEM",
      },
      {
        TenDangNhap: "staff2",
        MatKhau: hashedPassword,
        HoTen: "Trần Thị Nhân Viên",
        Email: "staff2@stu.edu.vn",
        SoDienThoai: "0369852148",
        VaiTro: "NhanVien",
        TrangThai: "HoatDong",
        NguoiTao: "SYSTEM",
        NguoiCapNhat: "SYSTEM",
      },
    ];

    // Insert employees
    for (const employee of employees) {
      const [user, created] = await NhanVien.findOrCreate({
        where: { TenDangNhap: employee.TenDangNhap },
        defaults: employee,
      });
      if (created) {
        console.log(`✅ Created employee: ${employee.TenDangNhap}`);
      } else {
        console.log(`ℹ️  Employee already exists: ${employee.TenDangNhap}`);
      }
    }

    // Seed Sinh viên (Students)
    const students = [
      {
        MaSinhVien: "SV001",
        HoTen: "Nguyễn Văn An",
        NgaySinh: "2000-01-15",
        GioiTinh: "Nam",
        SoDienThoai: "0123456001",
        Email: "nguyenvanan@student.stu.edu.vn",
        EmailDaXacThuc: true,
        MatKhau: hashedPassword,
        NguoiTao: "SYSTEM",
        NguoiCapNhat: "SYSTEM",
      },
      {
        MaSinhVien: "SV002",
        HoTen: "Trần Thị Bình",
        NgaySinh: "2001-03-20",
        GioiTinh: "Nữ",
        SoDienThoai: "0123456002",
        Email: "tranthibinh@student.stu.edu.vn",
        EmailDaXacThuc: true,
        MatKhau: hashedPassword,
        NguoiTao: "SYSTEM",
        NguoiCapNhat: "SYSTEM",
      },
      {
        MaSinhVien: "SV003",
        HoTen: "Lê Văn Cường",
        NgaySinh: "1999-12-10",
        GioiTinh: "Nam",
        SoDienThoai: "0123456003",
        Email: "levancuong@student.stu.edu.vn",
        EmailDaXacThuc: true,
        MatKhau: hashedPassword,
        NguoiTao: "SYSTEM",
        NguoiCapNhat: "SYSTEM",
      },
      {
        MaSinhVien: "SV004",
        HoTen: "Phạm Thị Dung",
        NgaySinh: "2000-08-25",
        GioiTinh: "Nữ",
        SoDienThoai: "0123456004",
        Email: "phamthidung@student.stu.edu.vn",
        EmailDaXacThuc: false, // Chưa xác thực email
        MatKhau: hashedPassword,
        NguoiTao: "SYSTEM",
        NguoiCapNhat: "SYSTEM",
      },
    ];

    // Insert students
    for (const student of students) {
      const [user, created] = await SinhVien.findOrCreate({
        where: { MaSinhVien: student.MaSinhVien },
        defaults: student,
      });
      if (created) {
        console.log(`✅ Created student: ${student.MaSinhVien}`);
      } else {
        console.log(`ℹ️  Student already exists: ${student.MaSinhVien}`);
      }
    }

    console.log("\n🎉 Seeding completed successfully!");
    console.log("\n📋 TEST ACCOUNTS:");
    console.log("=====================================");
    console.log("🔑 Default Password: 123456");
    console.log("=====================================");
    console.log("\n👥 NHÂN VIÊN (Employees):");
    console.log(
      "• Username: admin | Email: admin@stu.edu.vn | Role: QuanTriVien (Full access + Employee management)"
    );
    console.log(
      "• Username: staff1 | Email: staff1@stu.edu.vn | Role: NhanVien (Full access except employee management)"
    );
    console.log(
      "• Username: staff2 | Email: staff2@stu.edu.vn | Role: NhanVien (Full access except employee management)"
    );

    console.log("\n🎓 SINH VIÊN (Students):");
    console.log(
      "• Email: nguyenvanan@student.stu.edu.vn | MaSV: SV001 | Verified ✅"
    );
    console.log(
      "• Email: tranthibinh@student.stu.edu.vn | MaSV: SV002 | Verified ✅"
    );
    console.log(
      "• Email: levancuong@student.stu.edu.vn | MaSV: SV003 | Verified ✅"
    );
    console.log(
      "• Email: phamthidung@student.stu.edu.vn | MaSV: SV004 | Not Verified ❌"
    );

    console.log("\n📝 LOGIN NOTES:");
    console.log("• Nhân viên: Use username OR email + password");
    console.log("• Sinh viên: Use email + password (must be verified)");
    console.log("• SV004 cannot login (EmailDaXacThuc = false)");
    console.log("\n�� PERMISSION CHANGES:");
    console.log("• QuanTriVien: Full access + Employee management");
    console.log("• NhanVien: Full access except employee management");
    console.log("• Removed QuanLy role");
  } catch (error) {
    console.error("❌ Seeding failed:", error);
  } finally {
    await sequelize.close();
    console.log("\n🔌 Database connection closed.");
    process.exit(0);
  }
};

// Run seeding
seedData();
