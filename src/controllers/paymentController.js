const paymentService = require("../services/paymentService");

class PaymentController {
  /**
   * Lấy danh sách thanh toán của sinh viên đang đăng nhập
   * GET /api/payments
   */
  async getMyPayments(req, res) {
    try {
      const maSinhVien = req.user.MaSinhVien; // Từ middleware auth
      const { page = 1, limit = 10, trangThai } = req.query;

      const result = await paymentService.getStudentPayments(maSinhVien, {
        page: parseInt(page),
        limit: parseInt(limit),
        trangThai,
      });

      if (!result.success) {
        return res.status(400).json({
          success: false,
          message: result.message,
          errors: result.errors,
        });
      }

      return res.status(200).json({
        success: true,
        message: result.message,
        data: result.data,
      });
    } catch (error) {
      console.error("Error in getMyPayments:", error);
      return res.status(500).json({
        success: false,
        message: "Lỗi hệ thống",
      });
    }
  }

  /**
   * Lấy chi tiết thanh toán
   * GET /api/payments/:maThanhToan
   */
  async getPaymentDetail(req, res) {
    try {
      const { maThanhToan } = req.params;
      const maSinhVien = req.user.MaSinhVien;

      const result = await paymentService.getPaymentDetail(
        maThanhToan,
        maSinhVien
      );

      if (!result.success) {
        return res.status(400).json({
          success: false,
          message: result.message,
        });
      }

      return res.status(200).json({
        success: true,
        message: result.message,
        data: result.data,
      });
    } catch (error) {
      console.error("Error in getPaymentDetail:", error);
      return res.status(500).json({
        success: false,
        message: "Lỗi hệ thống",
      });
    }
  }

  /**
   * Tạo link thanh toán PayOS
   * POST /api/payments/:maThanhToan/create-payment-link
   */
  async createPaymentLink(req, res) {
    try {
      const { maThanhToan } = req.params;
      const maSinhVien = req.user.MaSinhVien;

      const result = await paymentService.createPaymentLink(
        maThanhToan,
        maSinhVien
      );

      if (!result.success) {
        return res.status(400).json({
          success: false,
          message: result.message,
          errors: result.errors,
        });
      }

      return res.status(200).json({
        success: true,
        message: result.message,
        data: result.data,
      });
    } catch (error) {
      console.error("Error in createPaymentLink:", error);
      return res.status(500).json({
        success: false,
        message: "Lỗi hệ thống",
      });
    }
  }

  /**
   * Xử lý thanh toán tiền mặt
   * POST /api/payments/:maThanhToan/cash-payment
   */
  async processCashPayment(req, res) {
    try {
      const { maThanhToan } = req.params;
      const maSinhVien = req.user.MaSinhVien;

      const result = await paymentService.processCashPayment(
        maThanhToan,
        maSinhVien
      );

      if (!result.success) {
        return res.status(400).json({
          success: false,
          message: result.message,
          errors: result.errors,
        });
      }

      return res.status(200).json({
        success: true,
        message: result.message,
        data: result.data,
      });
    } catch (error) {
      console.error("Error in processCashPayment:", error);
      return res.status(500).json({
        success: false,
        message: "Lỗi hệ thống",
      });
    }
  }

  /**
   * Webhook xử lý kết quả thanh toán từ PayOS
   * POST /api/payments/webhook/payos
   */
  async handlePayOSWebhook(req, res) {
    try {
      console.log("🔔 PayOS Webhook received:");
      console.log("Headers:", JSON.stringify(req.headers, null, 2));
      console.log("Body:", JSON.stringify(req.body, null, 2));

      const webhookData = req.body;

      // PayOS sends signature in body, not headers
      const signature =
        webhookData.signature ||
        req.headers["x-signature"] ||
        req.headers["signature"] ||
        req.headers["payos-signature"];

      console.log("🔐 Signature found:", signature ? "✅ Yes" : "❌ No");
      console.log("📝 Signature value:", signature);

      if (!signature) {
        console.log("❌ Missing signature in both body and headers");
        return res.status(400).json({
          error: "Missing signature",
          receivedHeaders: Object.keys(req.headers),
          bodyKeys: Object.keys(webhookData),
          message: "Signature not found in body or headers",
        });
      }

      // Extract payment data (without signature for verification)
      const { signature: _, ...paymentData } = webhookData;

      const result = await paymentService.handlePayOSWebhook({
        data: paymentData,
        signature,
      });

      console.log("📊 Webhook processing result:", result);

      if (!result.success) {
        console.log("❌ Webhook processing failed:", result.message);
        return res.status(400).json({ message: result.message });
      }

      console.log("✅ Webhook processed successfully");
      return res
        .status(200)
        .json({ message: "Webhook processed successfully" });
    } catch (error) {
      console.error("💥 Error in handlePayOSWebhook:", error);
      return res.status(500).json({
        message: "Webhook processing failed",
        error: error.message,
      });
    }
  }

