const { verifyToken } = require("../utils/auth");
const { errorResponse } = require("../utils/response");
const { NhanVien, SinhVien } = require("../models");
const { NHAN_VIEN_TRANG_THAI } = require("../constants/nhanVien");

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return errorResponse(res, "Token không được cung cấp", 401);
    }

    const token = authHeader.substring(7);

    try {
      const decoded = verifyToken(token);

      let user = null;

      // Check if token is for employee or student
      if (decoded.type === "employee" && decoded.MaNhanVien) {
        user = await NhanVien.findOne({
          where: {
            MaNhanVien: decoded.MaNhanVien,
            TrangThai: NHAN_VIEN_TRANG_THAI.HOAT_DONG,
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
    } catch (tokenError) {
      return errorResponse(res, "Chưa xác thực", 401);
    }
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

    // Flatten roles array if it contains arrays (for backward compatibility)
    const flatRoles = roles.flat();

    // Check employee roles
    if (!flatRoles.includes(req.user.VaiTro)) {
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

const authorizeAdmin = (req, res, next) => {
  if (!req.user) {
    return errorResponse(res, "Chưa xác thực", 401);
  }

  if (req.user.userType !== "employee") {
    return errorResponse(res, "Chỉ nhân viên mới có quyền truy cập", 403);
  }

  // Allow both QuanTriVien and NhanVien (both have full access except employee management)
  const adminRoles = ["QuanTriVien", "NhanVien"];
  if (!adminRoles.includes(req.user.VaiTro)) {
    return errorResponse(res, "Không có quyền quản trị", 403);
  }

  next();
};

const authorizeEmployeeManagement = (req, res, next) => {
  if (!req.user) {
    return errorResponse(res, "Chưa xác thực", 401);
  }

  if (req.user.userType !== "employee") {
    return errorResponse(res, "Chỉ nhân viên mới có quyền truy cập", 403);
  }

  // Only QuanTriVien can manage employees
  if (req.user.VaiTro !== "QuanTriVien") {
    return errorResponse(
      res,
      "Chỉ quản trị viên mới có quyền quản lý nhân viên",
      403
    );
  }

  next();
};

// Alias for backward compatibility
const authenticateToken = authenticate;
const requireRole = authorize;

module.exports = {
  authenticate,
  authenticateToken,
  authorize,
  requireRole,
  authorizeEmployee,
  authorizeStudent,
  authorizeAdmin,
  authorizeEmployeeManagement,
};
