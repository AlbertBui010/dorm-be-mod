// D:\new_LVTN\dorm-be-mod2\dorm-be-mod\src\middleware\error.js
const { errorResponse } = require("../utils/response");

const errorHandler = (err, req, res, next) => {
  console.error("Error:", err); // Luôn giữ để debug

  // Thêm điều kiện này TRƯỚC các lỗi mặc định và các loại lỗi khác
  // Đây là lỗi từ throwValidationError hoặc các lỗi validation khác có thuộc tính 'errors'
  if (err.errors && Array.isArray(err.errors)) {
    // Sử dụng err.statusCode nếu có, nếu không thì mặc định 400
    return errorResponse(res, err.message || "Dữ liệu không hợp lệ", err.statusCode || 400, err.errors);
  }

  // Sequelize validation error
  if (err.name === "SequelizeValidationError") {
    const errors = err.errors.map((error) => ({
      field: error.path,
      message: error.message,
      value: error.value,
    }));
    return errorResponse(res, "Lỗi validation", 400, errors);
  }

  // Sequelize unique constraint error
  if (err.name === "SequelizeUniqueConstraintError") {
    const field = err.errors[0].path;
    return errorResponse(res, `${field} đã tồn tại`, 400);
  }

  // Sequelize foreign key constraint error
  if (err.name === "SequelizeForeignKeyConstraintError") {
    return errorResponse(res, "Vi phạm ràng buộc khóa ngoại", 400);
  }

  // JWT errors
  if (err.name === "JsonWebTokenError") {
    return errorResponse(res, "Token không hợp lệ", 401);
  }

  if (err.name === "TokenExpiredError") {
    return errorResponse(res, "Token đã hết hạn", 401);
  }

  // Xử lý AppError của bạn (được ném từ service cho các lỗi không có field cụ thể)
  if (err.name === "AppError") {
    return errorResponse(res, err.message, err.statusCode);
  }

  // Default error (lỗi không xác định hoặc lỗi server nội bộ)
  return errorResponse(res, err.message || "Lỗi server", err.statusCode || 500);
};

const notFound = (req, res) => {
  return errorResponse(res, "Endpoint không tồn tại", 404);
};

// Định nghĩa AppError để sử dụng cho các service
class AppError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = {
  errorHandler,
  notFound,
  AppError,
};
