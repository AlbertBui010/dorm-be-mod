const { body } = require("express-validator");

const createSinhVienValidation = [
  body("MaSinhVien")
    .notEmpty()
    .withMessage("Mã sinh viên không được để trống")
    .isLength({ min: 8, max: 10 })
    .withMessage("Mã sinh viên phải từ 8-10 ký tự"),

  body("HoTen")
    .notEmpty()
    .withMessage("Họ tên không được để trống")
    .isLength({ min: 2, max: 100 })
    .withMessage("Họ tên phải từ 2-100 ký tự"),

  body("NgaySinh")
    .optional()
    .isISO8601()
    .withMessage("Ngày sinh không đúng định dạng (YYYY-MM-DD)"),

  body("GioiTinh")
    .optional()
    .isIn(["Nam", "Nữ", "Khác"])
    .withMessage("Giới tính phải là Nam, Nữ hoặc Khác"),

  body("SoDienThoai")
    .optional()
    .isMobilePhone("vi-VN")
    .withMessage("Số điện thoại không đúng định dạng"),

  body("Email").optional().isEmail().withMessage("Email không đúng định dạng"),

  body("MatKhau")
    .optional()
    .isLength({ min: 6 })
    .withMessage("Mật khẩu phải có ít nhất 6 ký tự"),
];

const updateSinhVienValidation = [
  body("HoTen")
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage("Họ tên phải từ 2-100 ký tự"),

  body("NgaySinh")
    .optional()
    .isISO8601()
    .withMessage("Ngày sinh không đúng định dạng (YYYY-MM-DD)"),

  body("GioiTinh")
    .optional()
    .isIn(["Nam", "Nữ", "Khác"])
    .withMessage("Giới tính phải là Nam, Nữ hoặc Khác"),

  body("SoDienThoai")
    .optional()
    .isMobilePhone("vi-VN")
    .withMessage("Số điện thoại không đúng định dạng"),

  body("Email").optional().isEmail().withMessage("Email không đúng định dạng"),

  body("MatKhau")
    .optional()
    .isLength({ min: 6 })
    .withMessage("Mật khẩu phải có ít nhất 6 ký tự"),
];

module.exports = {
  createSinhVienValidation,
  updateSinhVienValidation,
};