  /**
   * Lấy thống kê thanh toán của sinh viên
   * GET /api/payments/stats
   */
  async getPaymentStats(req, res) {
    try {
      const maSinhVien = req.user.MaSinhVien;

      const result = await paymentService.getPaymentStats(maSinhVien);

      if (!result.success) {
        return res.status(400).json({
          success: false,
          message: result.message,
          errors: result.errors,
        });
      }

      return res.status(200).json({
        success: true,
        message: result.message,
        data: result.data,
      });
    } catch (error) {
      console.error("Error in getPaymentStats:", error);
      return res.status(500).json({
        success: false,
        message: "Lỗi hệ thống",
      });
    }
  }

  /**
   * Kiểm tra trạng thái thanh toán
   * GET /api/payments/:maThanhToan/status
   */
  async checkPaymentStatus(req, res) {
    try {
      const { maThanhToan } = req.params;
      const maSinhVien = req.user.MaSinhVien;

      const result = await paymentService.getPaymentDetail(
        maThanhToan,
        maSinhVien
      );

      if (!result.success) {
        return res.status(400).json({
          success: false,
          message: result.message,
        });
      }

      return res.status(200).json({
        success: true,
        data: {
          maThanhToan: result.data.MaThanhToan,
          trangThai: result.data.TrangThai,
          soTien: result.data.SoTien,
          hinhThuc: result.data.HinhThuc,
          ngayThanhToan: result.data.NgayThanhToan,
        },
        message: "Lấy trạng thái thanh toán thành công",
      });
    } catch (error) {
      console.error("Error in checkPaymentStatus:", error);
      return res.status(500).json({
        success: false,
        message: "Lỗi hệ thống",
      });
    }
  }

  /**
   * API cho admin đánh dấu thanh toán quá hạn (chạy manually hoặc cron job)
   * POST /api/payments/mark-overdue
   */
  async markOverduePayments(req, res) {
    try {
      // Kiểm tra quyền admin (implement theo hệ thống auth hiện tại)
      if (req.user.role !== "admin") {
        return res.status(403).json({
          success: false,
          message: "Không có quyền thực hiện thao tác này",
        });
      }

      const result = await paymentService.markOverduePayments();

      if (!result.success) {
        return res.status(400).json({
          success: false,
          message: result.message,
          errors: result.errors,
        });
      }

      return res.status(200).json({
        success: true,
        message: result.message,
        data: result.data,
      });
    } catch (error) {
      console.error("Error in markOverduePayments:", error);
      return res.status(500).json({
        success: false,
        message: "Lỗi hệ thống",
      });
    }
  }

  /**
   * Redirect handler cho PayOS return URL
   * GET /api/payments/return
   */
  async handlePaymentReturn(req, res) {
    try {
      const { orderCode, status } = req.query;

      if (status === "PAID") {
        // Redirect to success page
        return res.redirect(
          `${process.env.FRONTEND_URL}/payments/success?orderCode=${orderCode}`
        );
      } else if (status === "CANCELLED") {
        // Redirect to cancel page
        return res.redirect(
          `${process.env.FRONTEND_URL}/payments/cancelled?orderCode=${orderCode}`
        );
      } else {
        // Redirect to failure page
        return res.redirect(
          `${process.env.FRONTEND_URL}/payments/failed?orderCode=${orderCode}`
        );
      }
    } catch (error) {
      console.error("Error in handlePaymentReturn:", error);
      return res.redirect(`${process.env.FRONTEND_URL}/payments/failed`);
    }
  }

