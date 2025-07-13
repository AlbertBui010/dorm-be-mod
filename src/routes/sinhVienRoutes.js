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

// GET /api/sinh-vien - Get all students
router.get("/", SinhVienController.getAllSinhVien);

// GET /api/sinh-vien/:maSinhVien - Get student by ID
router.get("/:maSinhVien", SinhVienController.getSinhVienById);

// POST /api/sinh-vien - Create new student (Admin only)
router.post(
  "/",
  authorizeEmployee("Admin", "QuanLy"),
  createSinhVienValidation,
  handleValidationErrors,
  SinhVienController.createSinhVien
);

// PUT /api/sinh-vien/:maSinhVien - Update student (Admin only)
router.put(
  "/:maSinhVien",
  authorizeEmployee("Admin", "QuanLy"),
  updateSinhVienValidation,
  handleValidationErrors,
  SinhVienController.updateSinhVien
);

// DELETE /api/sinh-vien/:maSinhVien - Delete student (Admin only)
router.delete(
  "/:maSinhVien",
  authorizeEmployee("Admin"),
  SinhVienController.deleteSinhVien
);

module.exports = router;
