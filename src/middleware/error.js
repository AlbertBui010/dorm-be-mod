const { errorResponse } = require("../utils/response");

const errorHandler = (err, req, res, next) => {
  console.error("Error:", err);

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

  // Default error
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
