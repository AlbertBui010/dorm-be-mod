const { verifyToken } = require("../utils/auth");
const { errorResponse } = require("../utils/response");
const { NhanVien, SinhVien } = require("../models");

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return errorResponse(res, "Token không được cung cấp", 401);
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);

    let user = null;

    // Check if token is for employee or student
    if (decoded.type === "employee" && decoded.MaNhanVien) {
      user = await NhanVien.findOne({
        where: {
          MaNhanVien: decoded.MaNhanVien,
          TrangThai: "HoatDong",
        },
        attributes: { exclude: ["MatKhau"] },
      });

      if (!user) {
        return errorResponse(
          res,
          "Nhân viên không tồn tại hoặc đã bị vô hiệu hóa",
          401
        );
      }

      req.user = {
        ...user.toJSON(),
        userType: "employee",
      };
    } else if (decoded.type === "student" && decoded.MaSinhVien) {
      user = await SinhVien.findOne({
        where: {
          MaSinhVien: decoded.MaSinhVien,
          EmailDaXacThuc: true,
        },
        attributes: { exclude: ["MatKhau", "MaXacThucEmail"] },
      });

      if (!user) {
        return errorResponse(
          res,
          "Sinh viên không tồn tại hoặc chưa được xác thực",
          401
        );
      }

      req.user = {
        ...user.toJSON(),
        VaiTro: "SinhVien",
        userType: "student",
      };
    } else {
      return errorResponse(res, "Token không hợp lệ", 401);
    }

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

    // Allow all roles for students (they have limited access by default)
    if (req.user.userType === "student") {
      return next();
    }

    // Check employee roles
    if (!roles.includes(req.user.VaiTro)) {
      return errorResponse(res, "Không có quyền truy cập", 403);
    }

    next();
  };
};

const authorizeEmployee = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return errorResponse(res, "Chưa xác thực", 401);
    }

    // Only allow employees
    if (req.user.userType !== "employee") {
      return errorResponse(res, "Chỉ nhân viên mới có quyền truy cập", 403);
    }

    if (!roles.includes(req.user.VaiTro)) {
      return errorResponse(res, "Không có quyền truy cập", 403);
    }

    next();
  };
};

const authorizeStudent = (req, res, next) => {
  if (!req.user) {
    return errorResponse(res, "Chưa xác thực", 401);
  }

  if (req.user.userType !== "student") {
    return errorResponse(res, "Chỉ sinh viên mới có quyền truy cập", 403);
  }

  next();
};

module.exports = {
  authenticate,
  authorize,
  authorizeEmployee,
  authorizeStudent,
};
