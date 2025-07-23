const { body, param } = require("express-validator");

const createPhongValidator = [
  body("SoPhong")
    .notEmpty()
    .withMessage("Số phòng không được để trống")
    .matches(/^[A-Z]\d{3}$/)
    .withMessage(
      "Số phòng phải có định dạng: 1 chữ cái in hoa + 3 số (VD: A101)"
    ),

  body("LoaiPhong")
    .notEmpty()
    .withMessage("Loại phòng không được để trống")
    .isIn(["Nam", "Nữ"])
    .withMessage("Loại phòng phải là 'Nam' hoặc 'Nữ'"),

  body("SucChua")
    .isInt({ min: 1, max: 10 })
    .withMessage("Sức chứa phải là số nguyên từ 1 đến 10"),

  body("DienTich")
    .isFloat({ min: 10, max: 100 })
    .withMessage("Diện tích phải là số thực từ 10 đến 100 m²"),

  body("GiaThueThang")
    .isFloat({ min: 0 })
    .withMessage("Giá phòng phải là số dương"),

  body("MoTa")
    .optional()
    .isLength({ max: 500 })
    .withMessage("Mô tả không được vượt quá 500 ký tự"),

  body("TrangThai")
    .optional()
    .isIn(["HOAT_DONG", "KHOA"])
    .withMessage("Trạng thái phải là 'HOAT_DONG' hoặc 'KHOA'"),
];

const updatePhongValidator = [
  param("maPhong").isInt().withMessage("Mã phòng phải là số nguyên"),

  body("SoPhong")
    .optional()
    .matches(/^[A-Z]\d{3}$/)
    .withMessage(
      "Số phòng phải có định dạng: 1 chữ cái in hoa + 3 số (VD: A101)"
    ),

  body("LoaiPhong")
    .optional()
    .isIn(["Nam", "Nữ"])
    .withMessage("Loại phòng phải là 'Nam' hoặc 'Nữ'"),

  body("SucChua")
    .optional()
    .isInt({ min: 1, max: 10 })
    .withMessage("Sức chứa phải là số nguyên từ 1 đến 10"),

  body("DienTich")
    .optional()
    .isFloat({ min: 10, max: 100 })
    .withMessage("Diện tích phải là số thực từ 10 đến 100 m²"),

  body("GiaThueThang")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Giá phòng phải là số dương"),

  body("MoTa")
    .optional()
    .isLength({ max: 500 })
    .withMessage("Mô tả không được vượt quá 500 ký tự"),

  body("TrangThai")
    .optional()
    .isIn(["HOAT_DONG", "KHOA"])
    .withMessage("Trạng thái phải là 'HOAT_DONG' hoặc 'KHOA'"),
];

const phongParamValidator = [
  param("maPhong").isInt().withMessage("Mã phòng phải là số nguyên"),
];

module.exports = {
  createPhongValidator,
  updatePhongValidator,
  phongParamValidator,
};
