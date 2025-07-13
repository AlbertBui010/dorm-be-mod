const express = require("express");
const PhongController = require("../controllers/phongController");
const { authenticate, authorize } = require("../middleware/auth");
const { handleValidationErrors } = require("../middleware/validation");
const {
  createPhongValidator,
  updatePhongValidator,
  phongParamValidator,
} = require("../validators/phongValidator");

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// GET /api/phong - Get all rooms
router.get("/", PhongController.getAllPhong);

// GET /api/phong/available - Get available rooms
router.get("/available", PhongController.getAvailableRooms);

// GET /api/phong/statistics - Get room statistics (QuanTriVien/QuanLy only)
router.get(
  "/statistics",
  authorize("QuanTriVien", "QuanLy"),
  PhongController.getRoomStatistics
);

// GET /api/phong/:maPhong - Get room by ID
router.get(
  "/:maPhong",
  phongParamValidator,
  handleValidationErrors,
  PhongController.getPhongById
);

// POST /api/phong - Create new room (QuanTriVien/QuanLy only)
router.post(
  "/",
  authorize("QuanTriVien", "QuanLy"),
  createPhongValidator,
  handleValidationErrors,
  PhongController.createPhong
);

// PUT /api/phong/:maPhong - Update room (QuanTriVien/QuanLy only)
router.put(
  "/:maPhong",
  authorize("QuanTriVien", "QuanLy"),
  updatePhongValidator,
  handleValidationErrors,
  PhongController.updatePhong
);

// DELETE /api/phong/:maPhong - Delete room (QuanTriVien only)
router.delete(
  "/:maPhong",
  authorize("QuanTriVien"),
  phongParamValidator,
  handleValidationErrors,
  PhongController.deletePhong
);

module.exports = router;
