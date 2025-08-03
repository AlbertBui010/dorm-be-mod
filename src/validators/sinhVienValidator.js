const { body } = require("express-validator");
const { STUDENT_STATUS } = require("../constants/sinhvien");

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
    .withMessage("Mật khẩu phải có ít nhất 6 ký tự")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage("Mật khẩu phải có ít nhất 1 chữ thường, 1 chữ hoa và 1 số"),

  body("EmailDaXacThuc")
    .optional()
    .isBoolean()
    .withMessage("EmailDaXacThuc phải là true hoặc false"),

  body("TrangThai")
    .optional()
    .isIn([
      STUDENT_STATUS.DANG_KY,
      STUDENT_STATUS.NGUNG_O,
      STUDENT_STATUS.DANG_O,
      STUDENT_STATUS.VI_PHAM,
      STUDENT_STATUS.CHO_NHAN_PHONG,
    ])
    .withMessage(
      "Trạng thái phải là DANG_KY hoặc NGUNG_O hoặc DANG_O hoặc VI_PHAM hoặc CHO_NHAN_PHONG"
    ),
];

const updateSinhVienValidation = [
  // Prevent updating MaSinhVien
  body("MaSinhVien")
    .if(body("MaSinhVien").exists())
    .custom(() => {
      throw new Error("Không được phép thay đổi mã sinh viên");
    }),

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
    .withMessage("Mật khẩu phải có ít nhất 6 ký tự")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage("Mật khẩu phải có ít nhất 1 chữ thường, 1 chữ hoa và 1 số"),

  body("EmailDaXacThuc")
    .optional()
    .isBoolean()
    .withMessage("EmailDaXacThuc phải là true hoặc false"),

  body("TrangThai")
    .optional()
    .isIn([
      STUDENT_STATUS.DANG_KY,
      STUDENT_STATUS.NGUNG_O,
      STUDENT_STATUS.DANG_O,
      STUDENT_STATUS.VI_PHAM,
      STUDENT_STATUS.CHO_NHAN_PHONG,
    ])
    .withMessage(
      "Trạng thái phải là DANG_KY hoặc NGUNG_O hoặc DANG_O hoặc VI_PHAM hoặc CHO_NHAN_PHONG"
    ),
];

module.exports = {
  createSinhVienValidation,
  updateSinhVienValidation,
};
