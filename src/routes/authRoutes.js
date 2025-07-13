const express = require("express");
const AuthController = require("../controllers/authController");
const { authenticate } = require("../middleware/auth");
const { handleValidationErrors } = require("../middleware/validation");
const {
  loginValidation,
  changePasswordValidation,
} = require("../validators/authValidator");

const router = express.Router();

// Public routes
router.post(
  "/login",
  loginValidation,
  handleValidationErrors,
  AuthController.login
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

module.exports = router;
