const express = require("express");
const AuthController = require("../controllers/authController");
const { authenticate, authorizeStudent } = require("../middleware/auth");
const { handleValidationErrors } = require("../middleware/validation");
const {
  loginValidation,
  changePasswordValidation,
  forgotPasswordValidation,
  resetPasswordValidation,
} = require("../validators/authValidator");

const router = express.Router();

// Public routes
router.post(
  "/login",
  loginValidation,
  handleValidationErrors,
  AuthController.login
);

// Password reset routes (public)
router.post(
  "/forgot-password",
  forgotPasswordValidation,
  handleValidationErrors,
  AuthController.sendPasswordResetEmail
);
router.get("/verify-reset-token/:token", AuthController.verifyResetToken);
router.post(
  "/reset-password",
  resetPasswordValidation,
  handleValidationErrors,
  AuthController.resetPassword
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
