const giuongService = require("../services/giuongService");
const { validationResult } = require("express-validator");
const { successResponse, errorResponse } = require("../utils/response");

// Response helper object to match the existing pattern
const responseHelper = {
  success: (res, data, message, meta) => {
    if (meta) {
      return res.status(200).json({
        success: true,
        message,
        data,
        ...meta,
      });
    }
    return successResponse(res, data, message);
  },
  created: (res, data, message) => successResponse(res, data, message, 201),
  badRequest: (res, message, errors) =>
    errorResponse(res, message, 400, errors),
  notFound: (res, message) => errorResponse(res, message, 404),
  error: (res, message) => errorResponse(res, message, 500),
};

class GiuongController {
  // GET /api/giuong - Get all beds with filtering and pagination
  async getAllGiuong(req, res) {
    try {
      const { page, limit, search, maPhong, trangThai } = req.query;

      const filters = {
        search,
        maPhong,
        trangThai,
      };

      const pagination = {
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 10,
      };

      const result = await giuongService.getAllGiuong(filters, pagination);

      return responseHelper.success(
        res,
        result.giuongs,
        "Lấy danh sách giường thành công",
        { pagination: result.pagination }
      );
    } catch (error) {
      console.error("Error in getAllGiuong:", error);
      return responseHelper.error(res, error.message);
    }
  }

  // GET /api/giuong/:maGiuong - Get bed by ID
  async getGiuongById(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return responseHelper.badRequest(
          res,
          "Dữ liệu không hợp lệ",
          errors.array()
        );
      }

      const { maGiuong } = req.params;
      const giuong = await giuongService.getGiuongById(maGiuong);

      return responseHelper.success(
        res,
        giuong,
        "Lấy thông tin giường thành công"
      );
    } catch (error) {
      console.error("Error in getGiuongById:", error);
      if (error.message === "Giường không tồn tại") {
        return responseHelper.notFound(res, error.message);
      }
      return responseHelper.error(res, error.message);
    }
  }

  // POST /api/giuong - Create new bed
  async createGiuong(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return responseHelper.badRequest(
          res,
          "Dữ liệu không hợp lệ",
          errors.array()
        );
      }

      const createdBy = req.user.TenDangNhap;
      const giuong = await giuongService.createGiuong(req.body, createdBy);

      return responseHelper.created(res, giuong, "Tạo giường thành công");
    } catch (error) {
      console.error("Error in createGiuong:", error);
      return responseHelper.error(res, error.message);
    }
  }

  // PUT /api/giuong/:maGiuong - Update bed
  async updateGiuong(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return responseHelper.badRequest(
          res,
          "Dữ liệu không hợp lệ",
          errors.array()
        );
      }

      const { maGiuong } = req.params;
      const updatedBy = req.user.TenDangNhap;
      const giuong = await giuongService.updateGiuong(
        maGiuong,
        req.body,
        updatedBy
      );

      return responseHelper.success(res, giuong, "Cập nhật giường thành công");
    } catch (error) {
      console.error("Error in updateGiuong:", error);
      if (error.message === "Giường không tồn tại") {
        return responseHelper.notFound(res, error.message);
      }
      return responseHelper.error(res, error.message);
    }
  }

  // DELETE /api/giuong/:maGiuong - Delete bed
  async deleteGiuong(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return responseHelper.badRequest(
          res,
          "Dữ liệu không hợp lệ",
          errors.array()
        );
      }

      const { maGiuong } = req.params;
      const result = await giuongService.deleteGiuong(maGiuong);

      return responseHelper.success(res, result, "Xóa giường thành công");
    } catch (error) {
      console.error("Error in deleteGiuong:", error);
      if (error.message === "Giường không tồn tại") {
        return responseHelper.notFound(res, error.message);
      }
      return responseHelper.error(res, error.message);
    }
  }

  // POST /api/giuong/:maGiuong/assign - Assign student to bed
  async assignStudentToBed(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return responseHelper.badRequest(
          res,
          "Dữ liệu không hợp lệ",
          errors.array()
        );
      }

      const { maGiuong } = req.params;
      const { maSinhVien } = req.body;
      const assignedBy = req.user.TenDangNhap;

      const giuong = await giuongService.assignStudentToBed(
        maGiuong,
        maSinhVien,
        assignedBy
      );

      return responseHelper.success(
        res,
        giuong,
        "Gán sinh viên vào giường thành công"
      );
    } catch (error) {
      console.error("Error in assignStudentToBed:", error);
      if (error.message === "Giường không tồn tại") {
        return responseHelper.notFound(res, error.message);
      }
      return responseHelper.error(res, error.message);
    }
  }

  // POST /api/giuong/:maGiuong/remove - Remove student from bed
  async removeStudentFromBed(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return responseHelper.badRequest(
          res,
          "Dữ liệu không hợp lệ",
          errors.array()
        );
      }

      const { maGiuong } = req.params;
      const removedBy = req.user.TenDangNhap;

      const giuong = await giuongService.removeStudentFromBed(
        maGiuong,
        removedBy
      );

      return responseHelper.success(
        res,
        giuong,
        "Gỡ sinh viên khỏi giường thành công"
      );
    } catch (error) {
      console.error("Error in removeStudentFromBed:", error);
      if (error.message === "Giường không tồn tại") {
        return responseHelper.notFound(res, error.message);
      }
      return responseHelper.error(res, error.message);
    }
  }

  // GET /api/giuong/room/:maPhong - Get beds by room
  async getGiuongByRoom(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return responseHelper.badRequest(
          res,
          "Dữ liệu không hợp lệ",
          errors.array()
        );
      }

      const { maPhong } = req.params;
      const giuongs = await giuongService.getGiuongByRoom(maPhong);

      return responseHelper.success(
        res,
        giuongs,
        "Lấy danh sách giường theo phòng thành công"
      );
    } catch (error) {
      console.error("Error in getGiuongByRoom:", error);
      return responseHelper.error(res, error.message);
    }
  }

  // GET /api/giuong/available - Get available beds
  async getAvailableBeds(req, res) {
    try {
      const giuongs = await giuongService.getAvailableBeds();

      return responseHelper.success(
        res,
        giuongs,
        "Lấy danh sách giường trống thành công"
      );
    } catch (error) {
      console.error("Error in getAvailableBeds:", error);
      return responseHelper.error(res, error.message);
    }
  }

  // GET /api/giuong/statistics - Get bed statistics
  async getBedStatistics(req, res) {
    try {
      const stats = await giuongService.getBedStatistics();

      return responseHelper.success(
        res,
        stats,
        "Lấy thống kê giường thành công"
      );
    } catch (error) {
      console.error("Error in getBedStatistics:", error);
      return responseHelper.error(res, error.message);
    }
  }
}

module.exports = new GiuongController();
