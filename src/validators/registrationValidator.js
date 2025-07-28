const { body, param, validationResult } = require("express-validator");
const { validateReceiveDate } = require("../utils/dateCalculator");

class RegistrationValidator {
  /**
   * Validation cho đăng ký
   */
  static validateRegistration() {
    return [
      body("email")
        .notEmpty()
        .isEmail()
        .withMessage("Email không hợp lệ.")
        .normalizeEmail(),

      body("hoTen")
        .matches(
          /[^a-z0-9A-Z_ÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚĂĐĨŨƠàáâãèéêìíòóôõùúăđĩũơƯĂẠẢẤẦẨẪẬẮẰẲẴẶẸẺẼỀỀỂưăạảấầẩẫậắằẳẵặẹẻẽềềểỄỆỈỊỌỎỐỒỔỖỘỚỜỞỠỢỤỦỨỪễếệỉịọỏốồổỗộớờởỡợụủứừỬỮỰỲỴÝỶỸửữựỳỵỷỹ]/
        )
        .withMessage("Họ tên không được có ký tự đặc biệt.")
        .notEmpty()
        .withMessage("Họ tên là bắt buộc.")
        .isLength({ min: 2, max: 100 })
        .withMessage("Họ tên phải từ 2-100 ký tự.")
        .trim(),

      body("ngaySinh")
        .notEmpty()
        .isDate()
        .withMessage("Ngày sinh không hợp lệ.")
        .custom((value) => {
          if (value) {
            const today = new Date();
            const birthDate = new Date(value);
            const age = today.getFullYear() - birthDate.getFullYear();
            if (age < 16 || age > 50) {
              throw new Error("Tuổi phải từ 16-50.");
            }
          }
          return true;
        }),

      body("gioiTinh")
        .notEmpty()
        .isIn(["Nam", "Nữ", "Khác"])
        .withMessage("Giới tính phải là Nam, Nữ hoặc Khác."),

      body("soDienThoai")
        .notEmpty()
        .isMobilePhone("vi-VN")
        .withMessage("Số điện thoại không hợp lệ.")
        .isLength({ min: 10, max: 11 })
        .withMessage("Số điện thoại phải từ 10-11 số."),

      body("maSinhVien")
        .notEmpty()
        .withMessage("Mã sinh viên là bắt buộc.")
        .isLength({ min: 10, max: 10 })
        .withMessage("Mã sinh viên phải có đúng 10 ký tự.")
        .matches(/^DH[0-9]{8}$/)
        .withMessage(
          "Mã sinh viên phải có định dạng DH + 8 chữ số (VD: DH52107853)."
        )
        .trim(),

      body("ngayNhanPhong")
        .notEmpty()
        .withMessage("Ngày nhận phòng là bắt buộc.")
        .isDate()
        .withMessage("Ngày nhận phòng không hợp lệ.")
        .custom((value, { req }) => {
          const today = new Date();
          const receiveDate = new Date(value);

          // Ngày nhận phòng không được trong quá khứ
          if (receiveDate < today.setHours(0, 0, 0, 0)) {
            throw new Error("Ngày nhận phòng không được trong quá khứ.");
          }

          // Kiểm tra ngày nhận phòng không quá 3 ngày từ ngày đăng ký
          const registrationDate = new Date(); // Ngày hiện tại làm ngày đăng ký
          if (!validateReceiveDate(registrationDate, receiveDate)) {
            throw new Error(
              "Ngày nhận phòng chỉ được chọn trong vòng 3 ngày kể từ ngày đăng ký."
            );
          }

          return true;
        }),

      body("nguyenVong")
        .notEmpty()
        .isLength({ max: 500 })
        .withMessage("Nguyện vọng không được quá 500 ký tự.")
        .trim(),
    ];
  }

  /**
   * Validation cho xác thực email
   */
  static validateEmailVerification() {
    return [
      body("token")
        .notEmpty()
        .withMessage("Mã xác thực là bắt buộc.")
        .isLength({ min: 32, max: 100 })
        .withMessage("Mã xác thực không hợp lệ.")
        .trim(),
    ];
  }

