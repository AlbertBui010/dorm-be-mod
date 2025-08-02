const successResponse = (
  res,
  data = null,
  message = "Success",
  statusCode = 200
) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

const errorResponse = (
  res,
  message = "Internal Server Error",
  statusCode = 500,
  errors = null
) => {
  return res.status(statusCode).json({
    success: false,
    message,
    errors,
  });
};

const paginationResponse = (res, data, pagination, message = "Success") => {
  return res.status(200).json({
    success: true,
    message,
    data,
    pagination: {
      currentPage: pagination.page,
      totalPages: Math.ceil(pagination.total / pagination.limit),
      totalItems: pagination.total,
      itemsPerPage: pagination.limit,
    },
  });
};
const throwValidationError = (field, message, value = null) => {
  const error = new Error("Dữ liệu không hợp lệ");
  error.statusCode = 400;
  error.errors = [
    {
      field,
      message,
      value,
    },
  ];
  throw error;
};
module.exports = {
  successResponse,
  errorResponse,
  paginationResponse,
  throwValidationError,
};
