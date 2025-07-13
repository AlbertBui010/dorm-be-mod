/**
 * Utility functions for calculating dates related to dorm registration
 */

/**
 * Tính toán ngày kết thúc hợp đồng dựa trên ngày nhận phòng
 * @param {Date} ngayNhanPhong - Ngày nhận phòng
 * @returns {Date} - Ngày kết thúc hợp đồng
 */
function calculateEndDate(ngayNhanPhong) {
  if (!ngayNhanPhong) {
    throw new Error("Ngày nhận phòng không được để trống");
  }

  const date = new Date(ngayNhanPhong);
  const month = date.getMonth(); // 0-based (0 = January)
  const year = date.getFullYear();
  const day = date.getDate();

  // Xác định quý hiện tại
  const currentQuarter = Math.floor(month / 3) + 1; // 1, 2, 3, 4

  // Xác định tháng thứ 2 của quý hiện tại
  const secondMonthOfQuarter = (currentQuarter - 1) * 3 + 1; // 1, 4, 7, 10 (0-based)

  let endYear = year;
  let endQuarter = currentQuarter;

  // Kiểm tra điều kiện: từ ngày 15 trở đi của tháng thứ 2 của quý
  if (month === secondMonthOfQuarter && day >= 15) {
    // Từ ngày 15 trở đi của tháng thứ 2 của quý -> hết quý đó + 1 quý
    endQuarter = currentQuarter + 1;
    if (endQuarter > 4) {
      endQuarter = 1;
      endYear = year + 1;
    }
  } else {
    // Trước ngày 15 của tháng thứ 2 của quý -> hết quý đó
    // endQuarter giữ nguyên
  }

  // Tính tháng cuối của quý đích
  const endMonth = endQuarter * 3 - 1; // 2, 5, 8, 11 (0-based)

  // Ngày cuối cùng của tháng cuối quý
  const endDate = new Date(endYear, endMonth + 1, 0); // Ngày cuối tháng

  return endDate;
}

/**
 * Kiểm tra ngày nhận phòng có hợp lệ không
 * @param {Date} ngayNhanPhong - Ngày nhận phòng
 * @param {Date} ngayDangKy - Ngày đăng ký (tùy chọn, mặc định là hôm nay)
 * @returns {Object} - {isValid: boolean, message: string}
 */
function validateReceiveDate(ngayNhanPhong, ngayDangKy = new Date()) {
  if (!ngayNhanPhong) {
    return {
      isValid: false,
      message: "Ngày nhận phòng không được để trống",
    };
  }

  const registrationDate = new Date(ngayDangKy);
  registrationDate.setHours(0, 0, 0, 0); // Reset time to beginning of day

  const receiveDate = new Date(ngayNhanPhong);
  receiveDate.setHours(0, 0, 0, 0); // Reset time to beginning of day

  // Ngày nhận phòng không được trước ngày đăng ký
  if (receiveDate < registrationDate) {
    return {
      isValid: false,
      message: "Ngày nhận phòng không được trong quá khứ",
    };
  }

  // Tính số ngày chênh lệch
  const diffTime = receiveDate - registrationDate;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  // Không quá 3 ngày
  if (diffDays > 3) {
    return {
      isValid: false,
      message:
        "Ngày nhận phòng chỉ được chọn trong vòng 3 ngày kể từ ngày đăng ký",
    };
  }

  return {
    isValid: true,
    message: "Ngày nhận phòng hợp lệ",
  };
}

/**
 * Lấy thông tin quý từ ngày
 * @param {Date} date - Ngày cần kiểm tra
 * @returns {Object} - Thông tin quý {quarter: number, year: number, startMonth: number, endMonth: number}
 */
function getQuarterInfo(date) {
  const month = date.getMonth(); // 0-based
  const year = date.getFullYear();
  const quarter = Math.floor(month / 3) + 1;

  return {
    quarter,
    year,
    startMonth: (quarter - 1) * 3, // 0-based
    endMonth: quarter * 3 - 1, // 0-based
    secondMonth: (quarter - 1) * 3 + 1, // 0-based - tháng thứ 2 của quý
  };
}

/**
 * Format ngày theo định dạng dd/mm/yyyy
 * @param {Date} date - Ngày cần format
 * @returns {string} - Ngày đã format
 */
function formatDate(date) {
  if (!date) return "";
  return date.toLocaleDateString("vi-VN");
}

/**
 * Tính toán và trả về thông tin về ngày kết thúc dựa trên ngày nhận phòng
 * @param {Date} ngayNhanPhong - Ngày nhận phòng
 * @returns {Object} - Thông tin chi tiết về việc tính toán
 */
function getEndDateCalculationInfo(ngayNhanPhong) {
  if (!ngayNhanPhong) {
    return null;
  }

  const receiveDate = new Date(ngayNhanPhong);
  const quarterInfo = getQuarterInfo(receiveDate);
  const endDate = calculateEndDate(ngayNhanPhong);

  const day = receiveDate.getDate();
  const isAfter15thOfSecondMonth =
    receiveDate.getMonth() === quarterInfo.secondMonth && day >= 15;

  // Map quarters to semester names
  const quarterNames = {
    1: "Học kỳ hè", // Q1: Jan-Mar (Summer semester)
    2: "Học kỳ hè", // Q2: Apr-Jun (Summer semester)
    3: "Học kỳ 1", // Q3: Jul-Sep (Semester 1)
    4: "Học kỳ 2", // Q4: Oct-Dec (Semester 2)
  };

  // Calculate academic year (Jul-Jun cycle)
  let academicYear;
  const year = receiveDate.getFullYear();
  if (quarterInfo.quarter >= 3) {
    // Jul-Dec
    academicYear = `${year}-${year + 1}`;
  } else {
    // Jan-Jun
    academicYear = `${year - 1}-${year}`;
  }

  return {
    ngayNhanPhong: receiveDate,
    ngayKetThuc: endDate,
    quarter: quarterInfo.quarter,
    quarterName: quarterNames[quarterInfo.quarter],
    academicYear: academicYear,
    isAfter15thOfSecondMonth: isAfter15thOfSecondMonth,
    calculation: isAfter15thOfSecondMonth
      ? "Từ ngày 15 trở đi của tháng thứ 2 của quý -> hết quý đó + 1 quý"
      : "Trước ngày 15 của tháng thứ 2 của quý -> hết quý đó",
    currentQuarter: quarterInfo.quarter,
    endQuarter: calculateEndQuarter(
      quarterInfo.quarter,
      isAfter15thOfSecondMonth
    ),
  };
}

/**
 * Tính toán quý kết thúc
 */
function calculateEndQuarter(currentQuarter, isAfter15thOfSecondMonth) {
  if (isAfter15thOfSecondMonth) {
    return currentQuarter + 1 > 4 ? 1 : currentQuarter + 1;
  }
  return currentQuarter;
}

module.exports = {
  calculateEndDate,
  validateReceiveDate,
  getQuarterInfo,
  formatDate,
  getEndDateCalculationInfo,
};
