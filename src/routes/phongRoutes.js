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

// Routes
router.get(
  "/",
  authorize(["QuanTriVien", "NhanVien"]),
  PhongController.getAllPhong
);

// GET /api/phong/available - Get available rooms
router.get("/available", PhongController.getAvailableRooms);

// GET /api/phong/statistics - Get room statistics
router.get(
  "/statistics",
  authorize(["QuanTriVien", "NhanVien"]),
  PhongController.getRoomStatistics
);

router.get(
  "/:maPhong",
  phongParamValidator,
  handleValidationErrors,
  authorize(["QuanTriVien", "NhanVien"]),
  PhongController.getPhongById
);

router.post(
  "/",
  authorize(["QuanTriVien", "NhanVien"]),
  createPhongValidator,
  handleValidationErrors,
  PhongController.createPhong
);

router.put(
  "/:maPhong",
  authorize("QuanTriVien"),
  phongParamValidator,
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
