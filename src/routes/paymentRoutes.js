const express = require("express");
const router = express.Router();
const paymentController = require("../controllers/paymentController");
const {
  authenticate,
  authorizeStudent,
  authorizeAdmin,
} = require("../middleware/auth");

// ===== ADMIN ROUTES (Must be before student routes to avoid conflicts) =====

/**
 * @route GET /api/payments/admin
 * @desc Lấy danh sách tất cả thanh toán (Admin)
 * @access Private (Admin only)
 */
router.get(
  "/admin",
  authenticate,
  authorizeAdmin,
  paymentController.getAllPayments
);

/**
 * @route GET /api/payments/admin/stats
 * @desc Lấy thống kê tổng hợp thanh toán (Admin)
 * @access Private (Admin only)
 */
router.get(
  "/admin/stats",
  authenticate,
  authorizeAdmin,
  paymentController.getAdminPaymentStats
);

/**
 * @route POST /api/payments/admin/:maThanhToan/approve-cash
 * @desc Phê duyệt thanh toán tiền mặt (Admin)
 * @access Private (Admin only)
 */
router.post(
  "/admin/:maThanhToan/approve-cash",
  authenticate,
  authorizeAdmin,
  paymentController.approveCashPayment
);

/**
 * @route POST /api/payments/admin/:maThanhToan/reject-cash
 * @desc Từ chối thanh toán tiền mặt (Admin)
 * @access Private (Admin only)
 */
router.post(
  "/admin/:maThanhToan/reject-cash",
  authenticate,
  authorizeAdmin,
  paymentController.rejectCashPayment
);

/**
 * @route POST /api/payments/mark-overdue
 * @desc API cho admin đánh dấu thanh toán quá hạn
 * @access Private (Admin only)
 */
router.post(
  "/mark-overdue",
  authenticate,
  authorizeAdmin,
  paymentController.markOverduePayments
);

// ===== STUDENT ROUTES =====

/**
 * @route GET /api/payments
 * @desc Lấy danh sách thanh toán của sinh viên
 * @access Private (Student)
 */
router.get(
  "/",
  authenticate,
  authorizeStudent,
  paymentController.getMyPayments
);

/**
 * @route GET /api/payments/stats
 * @desc Lấy thống kê thanh toán của sinh viên
 * @access Private (Student)
 */
router.get(
  "/stats",
  authenticate,
  authorizeStudent,
  paymentController.getPaymentStats
);

/**
 * @route GET /api/payments/:maThanhToan
 * @desc Lấy chi tiết thanh toán
 * @access Private (Student)
 */
router.get(
  "/:maThanhToan",
  authenticate,
  authorizeStudent,
  paymentController.getPaymentDetail
);

/**
 * @route GET /api/payments/:maThanhToan/status
 * @desc Kiểm tra trạng thái thanh toán
 * @access Private (Student)
 */
router.get(
  "/:maThanhToan/status",
  authenticate,
  authorizeStudent,
  paymentController.checkPaymentStatus
);

/**
 * @route POST /api/payments/:maThanhToan/create-payment-link
 * @desc Tạo link thanh toán chuyển khoản qua PayOS
 * @access Private (Student)
 */
router.post(
  "/:maThanhToan/create-payment-link",
  authenticate,
  authorizeStudent,
  paymentController.createPaymentLink
);

/**
 * @route POST /api/payments/:maThanhToan/cash-payment
 * @desc Xử lý thanh toán tiền mặt
 * @access Private (Student)
 */
router.post(
  "/:maThanhToan/cash-payment",
  authenticate,
  authorizeStudent,
  paymentController.processCashPayment
);

/**
 * @route POST /api/payments/webhook/payos
 * @desc Webhook xử lý kết quả thanh toán từ PayOS
 * @access Public (PayOS Webhook)
 */
router.post("/webhook/payos", paymentController.handlePayOSWebhook);

/**
 * @route GET /api/payments/return
 * @desc Redirect handler cho PayOS return URL
 * @access Public
 */
router.get("/return", paymentController.handlePaymentReturn);

/**
 * @route GET /api/payments/cancel
 * @desc Cancel handler cho PayOS cancel URL
 * @access Public
 */
router.get("/cancel", paymentController.handlePaymentCancel);

module.exports = router;
