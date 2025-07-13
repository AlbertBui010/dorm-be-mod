/**
 * Script test tính tiền phòng
 * Test function calculateRoomFee với các trường hợp khác nhau
 */

class RoomFeeCalculator {
  /**
   * Tính toán số tiền phòng theo quy tắc mới
   * Tính dựa trên ngày bắt đầu ở và ngày kết thúc ở
   * Hệ số tháng: Từ ngày 15 trở đi = 0.5, Trước ngày 15 = 1.0
   * Một quý = 3.0 (cộng tổng)
   */
  calculateRoomFee(giaThueThang, ngayBatDau, ngayKetThuc) {
    const ngayBD = new Date(ngayBatDau);
    const ngayKT = new Date(ngayKetThuc);

    let tongTien = 0;
    let chiTietTinhToan = [];

    // Tính từng tháng từ ngày bắt đầu đến ngày kết thúc
    let currentDate = new Date(ngayBD);

    while (currentDate <= ngayKT) {
      const ngayTrongThang = currentDate.getDate();
      const thang = currentDate.getMonth() + 1;
      const nam = currentDate.getFullYear();

      // Tính hệ số tháng dựa vào ngày nhận phòng trong tháng
      const heSoThang = ngayTrongThang >= 15 ? 0.5 : 1.0;

      // Tính tiền cho tháng này
      const tienThang = giaThueThang * heSoThang;
      tongTien += tienThang;

      chiTietTinhToan.push({
        thang: `${String(thang).padStart(2, "0")}/${nam}`,
        ngayTrongThang,
        heSoThang,
        tienThang: Math.round(tienThang),
        tinhToan: `${giaThueThang} × ${heSoThang} = ${tienThang}`,
      });

      // Chuyển sang tháng tiếp theo
      currentDate.setMonth(currentDate.getMonth() + 1);
      currentDate.setDate(1); // Đặt về ngày 1 của tháng tiếp theo
    }

    return {
      soTien: Math.round(tongTien),
      tongSoThang: chiTietTinhToan.length,
      giaThueThang,
      chiTiet: {
        ngayBatDau: ngayBD.toISOString().split("T")[0],
        ngayKetThuc: ngayKT.toISOString().split("T")[0],
        chiTietTheoThang: chiTietTinhToan,
        tongTien: Math.round(tongTien),
      },
    };
  }
}

// Test cases
const calculator = new RoomFeeCalculator();

console.log("🏠 SCRIPT TEST TÍNH TIỀN PHÒNG");
console.log("================================\n");

// Test case 1: Ở từ đầu tháng (hệ số 1.0)
console.log("📋 TEST CASE 1: Ở từ đầu tháng");
console.log("Ngày bắt đầu: 2025-01-01, Ngày kết thúc: 2025-03-31");
console.log("Giá thuê: 1,000,000 VNĐ/tháng");
const test1 = calculator.calculateRoomFee(1000000, "2025-01-01", "2025-03-31");
console.log("Kết quả:", JSON.stringify(test1, null, 2));
console.log("Mong đợi: 3,000,000 VNĐ (3 tháng × 1.0)\n");

// Test case 2: Ở từ giữa tháng (hệ số 0.5)
console.log("📋 TEST CASE 2: Ở từ giữa tháng (ngày 15)");
console.log("Ngày bắt đầu: 2025-01-15, Ngày kết thúc: 2025-03-31");
console.log("Giá thuê: 1,000,000 VNĐ/tháng");
const test2 = calculator.calculateRoomFee(1000000, "2025-01-15", "2025-03-31");
console.log("Kết quả:", JSON.stringify(test2, null, 2));
console.log("Mong đợi: 2,500,000 VNĐ (0.5 + 1.0 + 1.0)\n");

// Test case 3: Ở từ cuối tháng (hệ số 0.5)
console.log("📋 TEST CASE 3: Ở từ cuối tháng (ngày 20)");
console.log("Ngày bắt đầu: 2025-01-20, Ngày kết thúc: 2025-02-28");
console.log("Giá thuê: 2,000,000 VNĐ/tháng");
const test3 = calculator.calculateRoomFee(2000000, "2025-01-20", "2025-02-28");
console.log("Kết quả:", JSON.stringify(test3, null, 2));
console.log("Mong đợi: 3,000,000 VNĐ (0.5 + 1.0)\n");

