const { verifyToken } = require("../utils/auth");
const { errorResponse } = require("../utils/response");
const { NhanVien } = require("../models");

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return errorResponse(res, "Token không được cung cấp", 401);
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);

    // Check if user exists and is active
    const user = await NhanVien.findOne({
      where: {
        MaNhanVien: decoded.MaNhanVien,
        TrangThai: "HoatDong",
      },
    });

    if (!user) {
      return errorResponse(
        res,
        "Người dùng không tồn tại hoặc đã bị vô hiệu hóa",
        401
      );
    }

    req.user = user;
    next();
  } catch (error) {
    return errorResponse(res, "Token không hợp lệ", 401);
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return errorResponse(res, "Chưa xác thực", 401);
    }

    if (!roles.includes(req.user.VaiTro)) {
      return errorResponse(res, "Không có quyền truy cập", 403);
    }

    next();
  };
};

module.exports = {
  authenticate,
  authorize,
};
