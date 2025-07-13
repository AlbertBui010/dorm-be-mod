const express = require("express");
const SinhVienController = require("../controllers/sinhVienController");
const { authenticate, authorize } = require("../middleware/auth");
const { handleValidationErrors } = require("../middleware/validation");
const {
  createSinhVienValidation,
  updateSinhVienValidation,
} = require("../validators/sinhVienValidator");

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// GET /api/sinh-vien - Get all students
router.get("/", SinhVienController.getAllSinhVien);

// GET /api/sinh-vien/:maSinhVien - Get student by ID
router.get("/:maSinhVien", SinhVienController.getSinhVienById);

// POST /api/sinh-vien - Create new student (Admin only)
router.post(
  "/",
  authorize("Admin", "QuanLy"),
  createSinhVienValidation,
  handleValidationErrors,
  SinhVienController.createSinhVien
);

// PUT /api/sinh-vien/:maSinhVien - Update student (Admin only)
router.put(
  "/:maSinhVien",
  authorize("Admin", "QuanLy"),
  updateSinhVienValidation,
  handleValidationErrors,
  SinhVienController.updateSinhVien
);

// DELETE /api/sinh-vien/:maSinhVien - Delete student (Admin only)
router.delete(
  "/:maSinhVien",
  authorize("Admin"),
  SinhVienController.deleteSinhVien
);

module.exports = router;
