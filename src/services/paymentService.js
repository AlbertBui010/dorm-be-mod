const { Op } = require("sequelize");
const sequelize = require("../config/database");
const ThanhToan = require("../models/ThanhToan");
const SinhVien = require("../models/SinhVien");
const Phong = require("../models/Phong");
const payos = require("../utils/payos");
const crypto = require("crypto");
const { PAYMENT_METHOD, PAYMENT_STATUS } = require("../constants/payment");

class PaymentService {
  /**
   * Lấy danh sách thanh toán của sinh viên
   */
  async getStudentPayments(maSinhVien, { page = 1, limit = 10, trangThai }) {
    try {
      const offset = (page - 1) * limit;
      const whereConditions = {
        MaSinhVien: maSinhVien,
      };

      if (trangThai) {
        whereConditions.TrangThai = trangThai;
      }

      const { count, rows } = await ThanhToan.findAndCountAll({
        where: whereConditions,
        include: [
          {
            model: Phong,
            as: "Phong",
            attributes: ["SoPhong", "LoaiPhong"],
            required: false,
          },
          {
            model: SinhVien,
            as: "SinhVien",
            attributes: ["HoTen", "Email"],
            required: false,
          },
        ],
        limit,
        offset,
        order: [["NgayTao", "DESC"]],
      });

      return {
        success: true,
        data: {
          payments: rows,
          pagination: {
            total: count,
            totalPages: Math.ceil(count / limit),
            currentPage: page,
            limit,
          },
        },
        message: "Lấy danh sách thanh toán thành công",
      };
    } catch (error) {
      console.error("Error in getStudentPayments:", error);
      return {
        success: false,
        message: "Có lỗi xảy ra khi lấy danh sách thanh toán",
        errors: [error.message],
      };
    }
  }

  /**
   * Lấy chi tiết thanh toán
   */
  async getPaymentDetail(maThanhToan, maSinhVien) {
    try {
      const payment = await ThanhToan.findOne({
        where: {
          MaThanhToan: maThanhToan,
          MaSinhVien: maSinhVien, // Đảm bảo sinh viên chỉ xem được thanh toán của mình
        },
        include: [
          {
            model: Phong,
            as: "Phong",
            attributes: ["SoPhong", "LoaiPhong", "GiaThueThang"],
            required: false,
          },
          {
            model: SinhVien,
            as: "SinhVien",
            attributes: ["HoTen", "Email", "SoDienThoai"],
            required: false,
          },
        ],
      });

      if (!payment) {
        return {
          success: false,
          message: "Không tìm thấy thanh toán",
        };
      }

      return {
        success: true,
        data: payment,
        message: "Lấy chi tiết thanh toán thành công",
      };
    } catch (error) {
      console.error("Error in getPaymentDetail:", error);
      return {
        success: false,
        message: "Có lỗi xảy ra khi lấy chi tiết thanh toán",
        errors: [error.message],
      };
    }
  }

