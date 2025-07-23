const express = require("express");
const SinhVienController = require("../controllers/sinhVienController");
const { authenticate, authorizeEmployee } = require("../middleware/auth");
const { handleValidationErrors } = require("../middleware/validation");
const {
  createSinhVienValidation,
  updateSinhVienValidation,
} = require("../validators/sinhVienValidator");

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// GET /api/sinh-vien/without-bed - Get students without bed (must be before /:maSinhVien)
router.get("/without-bed", SinhVienController.getSinhVienWithoutBed);

// GET /api/sinhvien/stats - Get student statistics
router.get(
  "/stats",
  authorizeEmployee("QuanTriVien", "NhanVien"),
  SinhVienController.getStudentStats
);

// GET /api/sinhvien - Get all students with filtering and pagination
router.get(
  "/",
  authorizeEmployee("QuanTriVien", "NhanVien"),
  SinhVienController.getAllSinhVien
);

// GET /api/sinhvien/:maSinhVien - Get student by ID
router.get(
  "/:maSinhVien",
  authorizeEmployee("QuanTriVien", "NhanVien"),
  SinhVienController.getSinhVienById
);

// POST /api/sinhvien - Create new student
router.post(
  "/",
  authorizeEmployee("QuanTriVien", "NhanVien"),
  createSinhVienValidation,
  handleValidationErrors,
  SinhVienController.createSinhVien
);

// PUT /api/sinhvien/:maSinhVien - Update student
router.put(
  "/:maSinhVien",
  authorizeEmployee("QuanTriVien", "NhanVien"),
  updateSinhVienValidation,
  handleValidationErrors,
  SinhVienController.updateSinhVien
);

// PATCH /api/sinh-vien/:maSinhVien/toggle-status - Toggle student status (QuanTriVien only)
router.patch(
  "/:maSinhVien/toggle-status",
  authorizeEmployee("QuanTriVien", "QuanLy"),
  SinhVienController.toggleStudentStatus
);

// GET /api/sinh-vien/:maSinhVien/check-related - Check related records
router.get(
  "/:maSinhVien/check-related",
  authorizeEmployee("QuanTriVien", "NhanVien"),
  SinhVienController.checkRelatedRecords
);

// DELETE /api/sinhvien/:maSinhVien - Delete student (QuanTriVien only)
router.delete(
  "/:maSinhVien",
  authorizeEmployee("QuanTriVien"),
  SinhVienController.deleteSinhVien
);
router.put(
  "/:maSinhVien/check-in",
  authorizeEmployee("QuanTriVien", "NhanVien"),
  SinhVienController.checkIn
);
router.put(
  "/:maSinhVien/check-out",
  authorizeEmployee("QuanTriVien", "NhanVien"),
  SinhVienController.checkOut
);

module.exports = router;
