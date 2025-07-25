const express = require("express");
const router = express.Router();
const donGiaDienNuocController = require("../controllers/donGiaDienNuocController");
const {
  createDonGiaValidator,
  updateDonGiaValidator,
  deleteDonGiaValidator,
} = require("../validators/donGiaDienNuocValidator");
const { authenticate, authorize } = require("../middleware/auth");
const { handleValidationErrors } = require("../middleware/validation");

// Áp dụng middleware auth cho tất cả các route
router.use(authenticate);

// GET /api/don-gia-dien-nuoc - Lấy tất cả đơn giá với phân trang
router.get(
  "/",
  authorize(["QuanTriVien", "NhanVien"]),
  donGiaDienNuocController.getAllDonGia
);

// GET /api/don-gia-dien-nuoc/current - Lấy đơn giá hiện hành
router.get("/current", donGiaDienNuocController.getCurrentDonGia);

// GET /api/don-gia-dien-nuoc/:id - Lấy đơn giá theo ID
router.get(
  "/:id",
  authorize(["QuanTriVien", "NhanVien"]),
  donGiaDienNuocController.getDonGiaById
);

// GET /api/don-gia-dien-nuoc/:id/check-related - Kiểm tra bản ghi liên quan
router.get("/:id/check-related", donGiaDienNuocController.checkRelatedRecords);

// GET /api/don-gia-dien-nuoc/:id/can-edit - Kiểm tra có thể chỉnh sửa
router.get("/:id/can-edit", donGiaDienNuocController.checkCanEdit);

// GET /api/don-gia-dien-nuoc/:id/can-delete - Kiểm tra có thể xóa
router.get("/:id/can-delete", donGiaDienNuocController.checkCanDelete);

// POST /api/don-gia-dien-nuoc - Tạo đơn giá mới
router.post(
  "/",
  authorize(["QuanTriVien", "NhanVien"]),
  createDonGiaValidator,
  handleValidationErrors,
  donGiaDienNuocController.createDonGia
);

// PUT /api/don-gia-dien-nuoc/:id - Cập nhật đơn giá
router.put(
  "/:id",
  authorize(["QuanTriVien", "NhanVien"]),
  updateDonGiaValidator,
  handleValidationErrors,
  donGiaDienNuocController.updateDonGia
);

// DELETE /api/don-gia-dien-nuoc/:id - Xóa đơn giá (chỉ QuanTriVien)
router.delete(
  "/:id",
  authorize(["QuanTriVien"]),
  deleteDonGiaValidator,
  handleValidationErrors,
  donGiaDienNuocController.deleteDonGia
);

module.exports = router;
