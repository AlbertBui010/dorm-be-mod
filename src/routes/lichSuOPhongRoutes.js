const express = require("express");
const LichSuOPhongController = require("../controllers/lichSuOPhongController");
const { authenticate, authorize } = require("../middleware/auth");
const { handleValidationErrors } = require("../middleware/validation");
const {
  getAllLichSuOPhongValidator,
} = require("../validators/lichSuOPhongValidator");

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// GET /api/lich-su-o-phong - Get all room history with filtering and pagination
router.get(
  "/",
  getAllLichSuOPhongValidator,
  handleValidationErrors,
  authorize(["QuanTriVien", "NhanVien"]),
  LichSuOPhongController.getAllLichSuOPhong
);

module.exports = router;