  /**
   * Validation cho xác thực email qua link
   */
  static validateEmailVerificationByLink() {
    return [
      param("token")
        .notEmpty()
        .withMessage("Mã xác thực là bắt buộc.")
        .isLength({ min: 32, max: 100 })
        .withMessage("Mã xác thực không hợp lệ.")
        .trim(),
    ];
  }

  /**
   * Validation cho thiết lập mật khẩu
   */
  static validatePasswordSetup() {
    return [
      body("maSinhVien")
        .notEmpty()
        .withMessage("Mã sinh viên là bắt buộc.")
        .isLength({ min: 10, max: 10 })
        .withMessage("Mã sinh viên không hợp lệ.")
        .matches(/^DH[0-9]{8}$/)
        .withMessage("Mã sinh viên phải có định dạng DH + 8 chữ số.")
        .trim(),

      body("matKhau")
        .notEmpty()
        .withMessage("Mật khẩu là bắt buộc.")
        .isLength({ min: 6, max: 50 })
        .withMessage("Mật khẩu phải từ 6-50 ký tự.")
        .matches(/^(?=.*[a-zA-Z])(?=.*\d)/)
        .withMessage("Mật khẩu phải chứa ít nhất 1 chữ cái và 1 số."),

      body("xacNhanMatKhau")
        .notEmpty()
        .withMessage("Xác nhận mật khẩu là bắt buộc.")
        .custom((value, { req }) => {
          if (value !== req.body.matKhau) {
            throw new Error("Mật khẩu và xác nhận mật khẩu không khớp.");
          }
          return true;
        }),
    ];
  }

  /**
   * Validation cho gửi lại email
   */
  static validateResendVerification() {
    return [
      body("email")
        .notEmpty()
        .withMessage("Email là bắt buộc.")
        .isEmail()
        .withMessage("Email không hợp lệ.")
        .normalizeEmail(),
    ];
  }

  /**
   * Validation cho kiểm tra trạng thái
   */
  static validateGetStatus() {
    return [
      param("maSinhVien")
        .notEmpty()
        .withMessage("Mã sinh viên là bắt buộc.")
        .isLength({ min: 10, max: 10 })
        .withMessage("Mã sinh viên không hợp lệ.")
        .matches(/^DH[0-9]{8}$/)
        .withMessage("Mã sinh viên phải có định dạng DH + 8 chữ số.")
        .trim(),
    ];
  }

  /**
   * Validation cho kiểm tra thông tin tồn tại
   */
  static validateCheckExisting() {
    return [
      body("email")
        .optional()
        .isEmail()
        .withMessage("Email không hợp lệ.")
        .normalizeEmail(),

      body("maSinhVien")
        .optional()
        .isLength({ min: 10, max: 10 })
        .withMessage("Mã sinh viên không hợp lệ.")
        .matches(/^DH[0-9]{8}$/)
        .withMessage("Mã sinh viên phải có định dạng DH + 8 chữ số.")
        .trim(),

      // Custom validator to ensure at least one field is provided
      body().custom((value, { req }) => {
        if (!req.body.email && !req.body.maSinhVien) {
          throw new Error("Email hoặc mã sinh viên là bắt buộc.");
        }
        return true;
      }),
    ];
  }

  /**
   * Validate calculate end date request
   */
  static validateCalculateEndDate() {
    return [
      body("ngayNhanPhong")
        .notEmpty()
        .withMessage("Ngày nhận phòng là bắt buộc.")
        .isISO8601()
        .withMessage("Ngày nhận phòng phải có định dạng hợp lệ (YYYY-MM-DD).")
        .custom((value) => {
          const { validateReceiveDate } = require("../utils/dateCalculator");
          const validation = validateReceiveDate(new Date(value));
          if (!validation.isValid) {
            throw new Error(validation.message);
          }
          return true;
        }),
    ];
  }

  /**
   * Middleware để xử lý lỗi validation
   */
  static handleValidationErrors(req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMessages = errors.array().map((error) => error.msg);
      return res.status(400).json({
        success: false,
        message: "Dữ liệu không hợp lệ.",
        errors: errorMessages,
        details: errors.array(),
      });
    }
    next();
  }
}

module.exports = RegistrationValidator;
