const { body } = require("express-validator");

const validateCreate = [
  body("MaPhong")
    .isInt({ min: 1 })
    .withMessage("MaPhong phải là số nguyên dương"),
  body("ThangNam")
    .matches(/^(0[1-9]|1[0-2])\/\d{4}$/)
    .withMessage("ThangNam phải có định dạng MM/YYYY (VD: 07/2025)"),
  body("SoDienCu").isFloat({ min: 0 }).withMessage("SoDienCu phải >= 0"),
  body("SoDienMoi")
    .isFloat({ min: 0 })
    .withMessage("SoDienMoi phải >= 0")
    .custom((value, { req }) => {
      if (
        typeof req.body.SoDienCu !== "undefined" &&
        Number(value) < Number(req.body.SoDienCu)
      ) {
        throw new Error("SoDienMoi phải >= SoDienCu");
      }
      return true;
    }),
  body("SoNuocCu").isFloat({ min: 0 }).withMessage("SoNuocCu phải >= 0"),
  body("SoNuocMoi")
    .isFloat({ min: 0 })
    .withMessage("SoNuocMoi phải >= 0")
    .custom((value, { req }) => {
      if (
        typeof req.body.SoNuocCu !== "undefined" &&
        Number(value) < Number(req.body.SoNuocCu)
      ) {
        throw new Error("SoNuocMoi phải >= SoNuocCu");
      }
      return true;
    }),
];

const validateUpdate = [
  body("SoDienCu")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("SoDienCu phải >= 0"),
  body("SoDienMoi")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("SoDienMoi phải >= 0")
    .custom((value, { req }) => {
      if (
        typeof req.body.SoDienCu !== "undefined" &&
        typeof value !== "undefined" &&
        Number(value) < Number(req.body.SoDienCu)
      ) {
        throw new Error("SoDienMoi phải >= SoDienCu");
      }
      return true;
    }),
  body("SoNuocCu")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("SoNuocCu phải >= 0"),
  body("SoNuocMoi")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("SoNuocMoi phải >= 0")
    .custom((value, { req }) => {
      if (
        typeof req.body.SoNuocCu !== "undefined" &&
        typeof value !== "undefined" &&
        Number(value) < Number(req.body.SoNuocCu)
      ) {
        throw new Error("SoNuocMoi phải >= SoNuocCu");
      }
      return true;
    }),
];

module.exports = { validateCreate, validateUpdate };