  /**
   * Tạo link thanh toán PayOS cho chuyển khoản
   */
  async createPaymentLink(maThanhToan, maSinhVien) {
    const transaction = await sequelize.transaction();

    try {
      // Kiểm tra thanh toán
      const payment = await ThanhToan.findOne({
        where: {
          MaThanhToan: maThanhToan,
          MaSinhVien: maSinhVien,
          TrangThai: "CHUA_THANH_TOAN",
        },
        include: [
          {
            model: Phong,
            as: "Phong",
            attributes: ["SoPhong"],
            required: false,
          },
          {
            model: SinhVien,
            as: "SinhVien",
            attributes: ["HoTen", "Email", "SoDienThoai"],
            required: false,
          },
        ],
        transaction,
      });

      if (!payment) {
        await transaction.rollback();
        return {
          success: false,
          message: "Không tìm thấy thanh toán hoặc thanh toán đã được xử lý",
        };
      }

      // Tạo order code unique
      const orderCode = Number(`${payment.MaThanhToan}${Date.now() % 1000000}`);
      const amount = Number(payment.SoTien);

      // Thông tin thanh toán
      const description = `P${payment.Phong?.SoPhong || "N/A"}-${
        payment.ThangNam
      }`;

      const paymentData = {
        orderCode,
        amount,
        description,
        returnUrl: process.env.PAYOS_RETURN_URL,
        cancelUrl: process.env.PAYOS_CANCEL_URL,
        items: [
          {
            name: `${payment.LoaiThanhToan} - ${payment.ThangNam}`,
            quantity: 1,
            price: amount,
          },
        ],
        buyer: {
          fullName: payment.SinhVien?.HoTen || "Sinh viên",
          email: payment.SinhVien?.Email || "",
          phone: payment.SinhVien?.SoDienThoai || "",
        },
      };

      // Tạo payment link với PayOS
      const payosResult = await payos.createPaymentLink(paymentData);

      if (!payosResult?.checkoutUrl) {
        await transaction.rollback();
        return {
          success: false,
          message: "Không thể tạo link thanh toán",
        };
      }

      // Cập nhật order code và trạng thái
      await payment.update(
        {
          OrderCode: orderCode,
          TrangThai: "DANG_CHO_THANH_TOAN",
          NgayCapNhat: new Date(),
        },
        { transaction }
      );

      await transaction.commit();

      // Auto-expire sau 15 phút nếu chưa thanh toán
      setTimeout(async () => {
        try {
          const checkPayment = await ThanhToan.findByPk(payment.MaThanhToan);
          if (checkPayment?.TrangThai === "DANG_CHO_THANH_TOAN") {
            await checkPayment.update({
              TrangThai: "CHUA_THANH_TOAN",
              OrderCode: null,
            });
            console.log(`⏰ Payment ${maThanhToan} expired after 15 minutes`);
          }
        } catch (err) {
          console.error("Auto-expire error:", err);
        }
      }, 15 * 60 * 1000);

      return {
        success: true,
        data: {
          checkoutUrl: payosResult.checkoutUrl,
          qrCode: payosResult.qrCode,
          orderCode,
          amount,
          expireIn: 900, // 15 phút
        },
        message: "Tạo link thanh toán thành công",
      };
    } catch (error) {
      await transaction.rollback();
      console.error("Error in createPaymentLink:", error);
      return {
        success: false,
        message: "Có lỗi xảy ra khi tạo link thanh toán",
        errors: [error.message],
      };
    }
  }

  /**
   * Xử lý thanh toán tiền mặt (cần admin xác nhận)
   */
  async processCashPayment(maThanhToan, maSinhVien) {
    const transaction = await sequelize.transaction();

    try {
      const payment = await ThanhToan.findOne({
        where: {
          MaThanhToan: maThanhToan,
          MaSinhVien: maSinhVien,
          TrangThai: "CHUA_THANH_TOAN",
        },
        transaction,
      });

      if (!payment) {
        await transaction.rollback();
        return {
          success: false,
          message: "Không tìm thấy thanh toán hoặc thanh toán đã được xử lý",
        };
      }

      // Cập nhật trạng thái chờ xác nhận tiền mặt
      await payment.update(
        {
          HinhThuc: PAYMENT_METHOD.TIEN_MAT,
          TrangThai: PAYMENT_STATUS.CHO_XAC_NHAN,
          NgayCapNhat: new Date(),
        },
        { transaction }
      );

      await transaction.commit();

      return {
        success: true,
        data: payment,
        message:
          "Đã gửi yêu cầu thanh toán tiền mặt. Vui lòng liên hệ văn phòng để xác nhận.",
      };
    } catch (error) {
      await transaction.rollback();
      console.error("Error in processCashPayment:", error);
      return {
        success: false,
        message: "Có lỗi xảy ra khi xử lý thanh toán tiền mặt",
        errors: [error.message],
      };
    }
  }

