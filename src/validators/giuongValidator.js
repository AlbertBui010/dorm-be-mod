const { body, param, query } = require("express-validator");

// Common validation helper
const isMaGiuongFormat = (value) => {
  return /^G\d{3}$/.test(value);
};

const isMaPhongFormat = (value) => {
  return /^P\d{3}$/.test(value);
};

const isMaSinhVienFormat = (value) => {
  return /^SV\d{3}$/.test(value);
};

// Validation for creating a new bed
const createGiuongValidator = [
  body("MaPhong")
    .notEmpty()
    .withMessage("Mã phòng không được để trống")
    .isInt({ min: 1 })
    .withMessage("Mã phòng phải là số nguyên dương"),

  body("SoGiuong")
    .notEmpty()
    .withMessage("Số giường không được để trống")
    .isLength({ min: 1, max: 10 })
    .withMessage("Số giường phải từ 1-10 ký tự"),
];

// Validation for updating a bed
const updateGiuongValidator = [
  param("maGiuong")
    .notEmpty()
    .withMessage("Mã giường không được để trống")
    .isInt({ min: 1 })
    .withMessage("Mã giường phải là số nguyên dương"),

  body("MaPhong")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Mã phòng phải là số nguyên dương"),

  body("SoGiuong")
    .optional()
    .isLength({ min: 1, max: 10 })
    .withMessage("Số giường phải từ 1-10 ký tự"),
];

// Validation for getting a bed by ID
const getGiuongByIdValidator = [
  param("maGiuong")
    .notEmpty()
    .withMessage("Mã giường không được để trống")
    .isInt({ min: 1 })
    .withMessage("Mã giường phải là số nguyên dương"),
];

// Validation for deleting a bed
const deleteGiuongValidator = [
  param("maGiuong")
    .notEmpty()
    .withMessage("Mã giường không được để trống")
    .isInt({ min: 1 })
    .withMessage("Mã giường phải là số nguyên dương"),
];

// Validation for assigning student to bed
const assignStudentValidator = [
  param("maGiuong")
    .notEmpty()
    .withMessage("Mã giường không được để trống")
    .isInt({ min: 1 })
    .withMessage("Mã giường phải là số nguyên dương"),

  body("maSinhVien")
    .notEmpty()
    .withMessage("Mã sinh viên không được để trống")
    .custom(isMaSinhVienFormat)
    .withMessage("Mã sinh viên phải có định dạng SV + 3 chữ số (ví dụ: SV001)"),
];

// Validation for removing student from bed
const removeStudentValidator = [
  param("maGiuong")
    .notEmpty()
    .withMessage("Mã giường không được để trống")
    .isInt({ min: 1 })
    .withMessage("Mã giường phải là số nguyên dương"),
];

// Validation for getting beds by room
const getGiuongByRoomValidator = [
  param("maPhong")
    .notEmpty()
    .withMessage("Mã phòng không được để trống")
    .isInt({ min: 1 })
    .withMessage("Mã phòng phải là số nguyên dương"),
];

// Validation for query parameters (search, filter, pagination)
const queryValidator = [
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Trang phải là số nguyên dương"),

  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit phải là số nguyên từ 1 đến 100"),

  query("search")
    .optional()
    .isLength({ max: 100 })
    .withMessage("Từ khóa tìm kiếm không được vượt quá 100 ký tự"),

  query("maPhong")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Mã phòng phải là số nguyên dương"),

  query("trangThai")
    .optional()
    .isIn(["Hoạt động", "Không hoạt động", "Bảo trì"])
    .withMessage(
      "Trạng thái phải là một trong: Hoạt động, Không hoạt động, Bảo trì"
    ),
];

module.exports = {
  createGiuongValidator,
  updateGiuongValidator,
  getGiuongByIdValidator,
  deleteGiuongValidator,
  assignStudentValidator,
  removeStudentValidator,
  getGiuongByRoomValidator,
  queryValidator,
};
