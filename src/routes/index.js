const express = require("express");
const authRoutes = require("./authRoutes");
const sinhVienRoutes = require("./sinhVienRoutes");
const phongRoutes = require("./phongRoutes");
const nhanVienRoutes = require("./nhanVienRoutes");
const giuongRoutes = require("./giuongRoutes");
const donGiaDienNuocRoutes = require("./donGiaDienNuocRoutes");
const registrationRoutes = require("./registrationRoutes");
const registrationApprovalRoutes = require("./registrationApprovalRoutes");
const paymentRoutes = require("./paymentRoutes");
const chiSoDienNuocRoutes = require("./chiSoDienNuocRoutes");
const yeuCauChuyenPhongRoutes = require("./yeuCauChuyenPhongRoutes");
const lichSuOPhongRoutes = require("./lichSuOPhongRoutes");

const router = express.Router();

// Health check endpoint
router.get("/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    service: "KyTucXa Backend API",
  });
});

// API routes
router.use("/auth", authRoutes);
router.use("/sinh-vien", sinhVienRoutes);
router.use("/phong", phongRoutes);
router.use("/nhan-vien", nhanVienRoutes);
router.use("/giuong", giuongRoutes);
router.use("/don-gia-dien-nuoc", donGiaDienNuocRoutes);
router.use("/registration", registrationRoutes);
router.use("/registration-approval", registrationApprovalRoutes);
router.use("/payments", paymentRoutes);
router.use("/chi-so-dien-nuoc", chiSoDienNuocRoutes);
router.use("/yeu-cau-chuyen-phong", yeuCauChuyenPhongRoutes);
router.use("/lich-su-o-phong", lichSuOPhongRoutes);

module.exports = router;
