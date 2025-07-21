const express = require("express");
const router = express.Router();
const giuongController = require("../controllers/giuongController");
const { authenticate, authorize } = require("../middleware/auth");
const {
  createGiuongValidator,
  updateGiuongValidator,
  getGiuongByIdValidator,
  deleteGiuongValidator,
  assignStudentValidator,
  removeStudentValidator,
  getGiuongByRoomValidator,
  queryValidator,
} = require("../validators/giuongValidator");

// Route: GET /api/giuong - Get all beds with filtering and pagination
router.get(
  "/",
  authenticate,
  authorize(["QuanTriVien", "NhanVien"]),
  queryValidator,
  giuongController.getAllGiuong
);

// Route: GET /api/giuong/statistics - Get bed statistics
router.get(
  "/statistics",
  authenticate,
  authorize(["QuanTriVien", "NhanVien"]),
  giuongController.getBedStatistics
);

// Route: GET /api/giuong/available - Get available beds
router.get(
  "/available",
  authenticate,
  authorize(["QuanTriVien", "NhanVien"]),
  giuongController.getAvailableBeds
);

// Route: GET /api/giuong/room/:maPhong - Get beds by room
router.get(
  "/room/:maPhong",
  authenticate,
  authorize(["QuanTriVien", "NhanVien"]),
  getGiuongByRoomValidator,
  giuongController.getGiuongByRoom
);

// Route: GET /api/giuong/:maGiuong - Get bed by ID
router.get(
  "/:maGiuong",
  authenticate,
  authorize(["QuanTriVien", "NhanVien"]),
  getGiuongByIdValidator,
  giuongController.getGiuongById
);

// Route: POST /api/giuong - Create new bed
router.post(
  "/",
  authenticate,
  authorize(["QuanTriVien"]),
  createGiuongValidator,
  giuongController.createGiuong
);

// Route: PUT /api/giuong/:maGiuong - Update bed
router.put(
  "/:maGiuong",
  authenticate,
  authorize(["QuanTriVien"]),
  updateGiuongValidator,
  giuongController.updateGiuong
);

// Route: DELETE /api/giuong/:maGiuong - Delete bed (QuanTriVien only)
router.delete(
  "/:maGiuong",
  authenticate,
  authorize(["QuanTriVien"]),
  deleteGiuongValidator,
  giuongController.deleteGiuong
);

// Route: POST /api/giuong/:maGiuong/assign - Assign student to bed
router.post(
  "/:maGiuong/assign",
  authenticate,
  authorize(["QuanTriVien", "NhanVien"]),
  assignStudentValidator,
  giuongController.assignStudentToBed
);

// Route: POST /api/giuong/:maGiuong/remove - Remove student from bed
router.post(
  "/:maGiuong/remove",
  authenticate,
  authorize(["QuanTriVien", "NhanVien"]),
  removeStudentValidator,
  giuongController.removeStudentFromBed
);

module.exports = router;
