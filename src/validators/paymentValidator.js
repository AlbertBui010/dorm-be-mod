const { body, param, query } = require("express-validator");

class PaymentValidator {
  /**
   * Validation cho lấy danh sách thanh toán
   */
  static getPaymentsList() {
    return [
      query("page")
        .optional()
        .isInt({ min: 1 })
        .withMessage("Page phải là số nguyên dương"),
      query("limit")
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage("Limit phải là số nguyên từ 1 đến 100"),
      query("trangThai")
        .optional()
        .isIn([
          "CHUA_THANH_TOAN",
          "DANG_CHO_THANH_TOAN",
          "DA_THANH_TOAN",
          "CHO_XAC_NHAN_TIEN_MAT",
          "QUA_HAN",
        ])
        .withMessage("Trạng thái không hợp lệ"),
    ];
  }

  /**
   * Validation cho chi tiết thanh toán
   */
  static getPaymentDetail() {
    return [
      param("maThanhToan")
        .notEmpty()
        .withMessage("Mã thanh toán không được để trống")
        .isUUID()
        .withMessage("Mã thanh toán phải là UUID hợp lệ"),
    ];
  }

  /**
   * Validation cho tạo link thanh toán
   */
  static createPaymentLink() {
    return [
      param("maThanhToan")
        .notEmpty()
        .withMessage("Mã thanh toán không được để trống")
        .isUUID()
        .withMessage("Mã thanh toán phải là UUID hợp lệ"),
    ];
  }

  /**
   * Validation cho thanh toán tiền mặt
   */
  static processCashPayment() {
    return [
      param("maThanhToan")
        .notEmpty()
        .withMessage("Mã thanh toán không được để trống")
        .isUUID()
        .withMessage("Mã thanh toán phải là UUID hợp lệ"),
    ];
  }

  /**
   * Validation cho webhook PayOS
   */
  static payosWebhook() {
    return [
      body("orderCode")
        .notEmpty()
        .withMessage("Order code không được để trống")
        .isNumeric()
        .withMessage("Order code phải là số"),
      body("amount")
        .notEmpty()
        .withMessage("Amount không được để trống")
        .isNumeric()
        .withMessage("Amount phải là số"),
      body("status")
        .optional()
        .isIn(["PAID", "CANCELLED", "PENDING"])
        .withMessage("Status không hợp lệ"),
    ];
  }

  /**
   * Validation cho kiểm tra trạng thái thanh toán
   */
  static checkPaymentStatus() {
    return [
      param("maThanhToan")
        .notEmpty()
        .withMessage("Mã thanh toán không được để trống")
        .isUUID()
        .withMessage("Mã thanh toán phải là UUID hợp lệ"),
    ];
  }

  /**
   * Validation cho return URL từ PayOS
   */
  static paymentReturn() {
    return [
      query("orderCode")
        .optional()
        .isNumeric()
        .withMessage("Order code phải là số"),
      query("status")
        .optional()
        .isIn(["PAID", "CANCELLED", "FAILED"])
        .withMessage("Status không hợp lệ"),
    ];
  }

  /**
   * Validation cho cancel URL từ PayOS
   */
  static paymentCancel() {
    return [
      query("orderCode")
        .optional()
        .isNumeric()
        .withMessage("Order code phải là số"),
    ];
  }
}

module.exports = PaymentValidator;
