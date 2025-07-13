/**
 * Test script để kiểm tra API tính toán ngày kết thúc hợp đồng
 * Node.js script để test các endpoint và logic date calculation
 */

const axios = require("axios");

const API_BASE_URL = "http://localhost:3000/api";

// Test data
const testCases = [
  {
    description: "Test ngày hôm nay (hợp lệ)",
    ngayNhanPhong: new Date().toISOString().split("T")[0],
  },
  {
    description: "Test ngày mai (hợp lệ)",
    ngayNhanPhong: new Date(Date.now() + 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0],
  },
  {
    description: "Test ngày 3 ngày sau (hợp lệ)",
    ngayNhanPhong: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0],
  },
  {
    description: "Test ngày quá khứ (không hợp lệ)",
    ngayNhanPhong: new Date(Date.now() - 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0],
  },
  {
    description: "Test ngày 4 ngày sau (không hợp lệ)",
    ngayNhanPhong: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0],
  },
  {
    description: "Test ngày trong tháng 9 (Học kỳ 1)",
    ngayNhanPhong: "2024-09-15",
  },
  {
    description: "Test ngày trong tháng 2 (Học kỳ 2)",
    ngayNhanPhong: "2025-02-15",
  },
  {
    description: "Test ngày trong tháng 6 (Học kỳ hè)",
    ngayNhanPhong: "2024-06-15",
  },
];

async function testCalculateEndDate() {
  console.log("🧪 Testing Calculate End Date API...\n");

  for (const testCase of testCases) {
    try {
      console.log(`📅 ${testCase.description}`);
      console.log(`   Ngày nhận phòng: ${testCase.ngayNhanPhong}`);

      const response = await axios.post(
        `${API_BASE_URL}/registration/calculate-end-date`,
        {
          ngayNhanPhong: testCase.ngayNhanPhong,
        }
      );

      if (response.data.success) {
        console.log(`   ✅ Thành công:`);
        console.log(
          `      Ngày tính tiền phòng dự kiến: ${
            response.data.data.ngayTinhTienPhongDuKien ||
            response.data.data.ngayKetThucHopDong
          }`
        );
        if (response.data.data.thongTinTinhToan) {
          const info = response.data.data.thongTinTinhToan;
          console.log(
            `      Ghi chú: ${info.calculation || "Tính toán theo quý"}`
          );
        }
      } else {
        console.log(`   ❌ Thất bại: ${response.data.message}`);
      }
    } catch (error) {
      if (error.response && error.response.data) {
        console.log(`   ❌ Lỗi: ${error.response.data.message}`);
        if (error.response.data.errors) {
          console.log(
            `      Chi tiết: ${error.response.data.errors.join(", ")}`
          );
        }
      } else {
        console.log(`   ❌ Lỗi kết nối: ${error.message}`);
      }
    }
    console.log("");
  }
}

async function testCompleteRegistration() {
  console.log("🧪 Testing Complete Registration Flow...\n");

  const registrationData = {
    email: `test.${Date.now()}@student.stu.edu.vn`,
    hoTen: "Nguyễn Test User",
    ngaySinh: "2000-01-15",
    gioiTinh: "Nam",
    soDienThoai: "0987654321",
    maSinhVien: `DH${Math.floor(Math.random() * 100000000)
      .toString()
      .padStart(8, "0")}`,
    ngayNhanPhong: new Date().toISOString().split("T")[0],
    nguyenVong: "Tôi muốn ở phòng 4 người, gần thư viện, yên tĩnh để học tập.",
  };

  try {
    console.log("📝 Đang test đăng ký với đầy đủ thông tin...");
    console.log(`   Email: ${registrationData.email}`);
    console.log(`   Mã SV: ${registrationData.maSinhVien}`);
    console.log(`   Ngày nhận phòng: ${registrationData.ngayNhanPhong}`);
    console.log(`   Nguyện vọng: ${registrationData.nguyenVong}`);

    const response = await axios.post(
      `${API_BASE_URL}/registration/register`,
      registrationData
    );

    if (response.data.success) {
      console.log("   ✅ Đăng ký thành công!");
      console.log(`      Mã đăng ký: ${response.data.data.maDangKy}`);
      console.log(`      Message: ${response.data.message}`);
    } else {
      console.log(`   ❌ Đăng ký thất bại: ${response.data.message}`);
    }
  } catch (error) {
    if (error.response && error.response.data) {
      console.log(`   ❌ Lỗi: ${error.response.data.message}`);
      if (error.response.data.errors) {
        console.log(`      Chi tiết: ${error.response.data.errors.join(", ")}`);
      }
    } else {
      console.log(`   ❌ Lỗi kết nối: ${error.message}`);
    }
  }
  console.log("");
}

async function runTests() {
  console.log("🚀 Starting UC7 Registration System Tests\n");
  console.log("=".repeat(60));

  await testCalculateEndDate();

  console.log("=".repeat(60));

  await testCompleteRegistration();

  console.log("✨ Tests completed!");
}

// Run tests
runTests().catch(console.error);
