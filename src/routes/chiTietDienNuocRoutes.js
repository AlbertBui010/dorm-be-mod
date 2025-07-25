const express = require("express");
const router = express.Router();
const chiTietDienNuocController = require("../controllers/chiTietDienNuocController");
const { authenticate, authorize } = require("../middleware/auth");

router.use(authenticate);

// Sinh viên lấy chi tiết điện nước của mình
router.get("/me", chiTietDienNuocController.getMyChiTietDienNuoc);

// Lấy tất cả chi tiết điện nước hoặc filter qua query
router.get(
  "/",
  authorize(["QuanTriVien", "NhanVien"]),
  chiTietDienNuocController.getChiTietDienNuoc
);

// Lấy chi tiết điện nước theo ID (primary key)
router.get(
  "/:id",
  authorize(["QuanTriVien", "NhanVien"]),
  chiTietDienNuocController.getChiTietDienNuocById
);

module.exports = router;
