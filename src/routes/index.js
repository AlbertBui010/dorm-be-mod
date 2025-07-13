const express = require("express");
const authRoutes = require("./authRoutes");
const sinhVienRoutes = require("./sinhVienRoutes");
const phongRoutes = require("./phongRoutes");

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

module.exports = router;
