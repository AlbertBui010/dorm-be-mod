const { body, validationResult } = require("express-validator");

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

/**
 * Validation cho forgot password request
 */
const validateForgotPassword = [
  body("email")
    .notEmpty()
    .withMessage("Email là bắt buộc")
    .isEmail()
    .withMessage("Email không hợp lệ")
    .normalizeEmail(),

  handleValidationErrors,
];

/**
 * Validation cho reset password request
 */
const validateResetPassword = [
  body("email")
    .notEmpty()
    .withMessage("Email là bắt buộc")
    .isEmail()
    .withMessage("Email không hợp lệ")
    .normalizeEmail(),

  body("token")
    .notEmpty()
    .withMessage("Mã xác thực là bắt buộc")
    .isLength({ min: 32, max: 100 })
    .withMessage("Mã xác thực không hợp lệ")
    .trim(),

  body("newPassword")
    .notEmpty()
    .withMessage("Mật khẩu mới là bắt buộc")
    .isLength({ min: 6, max: 50 })
    .withMessage("Mật khẩu mới phải từ 6-50 ký tự")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage(
      "Mật khẩu mới phải chứa ít nhất 1 chữ hoa, 1 chữ thường và 1 số"
    ),

  body("confirmPassword")
    .notEmpty()
    .withMessage("Xác nhận mật khẩu là bắt buộc")
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error("Xác nhận mật khẩu không khớp");
      }
      return true;
    }),

  handleValidationErrors,
];

module.exports = {
  validateForgotPassword,
  validateResetPassword,
};
