const { body, validationResult } = require("express-validator");
const { NHAN_VIEN_TRANG_THAI } = require("../constants/nhanVien");

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: errors.array(),
    });
  }
  next();
};

const create = [
  body("TenDangNhap")
    .notEmpty()
    .withMessage("Tên đăng nhập là bắt buộc")
    .isLength({ min: 3, max: 50 })
    .withMessage("Tên đăng nhập phải từ 3-50 ký tự")
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage("Tên đăng nhập chỉ chứa chữ, số và dấu gạch dưới"),

  body("MatKhau")
    .notEmpty()
    .withMessage("Mật khẩu là bắt buộc")
    .isLength({ min: 6 })
    .withMessage("Mật khẩu phải có ít nhất 6 ký tự"),

  body("HoTen")
    .notEmpty()
    .withMessage("Họ tên là bắt buộc")
    .isLength({ max: 100 })
    .withMessage("Họ tên không được quá 100 ký tự"),

  body("Email")
    .optional()
    .isEmail()
    .withMessage("Email không hợp lệ")
    .isLength({ max: 100 })
    .withMessage("Email không được quá 100 ký tự"),

  body("SoDienThoai")
    .optional()
    .matches(/^[0-9+\-\s()]+$/)
    .withMessage("Số điện thoại không hợp lệ")
    .isLength({ max: 20 })
    .withMessage("Số điện thoại không được quá 20 ký tự"),

  body("VaiTro")
    .notEmpty()
    .withMessage("Vai trò không được để trống")
    .isIn(["QuanTriVien", "NhanVien"])
    .withMessage("Vai trò không hợp lệ"),

  handleValidationErrors,
];

const update = [
  body("TenDangNhap")
    .optional()
    .isLength({ min: 3, max: 50 })
    .withMessage("Tên đăng nhập phải từ 3-50 ký tự")
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage("Tên đăng nhập chỉ chứa chữ, số và dấu gạch dưới"),

  body("MatKhau")
    .optional({ nullable: true })
    .isLength({ min: 6 })
    .withMessage("Mật khẩu phải có ít nhất 6 ký tự"),

  body("HoTen")
    .optional()
    .isLength({ max: 100 })
    .withMessage("Họ tên không được quá 100 ký tự"),

  body("Email")
    .optional()
    .isEmail()
    .withMessage("Email không hợp lệ")
    .isLength({ max: 100 })
    .withMessage("Email không được quá 100 ký tự"),

  body("SoDienThoai")
    .optional()
    .matches(/^[0-9+\-\s()]+$/)
    .withMessage("Số điện thoại không hợp lệ")
    .isLength({ max: 20 })
    .withMessage("Số điện thoại không được quá 20 ký tự"),

  body("TrangThai")
    .optional()
    .isIn([
      NHAN_VIEN_TRANG_THAI.HOAT_DONG,
      NHAN_VIEN_TRANG_THAI.KHOA,
      NHAN_VIEN_TRANG_THAI.DA_NGHI,
    ])
    .withMessage("Trạng thái không hợp lệ"),

  body("VaiTro")
    .optional()
    .isIn(["QuanTriVien", "NhanVien"])
    .withMessage("Vai trò không hợp lệ"),

  handleValidationErrors,
];

module.exports = {
  create,
  update,
};