  /**
   * Xử lý webhook từ PayOS
   */
  async handlePayOSWebhook(webhookData) {
    const transaction = await sequelize.transaction();

    try {
      const { data, signature } = webhookData;

      console.log("🔄 Processing PayOS webhook data...");
      console.log("🎯 Webhook code:", data.code);
      console.log("🎯 Webhook desc:", data.desc);
      console.log("💳 Payment data:", data.data);

      // Verify signature (implement theo PayOS docs)
      if (!this.verifyPayOSSignature(data, signature)) {
        return {
          success: false,
          message: "Invalid signature",
        };
      }

      // Extract payment info from nested data object
      const paymentData = data.data;
      // Cast orderCode to string to match DB type
      const { orderCode, amount, reference, transactionDateTime } = paymentData;
      const orderCodeStr = String(orderCode);

      console.log("🔍 Looking for payment with orderCode:", orderCodeStr);

      // Tìm thanh toán theo order code (OrderCode is VARCHAR in DB)
      const payment = await ThanhToan.findOne({
        where: { OrderCode: orderCodeStr },
        transaction,
      });

      if (!payment) {
        await transaction.rollback();
        console.warn("❌ Payment not found for order code:", orderCode);
        return {
          success: false,
          message: "Payment not found",
        };
      }

      // Kiểm tra số tiền
      if (Number(payment.SoTien) !== Number(amount)) {
        console.warn(
          `Amount mismatch: expected ${payment.SoTien}, got ${amount}`
        );
      }

      // Cập nhật trạng thái thanh toán
      await payment.update(
        {
          TrangThai: "DA_THANH_TOAN",
          HinhThuc: "CHUYEN_KHOAN",
          NgayThanhToan: new Date(transactionDateTime || Date.now()),
          Reference: reference,
          NgayCapNhat: new Date(),
        },
        { transaction }
      );

      await transaction.commit();

      console.log(`✅ Payment ${payment.MaThanhToan} completed successfully`);

      return {
        success: true,
        message: "Payment processed successfully",
      };
    } catch (error) {
      await transaction.rollback();
      console.error("Error in handlePayOSWebhook:", error);
      return {
        success: false,
        message: "Webhook processing failed",
        errors: [error.message],
      };
    }
  }

  /**
   * Verify PayOS signature
   */
  verifyPayOSSignature(data, signature) {
    try {
      console.log("🔐 Verifying PayOS signature...");
      console.log("📋 Data to verify:", JSON.stringify(data, null, 2));
      console.log("📝 Received signature:", signature);

      const checksumKey = process.env.PAYOS_CHECKSUM_KEY;
      if (!checksumKey) {
        console.error("❌ PAYOS_CHECKSUM_KEY not found in environment");
        return false;
      }

      console.log(
        "🔑 Checksum key available:",
        checksumKey ? "✅ Yes" : "❌ No"
      );

      // For now, allow webhook in development environment for testing
      if (process.env.NODE_ENV === "development") {
        console.log(
          "🧪 Development mode: Skipping signature verification for testing"
        );
        return true;
      }

      // Build signature payload
      const sortedKeys = Object.keys(data).sort(); // sort keys for consistent order
      console.log("📊 Sorted keys:", sortedKeys);

      const signaturePayload = sortedKeys
        .map((key) => {
          let value = data[key];
          if (value === null || value === undefined) value = "";
          if (Array.isArray(value)) value = JSON.stringify(value);
          return `${key}=${value}`;
        })
        .join("&");

      console.log("📝 Signature payload:", signaturePayload);

      // Generate expected signature
      const expectedSignature = crypto
        .createHmac("sha256", checksumKey)
        .update(signaturePayload)
        .digest("hex");

      console.log("🔍 Expected signature:", expectedSignature);
      console.log("✅ Signature match:", expectedSignature === signature);

      return expectedSignature === signature;
    } catch (error) {
      console.error("💥 Error verifying signature:", error);
      return false;
    }
  }

