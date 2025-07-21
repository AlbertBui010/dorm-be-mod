const express = require("express");
const YeuCauChuyenPhongController = require("../controllers/yeuCauChuyenPhongController");
const {
  authenticate,
  authorizeEmployee,
  authorizeStudent,
} = require("../middleware/auth");
const { handleValidationErrors } = require("../middleware/validation");
const {
  getAllYeuCauValidation,
  getYeuCauByIdValidation,
  createYeuCauValidation,
  updateYeuCauValidation,
  approveYeuCauValidation,
  rejectYeuCauValidation,
  getYeuCauBySinhVienValidation,
} = require("../validators/yeuCauChuyenPhongValidator");

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// GET /api/yeu-cau-chuyen-phong/my-requests - Get my yêu cầu chuyển phòng (SinhVien)
router.get(
  "/my-requests",
  authorizeStudent,
  YeuCauChuyenPhongController.getMyYeuCau
);

// POST /api/yeu-cau-chuyen-phong/my-requests - Create my yêu cầu chuyển phòng (SinhVien)
router.post(
  "/my-requests",
  authorizeStudent,
  createYeuCauValidation,
  handleValidationErrors,
  YeuCauChuyenPhongController.createMyYeuCau
);

// GET /api/yeu-cau-chuyen-phong/stats - Get yêu cầu chuyển phòng statistics
router.get(
  "/stats",
  authorizeEmployee("QuanTriVien", "NhanVien"),
  YeuCauChuyenPhongController.getYeuCauStats
);

// GET /api/yeu-cau-chuyen-phong/available-rooms-beds - Get available rooms and beds
router.get(
  "/available-rooms-beds",
  YeuCauChuyenPhongController.getAvailableRoomsAndBeds
);

// GET /api/yeu-cau-chuyen-phong - Get all yêu cầu chuyển phòng with filtering and pagination
router.get(
  "/",
  authorizeEmployee("QuanTriVien", "NhanVien"),
  getAllYeuCauValidation,
  handleValidationErrors,
  YeuCauChuyenPhongController.getAllYeuCau
);

// GET /api/yeu-cau-chuyen-phong/:maYeuCau - Get yêu cầu chuyển phòng by ID (Admin/Employee)
router.get(
  "/:maYeuCau",
  authorizeEmployee("QuanTriVien", "NhanVien"),
  getYeuCauByIdValidation,
  handleValidationErrors,
  YeuCauChuyenPhongController.getYeuCauById
);

// GET /api/yeu-cau-chuyen-phong/my-requests/:maYeuCau - Get my yêu cầu chuyển phòng detail (SinhVien)
router.get(
  "/my-requests/:maYeuCau",
  authorizeStudent,
  getYeuCauByIdValidation,
  handleValidationErrors,
  YeuCauChuyenPhongController.getMyYeuCauById
);

// POST /api/yeu-cau-chuyen-phong - Create new yêu cầu chuyển phòng
router.post(
  "/",
  authorizeEmployee("QuanTriVien", "NhanVien"),
  createYeuCauValidation,
  handleValidationErrors,
  YeuCauChuyenPhongController.createYeuCau
);

// PUT /api/yeu-cau-chuyen-phong/:maYeuCau - Update yêu cầu chuyển phòng
router.put(
  "/:maYeuCau",
  authorizeEmployee("QuanTriVien", "NhanVien"),
  updateYeuCauValidation,
  handleValidationErrors,
  YeuCauChuyenPhongController.updateYeuCau
);

// POST /api/yeu-cau-chuyen-phong/:maYeuCau/approve - Approve yêu cầu chuyển phòng
router.post(
  "/:maYeuCau/approve",
  authorizeEmployee("QuanTriVien", "NhanVien"),
  approveYeuCauValidation,
  handleValidationErrors,
  YeuCauChuyenPhongController.approveYeuCau
);

// POST /api/yeu-cau-chuyen-phong/:maYeuCau/reject - Reject yêu cầu chuyển phòng
router.post(
  "/:maYeuCau/reject",
  authorizeEmployee("QuanTriVien", "NhanVien"),
  rejectYeuCauValidation,
  handleValidationErrors,
  YeuCauChuyenPhongController.rejectYeuCau
);

// GET /api/yeu-cau-chuyen-phong/sinh-vien/:maSinhVien - Get yêu cầu chuyển phòng by sinh viên
router.get(
  "/sinh-vien/:maSinhVien",
  authorizeEmployee("QuanTriVien", "NhanVien"),
  getYeuCauBySinhVienValidation,
  handleValidationErrors,
  YeuCauChuyenPhongController.getYeuCauBySinhVien
);

module.exports = router;
