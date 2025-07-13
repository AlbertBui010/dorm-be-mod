const { body, param } = require("express-validator");

const createDonGiaValidator = [
  body("NgayApDung")
    .notEmpty()
    .withMessage("Ngày áp dụng là bắt buộc")
    .isISO8601()
    .withMessage("Ngày áp dụng phải có định dạng hợp lệ (YYYY-MM-DD)"),

  body("GiaDienPerKWh")
    .notEmpty()
    .withMessage("Giá điện là bắt buộc")
    .isFloat({ min: 0 })
    .withMessage("Giá điện phải là số và lớn hơn hoặc bằng 0"),

  body("GiaNuocPerM3")
    .notEmpty()
    .withMessage("Giá nước là bắt buộc")
    .isFloat({ min: 0 })
    .withMessage("Giá nước phải là số và lớn hơn hoặc bằng 0"),
];

const updateDonGiaValidator = [
  param("id")
    .isInt({ min: 1 })
    .withMessage("ID đơn giá phải là số nguyên dương"),

  body("NgayApDung")
    .optional()
    .isISO8601()
    .withMessage("Ngày áp dụng phải có định dạng hợp lệ (YYYY-MM-DD)"),

  body("GiaDienPerKWh")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Giá điện phải là số và lớn hơn hoặc bằng 0"),

  body("GiaNuocPerM3")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Giá nước phải là số và lớn hơn hoặc bằng 0"),
];

const deleteDonGiaValidator = [
  param("id")
    .isInt({ min: 1 })
    .withMessage("ID đơn giá phải là số nguyên dương"),
];

module.exports = {
  createDonGiaValidator,
  updateDonGiaValidator,
  deleteDonGiaValidator,
};