  /**
   * Đánh dấu thanh toán quá hạn
   */
  async markOverduePayments() {
    try {
      const oneDayAgo = new Date();
      oneDayAgo.setDate(oneDayAgo.getDate() - 1);

      const [updatedCount] = await ThanhToan.update(
        {
          TrangThai: "QUA_HAN",
          NgayCapNhat: new Date(),
        },
        {
          where: {
            TrangThai: "CHUA_THANH_TOAN",
            NgayTao: {
              [Op.lt]: oneDayAgo,
            },
          },
        }
      );

      console.log(`✅ Marked ${updatedCount} payments as overdue`);

      return {
        success: true,
        data: { updatedCount },
        message: `Đã đánh dấu ${updatedCount} thanh toán quá hạn`,
      };
    } catch (error) {
      console.error("Error in markOverduePayments:", error);
      return {
        success: false,
        message: "Có lỗi xảy ra khi đánh dấu thanh toán quá hạn",
        errors: [error.message],
      };
    }
  }

  /**
   * Lấy thống kê thanh toán của sinh viên
   */
  async getPaymentStats(maSinhVien) {
    try {
      const [totalPending, totalPaid, totalOverdue, totalAmount, paidAmount] =
        await Promise.all([
          ThanhToan.count({
            where: { MaSinhVien: maSinhVien, TrangThai: "CHUA_THANH_TOAN" },
          }),
          ThanhToan.count({
            where: { MaSinhVien: maSinhVien, TrangThai: "DA_THANH_TOAN" },
          }),
          ThanhToan.count({
            where: { MaSinhVien: maSinhVien, TrangThai: "QUA_HAN" },
          }),
          ThanhToan.sum("SoTien", {
            where: { MaSinhVien: maSinhVien },
          }),
          ThanhToan.sum("SoTien", {
            where: { MaSinhVien: maSinhVien, TrangThai: "DA_THANH_TOAN" },
          }),
        ]);

      return {
        success: true,
        data: {
          totalPending: totalPending || 0,
          totalPaid: totalPaid || 0,
          totalOverdue: totalOverdue || 0,
          totalAmount: totalAmount || 0,
          paidAmount: paidAmount || 0,
          pendingAmount: (totalAmount || 0) - (paidAmount || 0),
        },
        message: "Lấy thống kê thanh toán thành công",
      };
    } catch (error) {
      console.error("Error in getPaymentStats:", error);
      return {
        success: false,
        message: "Có lỗi xảy ra khi lấy thống kê thanh toán",
        errors: [error.message],
      };
    }
  }

  // ===== ADMIN METHODS =====

  /**
   * Lấy danh sách tất cả thanh toán (Admin)
   */
  async getAllPayments({
    page = 1,
    limit = 10,
    search = "",
    status = "",
    type = "",
    month = "",
    startDate = "",
    endDate = "",
  }) {
    try {
      const offset = (page - 1) * limit;
      const whereConditions = {};
      const includeConditions = [
        {
          model: Phong,
          as: "Phong",
          attributes: ["SoPhong", "LoaiPhong"],
          required: false,
        },
        {
          model: SinhVien,
          as: "SinhVien",
          attributes: ["HoTen", "Email", "MaSinhVien"],
          required: false,
        },
      ];

      // Filter by status
      if (status) {
        whereConditions.TrangThai = status;
      }

      // Filter by payment type
      if (type) {
        whereConditions.LoaiThanhToan = type;
      }

      // Filter by month (YYYY-MM format)
      if (month) {
        whereConditions.ThangNam = month;
      }

      // Filter by date range
      if (startDate && endDate) {
        whereConditions.NgayTao = {
          [Op.between]: [new Date(startDate), new Date(endDate)],
        };
      } else if (startDate) {
        whereConditions.NgayTao = {
          [Op.gte]: new Date(startDate),
        };
      } else if (endDate) {
        whereConditions.NgayTao = {
          [Op.lte]: new Date(endDate),
        };
      }

      // Search by student name, email, payment code, or room number
      if (search) {
        whereConditions[Op.or] = [
          { MaThanhToan: { [Op.iLike]: `%${search}%` } },
          { Reference: { [Op.iLike]: `%${search}%` } },
          { "$sinhVien.HoTen$": { [Op.iLike]: `%${search}%` } },
          { "$sinhVien.Email$": { [Op.iLike]: `%${search}%` } },
          { "$sinhVien.MaSinhVien$": { [Op.iLike]: `%${search}%` } },
          { "$phong.SoPhong$": { [Op.iLike]: `%${search}%` } },
        ];
      }

      const { count, rows } = await ThanhToan.findAndCountAll({
        where: whereConditions,
        include: includeConditions,
        limit,
        offset,
        order: [["NgayTao", "DESC"]],
      });

      return {
        success: true,
        data: {
          payments: rows,
          currentPage: page,
          totalPages: Math.ceil(count / limit),
          totalItems: count,
          pageSize: limit,
        },
        message: "Lấy danh sách thanh toán thành công",
      };
    } catch (error) {
      console.error("Error in getAllPayments:", error);
      return {
        success: false,
        message: "Có lỗi xảy ra khi lấy danh sách thanh toán",
        errors: [error.message],
      };
    }
  }

