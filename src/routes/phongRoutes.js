const express = require("express");
const PhongController = require("../controllers/phongController");
const { authenticate, authorize } = require("../middleware/auth");
const { handleValidationErrors } = require("../middleware/validation");

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// GET /api/phong - Get all rooms
router.get("/", PhongController.getAllPhong);

// GET /api/phong/available - Get available rooms
router.get("/available", PhongController.getAvailableRooms);

// GET /api/phong/:maPhong - Get room by ID
router.get("/:maPhong", PhongController.getPhongById);

// POST /api/phong - Create new room (Admin/QuanLy only)
router.post(
  "/",
  authorize("Admin", "QuanLy"),
  handleValidationErrors,
  PhongController.createPhong
);

// PUT /api/phong/:maPhong - Update room (Admin/QuanLy only)
router.put(
  "/:maPhong",
  authorize("Admin", "QuanLy"),
  handleValidationErrors,
  PhongController.updatePhong
);

// DELETE /api/phong/:maPhong - Delete room (Admin only)
router.delete("/:maPhong", authorize("Admin"), PhongController.deletePhong);

module.exports = router;
