const express = require("express");
const router = express.Router();
const registrationApprovalController = require("../controllers/registrationApprovalController");
const { authenticate } = require("../middleware/auth");

// Routes - Đơn giản hóa validation để tránh lỗi
// GET /api/registration-approval - Lấy danh sách đăng ký chờ duyệt
router.get(
  "/",
  authenticate,
  registrationApprovalController.getPendingRegistrations
);

// GET /api/registration-approval/stats - Thống kê tổng quan
router.get(
  "/stats",
  authenticate,
  registrationApprovalController.getRegistrationStats
);

// GET /api/registration-approval/:maDangKy - Chi tiết đăng ký
router.get(
  "/:maDangKy",
  authenticate,
  registrationApprovalController.getRegistrationDetail
);

// GET /api/registration-approval/:maDangKy/available-rooms - Tìm phòng phù hợp
router.get(
  "/:maDangKy/available-rooms",
  authenticate,
  registrationApprovalController.findAvailableRooms
);

// POST /api/registration-approval/:maDangKy/approve - Duyệt đăng ký
router.post(
  "/:maDangKy/approve",
  authenticate,
  registrationApprovalController.approveRegistration
);

// POST /api/registration-approval/:maDangKy/reject - Từ chối đăng ký
router.post(
  "/:maDangKy/reject",
  authenticate,
  registrationApprovalController.rejectRegistration
);

module.exports = router;
