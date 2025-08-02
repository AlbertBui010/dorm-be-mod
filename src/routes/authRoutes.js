const express = require("express");
const AuthController = require("../controllers/authController");
const ForgotPasswordController = require("../controllers/forgotPasswordController");
const { authenticate, authorizeStudent } = require("../middleware/auth");
const { handleValidationErrors } = require("../middleware/validation");
const {
  loginValidation,
  changePasswordValidation,
} = require("../validators/authValidator");
const {
  validateForgotPassword,
  validateResetPassword,
} = require("../validators/forgotPasswordValidator");

const router = express.Router();

// Public routes
router.post(
  "/login",
  loginValidation,
  handleValidationErrors,
  AuthController.login
);

// Forgot password routes (public)
router.post(
  "/forgot-password",
  validateForgotPassword,
  ForgotPasswordController.forgotPassword
);

router.post(
  "/reset-password",
  validateResetPassword,
  ForgotPasswordController.resetPassword
);

// Protected routes
router.use(authenticate);
router.get("/profile", AuthController.getProfile);
router.post(
  "/change-password",
  changePasswordValidation,
  handleValidationErrors,
  AuthController.changePassword
);
router.post("/logout", AuthController.logout);

// Student-only routes
router.post("/set-password", authorizeStudent, AuthController.setPassword);

module.exports = router;
