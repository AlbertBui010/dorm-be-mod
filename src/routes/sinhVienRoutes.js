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

// GET /api/sinh-vien/stats - Get student statistics (must be before /:maSinhVien)
router.get("/stats", SinhVienController.getStudentStats);

// GET /api/sinh-vien - Get all students
router.get("/", SinhVienController.getAllSinhVien);

// GET /api/sinh-vien/:maSinhVien - Get student by ID
router.get("/:maSinhVien", SinhVienController.getSinhVienById);

// POST /api/sinh-vien - Create new student (QuanTriVien only)
router.post(
  "/",
  authorizeEmployee("QuanTriVien", "QuanLy"),
  createSinhVienValidation,
  handleValidationErrors,
  SinhVienController.createSinhVien
);

// PUT /api/sinh-vien/:maSinhVien - Update student (QuanTriVien only)
router.put(
  "/:maSinhVien",
  authorizeEmployee("QuanTriVien", "QuanLy"),
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

// GET /api/sinh-vien/:maSinhVien/check-related - Check related records (QuanTriVien only)
router.get(
  "/:maSinhVien/check-related",
  authorizeEmployee("QuanTriVien", "QuanLy"),
  SinhVienController.checkRelatedRecords
);

// DELETE /api/sinh-vien/:maSinhVien - Delete student (QuanTriVien only)
router.delete(
  "/:maSinhVien",
  authorizeEmployee("QuanTriVien"),
  SinhVienController.deleteSinhVien
);

module.exports = router;
