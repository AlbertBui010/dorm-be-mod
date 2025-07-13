const { validationResult } = require("express-validator");
const { errorResponse } = require("../utils/response");

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map((error) => ({
      field: error.path,
      message: error.msg,
      value: error.value,
    }));

    return errorResponse(res, "Dữ liệu không hợp lệ", 400, formattedErrors);
  }

  next();
};

module.exports = {
  handleValidationErrors,
};
