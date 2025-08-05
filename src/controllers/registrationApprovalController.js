const SYSTEM_USER = require("../constants/system");
const registrationApprovalService = require("../services/registrationApprovalService");
const { successResponse, errorResponse } = require("../utils/response");

class RegistrationApprovalController {
  /**
   * Lấy danh sách đăng ký chờ duyệt
   * GET /api/registration-approval
   */
  async getPendingRegistrations(req, res) {
    try {
      const {
        page = 1,
        limit = 10,
        search,
        gioiTinh,
        nguyenVong,
        trangThai,
      } = req.query;

      const result = await registrationApprovalService.getPendingRegistrations({
        page: parseInt(page),
        limit: parseInt(limit),
        search,
        gioiTinh,
        nguyenVong,
        trangThai,
      });

      if (result.success) {
        return successResponse(res, result.data, result.message);
      } else {
        return errorResponse(res, result.message, 400, result.errors);
      }
    } catch (error) {
      console.error("Error in getPendingRegistrations:", error);
      return errorResponse(
        res,
        "Có lỗi xảy ra khi lấy danh sách đăng ký.",
        500
      );
    }
  }

  /**
   * Lấy thống kê tổng quan
   * GET /api/registration-approval/stats
   */
  async getRegistrationStats(req, res) {
    try {
      const result = await registrationApprovalService.getRegistrationStats();

      if (result.success) {
        return successResponse(res, result.data, result.message);
      } else {
        return errorResponse(res, result.message, 400, result.errors);
      }
    } catch (error) {
      console.error("Error in getRegistrationStats:", error);
      return errorResponse(res, "Có lỗi xảy ra khi lấy thống kê.", 500);
    }
  }

  /**
   * Lấy chi tiết đăng ký
   * GET /api/registration-approval/:maDangKy
   */
  async getRegistrationDetail(req, res) {
    try {
      const { maDangKy } = req.params;

      const result = await registrationApprovalService.getRegistrationDetail(
        maDangKy
      );

      if (result.success) {
        return successResponse(res, result.data, result.message);
      } else {
        return errorResponse(res, result.message, 404, result.errors);
      }
    } catch (error) {
      console.error("Error in getRegistrationDetail:", error);
      return errorResponse(res, "Có lỗi xảy ra khi lấy chi tiết đăng ký.", 500);
    }
  }

  /**
   * Tìm phòng có sẵn cho đăng ký
   * GET /api/registration-approval/:maDangKy/available-rooms
   */
  async findAvailableRooms(req, res) {
    try {
      const { maDangKy } = req.params;
      const { page = 1, limit = 10 } = req.query;

      const result = await registrationApprovalService.findAvailableRooms(
        maDangKy,
        {
          page: parseInt(page),
          limit: parseInt(limit),
        }
      );

      if (result.success) {
        return successResponse(res, result.data, result.message);
      } else {
        return errorResponse(res, result.message, 400, result.errors);
      }
    } catch (error) {
      console.error("Error in findAvailableRooms:", error);
      return errorResponse(res, "Có lỗi xảy ra khi tìm phòng.", 500);
    }
  }

  /**
   * Duyệt đăng ký
   * POST /api/registration-approval/:maDangKy/approve
   */
  async approveRegistration(req, res) {
    try {
      const { maDangKy } = req.params;
      const { maPhong, maGiuong, ghiChu } = req.body;
      const nguoiDuyet = req.user?.MaNhanVien || SYSTEM_USER.SYSTEM;

      // Validation
      if (!maPhong || !maGiuong) {
        return errorResponse(res, "Phòng và giường là bắt buộc.", 400);
      }

      const result = await registrationApprovalService.approveRegistration({
        maDangKy,
        maPhong,
        maGiuong,
        nguoiDuyet,
        ghiChu,
      });

      if (result.success) {
        return successResponse(res, result.data, result.message);
      } else {
        return errorResponse(res, result.message, 400, result.errors);
      }
    } catch (error) {
      console.error("Error in approveRegistration:", error);
      return errorResponse(res, "Có lỗi xảy ra khi duyệt đăng ký.", 500);
    }
  }

  /**
   * Từ chối đăng ký
   * POST /api/registration-approval/:maDangKy/reject
   */
  async rejectRegistration(req, res) {
    try {
      const { maDangKy } = req.params;
      const { lyDoTuChoi } = req.body;
      const nguoiDuyet = req.user?.MaNhanVien || SYSTEM_USER.SYSTEM;

      // Validation
      if (!lyDoTuChoi) {
        return errorResponse(res, "Lý do từ chối là bắt buộc.", 400);
      }

      const result = await registrationApprovalService.rejectRegistration({
        maDangKy,
        lyDoTuChoi,
        nguoiDuyet,
      });

      if (result.success) {
        return successResponse(res, result.data, result.message);
      } else {
        return errorResponse(res, result.message, 400, result.errors);
      }
    } catch (error) {
      console.error("Error in rejectRegistration:", error);
      return errorResponse(res, "Có lỗi xảy ra khi từ chối đăng ký.", 500);
    }
  }
}

module.exports = new RegistrationApprovalController();