  /**
   * Cancel handler cho PayOS cancel URL
   * GET /api/payments/cancel
   */
  async handlePaymentCancel(req, res) {
    try {
      const { orderCode } = req.query;

      // Có thể cập nhật trạng thái thanh toán về CHUA_THANH_TOAN nếu cần
      // const result = await paymentService.cancelPayment(orderCode);

      return res.redirect(
        `${process.env.FRONTEND_URL}/payments/cancelled?orderCode=${orderCode}`
      );
    } catch (error) {
      console.error("Error in handlePaymentCancel:", error);
      return res.redirect(`${process.env.FRONTEND_URL}/payments/failed`);
    }
  }

  // ===== ADMIN METHODS =====

  /**
   * Lấy danh sách tất cả thanh toán (Admin)
   * GET /api/admin/payments
   */
  async getAllPayments(req, res) {
    try {
      const {
        page = 1,
        limit = 10,
        search = "",
        status = "",
        type = "",
        month = "",
        startDate = "",
        endDate = "",
      } = req.query;

      const result = await paymentService.getAllPayments({
        page: parseInt(page),
        limit: parseInt(limit),
        search,
        status,
        type,
        month,
        startDate,
        endDate,
      });

      if (!result.success) {
        return res.status(400).json({
          success: false,
          message: result.message,
          errors: result.errors,
        });
      }

      return res.status(200).json({
        success: true,
        message: result.message,
        data: result.data,
      });
    } catch (error) {
      console.error("Error in getAllPayments:", error);
      return res.status(500).json({
        success: false,
        message: "Lỗi hệ thống",
      });
    }
  }

  /**
   * Lấy thống kê tổng hợp thanh toán (Admin)
   * GET /api/admin/payments/stats
   */
  async getAdminPaymentStats(req, res) {
    try {
      const result = await paymentService.getAdminPaymentStats();

      if (!result.success) {
        return res.status(400).json({
          success: false,
          message: result.message,
        });
      }

      return res.status(200).json({
        success: true,
        message: result.message,
        data: result.data,
      });
    } catch (error) {
      console.error("Error in getAdminPaymentStats:", error);
      return res.status(500).json({
        success: false,
        message: "Lỗi hệ thống",
      });
    }
  }

  /**
   * Phê duyệt thanh toán tiền mặt (Admin)
   * POST /api/admin/payments/:maThanhToan/approve-cash
   */
  async approveCashPayment(req, res) {
    try {
      const { maThanhToan } = req.params;
      const { note } = req.body;
      const adminId = req.user.MaNhanVien;

      const result = await paymentService.approveCashPayment(maThanhToan, {
        adminId,
        note,
      });

      if (!result.success) {
        return res.status(400).json({
          success: false,
          message: result.message,
        });
      }

      return res.status(200).json({
        success: true,
        message: result.message,
        data: result.data,
      });
    } catch (error) {
      console.error("Error in approveCashPayment:", error);
      return res.status(500).json({
        success: false,
        message: "Lỗi hệ thống",
      });
    }
  }

  /**
   * Từ chối thanh toán tiền mặt (Admin)
   * POST /api/admin/payments/:maThanhToan/reject-cash
   */
  async rejectCashPayment(req, res) {
    try {
      const { maThanhToan } = req.params;
      const { reason } = req.body;
      const adminId = req.user.MaNhanVien;

      const result = await paymentService.rejectCashPayment(maThanhToan, {
        adminId,
        reason,
      });

      if (!result.success) {
        return res.status(400).json({
          success: false,
          message: result.message,
        });
      }

      return res.status(200).json({
        success: true,
        message: result.message,
        data: result.data,
      });
    } catch (error) {
      console.error("Error in rejectCashPayment:", error);
      return res.status(500).json({
        success: false,
        message: "Lỗi hệ thống",
      });
    }
  }
}

module.exports = new PaymentController();
