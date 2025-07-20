const { query } = require("express-validator");

const getAllLichSuOPhongValidator = [
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Trang phải là số nguyên dương"),

  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Giới hạn phải là số nguyên từ 1 đến 100"),

  query("MaSinhVien")
    .optional()
    .isLength({ min: 1, max: 10 })
    .withMessage("Mã sinh viên phải có độ dài từ 1 đến 10 ký tự"),

  query("MaPhong")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Mã phòng phải là số nguyên dương"),
];

module.exports = {
  getAllLichSuOPhongValidator,
};
