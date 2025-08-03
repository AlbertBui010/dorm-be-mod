const express = require("express");
const router = express.Router();
const registrationController = require("../controllers/registrationController");
const RegistrationValidator = require("../validators/registrationValidator");

/**
 * @route   POST /api/registration/register
 * @desc    Đăng ký ở ký túc xá (Bước 1)
 * @access  Public
 * @body    { email, hoTen, ngaySinh?, gioiTinh?, soDienThoai?, maSinhVien? }
 */
router.post(
  "/register",
  RegistrationValidator.validateRegistration(),
  RegistrationValidator.handleValidationErrors,
  registrationController.register
);

/**
 * @route   POST /api/registration/verify-email
 * @desc    Xác thực email thông qua mã xác thực (Bước 2)
 * @access  Public
 * @body    { token }
 */
router.post(
  "/verify-email",
  RegistrationValidator.validateEmailVerification(),
  RegistrationValidator.handleValidationErrors,
  registrationController.verifyEmail
);

/**
 * @route   GET /api/registration/verify-email/:token
 * @desc    Xác thực email thông qua link trong email (Bước 2 - alternative)
 * @access  Public
 * @params  token
 */
router.get(
  "/verify-email/:token",
  RegistrationValidator.validateEmailVerificationByLink(),
  RegistrationValidator.handleValidationErrors,
  registrationController.verifyEmailByLink
);

/**
 * @route   POST /api/registration/setup-password
 * @desc    Thiết lập mật khẩu sau khi xác thực email (Bước 3)
 * @access  Public
 * @body    { maSinhVien, matKhau, xacNhanMatKhau }
 */
router.post(
  "/setup-password",
  RegistrationValidator.validatePasswordSetup(),
  RegistrationValidator.handleValidationErrors,
  registrationController.setupPassword
);

/**
 * @route   POST /api/registration/resend-verification
 * @desc    Gửi lại email xác thực
 * @access  Public
 * @body    { email }
 */
router.post(
  "/resend-verification",
  RegistrationValidator.validateResendVerification(),
  RegistrationValidator.handleValidationErrors,
  registrationController.resendVerification
);

/**
 * @route   GET /api/registration/status/:maSinhVien
 * @desc    Kiểm tra trạng thái đăng ký của sinh viên
 * @access  Public
 * @params  maSinhVien
 */
router.get(
  "/status/:maSinhVien",
  RegistrationValidator.validateGetStatus(),
  RegistrationValidator.handleValidationErrors,
  registrationController.getRegistrationStatus
);

/**
 * @route   POST /api/registration/check-existing
 * @desc    Kiểm tra email/mã sinh viên có tồn tại không
 * @access  Public
 * @body    { email?, maSinhVien? }
 */
router.post(
  "/check-existing",
  RegistrationValidator.validateCheckExisting(),
  RegistrationValidator.handleValidationErrors,
  registrationController.checkExisting
);

/**
 * @route   POST /api/registration/calculate-end-date
 * @desc    Tính toán ngày kết thúc hợp đồng dựa trên ngày nhận phòng
 * @access  Public
 * @body    { ngayNhanPhong }
 */
router.post(
  "/calculate-end-date",
  RegistrationValidator.validateCalculateEndDate(),
  RegistrationValidator.handleValidationErrors,
  registrationController.calculateEndDate
);

/**
 * @route   POST /api/registration/renew
 * @desc    Gia hạn hợp đồng ở ký túc xá
 * @access  Private (cần xác thực)
 * @body    { maSinhVien? } (nếu không có req.user)
 */
router.post("/cancel-renew", registrationController.cancelRenewContract);

module.exports = router;