  /**
   * Lấy thống kê tổng hợp thanh toán (Admin)
   */
  async getAdminPaymentStats() {
    try {
      // Thống kê theo trạng thái
      const statusStats = await ThanhToan.findAll({
        attributes: [
          "TrangThai",
          [sequelize.fn("COUNT", sequelize.col("MaThanhToan")), "count"],
          [sequelize.fn("SUM", sequelize.col("SoTien")), "total"],
        ],
        group: ["TrangThai"],
        raw: true,
      });

      // Thống kê theo loại thanh toán
      const typeStats = await ThanhToan.findAll({
        attributes: [
          "LoaiThanhToan",
          [sequelize.fn("COUNT", sequelize.col("MaThanhToan")), "count"],
          [sequelize.fn("SUM", sequelize.col("SoTien")), "total"],
        ],
        group: ["LoaiThanhToan"],
        raw: true,
      });

      // Tổng số tiền và số lượng thanh toán
      const totals = await ThanhToan.findOne({
        attributes: [
          [
            sequelize.fn("COUNT", sequelize.col("MaThanhToan")),
            "totalPayments",
          ],
          [sequelize.fn("SUM", sequelize.col("SoTien")), "totalAmount"],
        ],
        raw: true,
      });

      // Thống kê theo tháng (12 tháng gần nhất)
      const monthlyStats = await ThanhToan.findAll({
        attributes: [
          "ThangNam",
          [sequelize.fn("COUNT", sequelize.col("MaThanhToan")), "count"],
          [sequelize.fn("SUM", sequelize.col("SoTien")), "total"],
        ],
        where: {
          NgayTao: {
            [Op.gte]: new Date(new Date().setMonth(new Date().getMonth() - 12)),
          },
        },
        group: ["ThangNam"],
        order: [["ThangNam", "ASC"]],
        raw: true,
      });

      // Convert statistics to object format
      const statusStatsObj = statusStats.reduce((acc, stat) => {
        acc[stat.TrangThai] = {
          count: parseInt(stat.count),
          total: parseFloat(stat.total) || 0,
        };
        return acc;
      }, {});

      const typeStatsObj = typeStats.reduce((acc, stat) => {
        acc[stat.LoaiThanhToan] = {
          count: parseInt(stat.count),
          total: parseFloat(stat.total) || 0,
        };
        return acc;
      }, {});

      return {
        success: true,
        data: {
          statusStats: statusStatsObj,
          typeStats: typeStatsObj,
          totals: {
            totalPayments: parseInt(totals.totalPayments) || 0,
            totalAmount: parseFloat(totals.totalAmount) || 0,
          },
          monthlyStats,
          // Summary for quick display
          totalPending: statusStatsObj["CHUA_THANH_TOAN"]?.count || 0,
          totalPaid: statusStatsObj["DA_THANH_TOAN"]?.count || 0,
          totalOverdue: statusStatsObj["QUA_HAN"]?.count || 0,
          totalAmount: parseFloat(totals.totalAmount) || 0,
          paidAmount: statusStatsObj["DA_THANH_TOAN"]?.total || 0,
          pendingAmount:
            (statusStatsObj["CHUA_THANH_TOAN"]?.total || 0) +
            (statusStatsObj["QUA_HAN"]?.total || 0),
        },
        message: "Lấy thống kê thanh toán thành công",
      };
    } catch (error) {
      console.error("Error in getAdminPaymentStats:", error);
      return {
        success: false,
        message: "Có lỗi xảy ra khi lấy thống kê thanh toán",
        errors: [error.message],
      };
    }
  }

