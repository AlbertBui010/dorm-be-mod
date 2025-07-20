const { body, param, query } = require("express-validator");

// Validation cho lấy danh sách yêu cầu chuyển phòng
const getAllYeuCauValidation = [
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Trang phải là số nguyên dương"),

  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Giới hạn phải từ 1-100"),

  query("trangThai")
    .optional()
    .isIn(["CHO_DUYET", "DA_DUYET", "TU_CHOI", "DANG_XU_LY"])
    .withMessage("Trạng thái không hợp lệ"),

  query("maSinhVien")
    .optional()
    .isLength({ min: 1, max: 10 })
    .withMessage("Mã sinh viên phải từ 1-10 ký tự"),

  query("maPhongMoi")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Mã phòng mới phải là số nguyên dương"),

  query("tuNgay").optional().isISO8601().withMessage("Từ ngày không hợp lệ"),

  query("denNgay").optional().isISO8601().withMessage("Đến ngày không hợp lệ"),
];

// Validation cho lấy yêu cầu theo ID
const getYeuCauByIdValidation = [
  param("maYeuCau").isInt({ min: 1 }).withMessage("Mã yêu cầu không hợp lệ"),
];

// Validation cho tạo yêu cầu chuyển phòng
const createYeuCauValidation = [
  body("MaSinhVien")
    .notEmpty()
    .withMessage("Mã sinh viên là bắt buộc")
    .isLength({ min: 1, max: 10 })
    .withMessage("Mã sinh viên phải từ 1-10 ký tự"),

  body("LyDo")
    .optional()
    .isLength({ max: 500 })
    .withMessage("Lý do không được quá 500 ký tự"),

  body("NgayYeuCau")
    .optional()
    .isISO8601()
    .withMessage("Ngày yêu cầu không hợp lệ"),

  body("MaPhongMoi")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Mã phòng mới phải là số nguyên dương"),
];

// Validation cho cập nhật yêu cầu chuyển phòng
const updateYeuCauValidation = [
  param("maYeuCau").isInt({ min: 1 }).withMessage("Mã yêu cầu không hợp lệ"),

  body("LyDo")
    .optional()
    .isLength({ max: 500 })
    .withMessage("Lý do không được quá 500 ký tự"),

  body("NgayYeuCau")
    .optional()
    .isISO8601()
    .withMessage("Ngày yêu cầu không hợp lệ"),

  body("MaPhongMoi")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Mã phòng mới phải là số nguyên dương"),
];

// Validation cho duyệt yêu cầu
const approveYeuCauValidation = [
  param("maYeuCau").isInt({ min: 1 }).withMessage("Mã yêu cầu không hợp lệ"),

  body("ghiChu")
    .optional()
    .isLength({ max: 500 })
    .withMessage("Ghi chú không được quá 500 ký tự"),
];

// Validation cho từ chối yêu cầu
const rejectYeuCauValidation = [
  param("maYeuCau").isInt({ min: 1 }).withMessage("Mã yêu cầu không hợp lệ"),

  body("lyDoTuChoi")
    .notEmpty()
    .withMessage("Lý do từ chối là bắt buộc")
    .isLength({ max: 500 })
    .withMessage("Lý do từ chối không được quá 500 ký tự"),
];

// Validation cho lấy yêu cầu của sinh viên
const getYeuCauBySinhVienValidation = [
  param("maSinhVien")
    .notEmpty()
    .withMessage("Mã sinh viên là bắt buộc")
    .isLength({ min: 1, max: 10 })
    .withMessage("Mã sinh viên phải từ 1-10 ký tự"),
];

module.exports = {
  getAllYeuCauValidation,
  getYeuCauByIdValidation,
  createYeuCauValidation,
  updateYeuCauValidation,
  approveYeuCauValidation,
  rejectYeuCauValidation,
  getYeuCauBySinhVienValidation,
};