// Test case 4: Ở chỉ 1 tháng từ ngày 1
console.log("📋 TEST CASE 4: Ở chỉ 1 tháng từ ngày 1");
console.log("Ngày bắt đầu: 2025-07-01, Ngày kết thúc: 2025-07-31");
console.log("Giá thuê: 1,500,000 VNĐ/tháng");
const test4 = calculator.calculateRoomFee(1500000, "2025-07-01", "2025-07-31");
console.log("Kết quả:", JSON.stringify(test4, null, 2));
console.log("Mong đợi: 1,500,000 VNĐ (1 tháng × 1.0)\n");

// Test case 5: Ở chỉ 1 tháng từ ngày 15
console.log("📋 TEST CASE 5: Ở chỉ 1 tháng từ ngày 15");
console.log("Ngày bắt đầu: 2025-07-15, Ngày kết thúc: 2025-07-31");
console.log("Giá thuê: 1,500,000 VNĐ/tháng");
const test5 = calculator.calculateRoomFee(1500000, "2025-07-15", "2025-07-31");
console.log("Kết quả:", JSON.stringify(test5, null, 2));
console.log("Mong đợi: 750,000 VNĐ (1 tháng × 0.5)\n");

// Test case 6: Trường hợp thực tế từ UC8
console.log("📋 TEST CASE 6: Trường hợp thực tế từ UC8");
console.log("Ngày bắt đầu: 2025-07-14, Ngày kết thúc: 2025-09-30");
console.log("Giá thuê: 1,000 VNĐ/tháng");
const test6 = calculator.calculateRoomFee(1000, "2025-07-14", "2025-09-30");
console.log("Kết quả:", JSON.stringify(test6, null, 2));
console.log("Mong đợi: 3,000 VNĐ (1.0 + 1.0 + 1.0)\n");

// Test case 7: Trường hợp edge - ngày 14 (trước 15)
console.log("📋 TEST CASE 7: Ngày 14 (trước ngày 15)");
console.log("Ngày bắt đầu: 2025-07-14, Ngày kết thúc: 2025-07-31");
console.log("Giá thuê: 1,000,000 VNĐ/tháng");
const test7 = calculator.calculateRoomFee(1000000, "2025-07-14", "2025-07-31");
console.log("Kết quả:", JSON.stringify(test7, null, 2));
console.log("Mong đợi: 1,000,000 VNĐ (1 tháng × 1.0 vì 14 < 15)\n");

// Test case 8: Một quý (3 tháng) từ đầu tháng
console.log("📋 TEST CASE 8: Một quý (3 tháng) từ đầu tháng");
console.log("Ngày bắt đầu: 2025-01-01, Ngày kết thúc: 2025-03-31");
console.log("Giá thuê: 3,000,000 VNĐ/tháng");
const test8 = calculator.calculateRoomFee(3000000, "2025-01-01", "2025-03-31");
console.log("Kết quả:", JSON.stringify(test8, null, 2));
console.log("Mong đợi: 9,000,000 VNĐ (1 quý = 3 tháng × 3,000,000)\n");

// Test case 9: Một quý (3 tháng) từ giữa tháng
console.log("📋 TEST CASE 9: Một quý từ giữa tháng");
console.log("Ngày bắt đầu: 2025-01-16, Ngày kết thúc: 2025-03-31");
console.log("Giá thuê: 3,000,000 VNĐ/tháng");
const test9 = calculator.calculateRoomFee(3000000, "2025-01-16", "2025-03-31");
console.log("Kết quả:", JSON.stringify(test9, null, 2));
console.log("Mong đợi: 7,500,000 VNĐ (0.5 + 1.0 + 1.0)\n");

console.log("✅ TẤT CẢ TEST CASES ĐÃ HOÀN THÀNH!");
console.log("\n🔍 TỔNG KẾT QUY LUẬT:");
console.log("- Ngày < 15: Hệ số = 1.0 (tính đủ tháng)");
console.log("- Ngày >= 15: Hệ số = 0.5 (tính nửa tháng)");
console.log("- Tháng tiếp theo luôn bắt đầu từ ngày 1 (hệ số 1.0)");
console.log("- 1 Quý = 3 tháng (cộng tổng hệ số các tháng)");