  /**
   * Phê duyệt thanh toán tiền mặt (Admin)
   */
  async approveCashPayment(maThanhToan, { adminId, note }) {
    const transaction = await sequelize.transaction();

    try {
      const payment = await ThanhToan.findOne({
        where: { MaThanhToan: maThanhToan },
        transaction,
      });

      if (!payment) {
        await transaction.rollback();
        return {
          success: false,
          message: "Không tìm thấy thanh toán",
        };
      }

      if (payment.TrangThai !== PAYMENT_STATUS.CHO_XAC_NHAN) {
        await transaction.rollback();
        return {
          success: false,
          message: "Thanh toán không ở trạng thái chờ xác nhận",
        };
      }

      // Update payment status
      await payment.update(
        {
          TrangThai: PAYMENT_STATUS.DA_THANH_TOAN,
          HinhThuc: PAYMENT_METHOD.TIEN_MAT,
          NgayThanhToan: new Date(),
          MoTa: note
            ? `${payment.MoTa || ""}\nGhi chú phê duyệt: ${note}`
            : payment.MoTa,
        },
        { transaction }
      );

      await transaction.commit();

      return {
        success: true,
        data: payment,
        message: "Phê duyệt thanh toán tiền mặt thành công",
      };
    } catch (error) {
      await transaction.rollback();
      console.error("Error in approveCashPayment:", error);
      return {
        success: false,
        message: "Có lỗi xảy ra khi phê duyệt thanh toán",
        errors: [error.message],
      };
    }
  }

  /**
   * Từ chối thanh toán tiền mặt (Admin)
   */
  async rejectCashPayment(maThanhToan, { adminId, reason }) {
    const transaction = await sequelize.transaction();

    try {
      const payment = await ThanhToan.findOne({
        where: { MaThanhToan: maThanhToan },
        transaction,
      });

      if (!payment) {
        await transaction.rollback();
        return {
          success: false,
          message: "Không tìm thấy thanh toán",
        };
      }

      if (payment.TrangThai !== PAYMENT_STATUS.CHO_XAC_NHAN) {
        await transaction.rollback();
        return {
          success: false,
          message: "Thanh toán không ở trạng thái chờ xác nhận",
        };
      }

      // Update payment status back to unpaid
      await payment.update(
        {
          TrangThai: PAYMENT_STATUS.CHUA_THANH_TOAN,
          HinhThuc: null,
          MoTa: reason
            ? `${payment.MoTa || ""}\nLý do từ chối: ${reason}`
            : payment.MoTa,
        },
        { transaction }
      );

      await transaction.commit();

      return {
        success: true,
        data: payment,
        message: "Từ chối thanh toán tiền mặt thành công",
      };
    } catch (error) {
      await transaction.rollback();
      console.error("Error in rejectCashPayment:", error);
      return {
        success: false,
        message: "Có lỗi xảy ra khi từ chối thanh toán",
        errors: [error.message],
      };
    }
  }
}

module.exports = new PaymentService();
