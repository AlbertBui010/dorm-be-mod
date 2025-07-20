const yeuCauChuyenPhongService = require("../services/yeuCauChuyenPhongService");
const {
  successResponse,
  errorResponse,
  paginationResponse,
} = require("../utils/response");

class YeuCauChuyenPhongController {
  /**
   * Lấy danh sách yêu cầu chuyển phòng
   * GET /api/yeu-cau-chuyen-phong
   */
  async getAllYeuCau(req, res, next) {
    try {
      const {
        page,
        limit,
        search,
        trangThai,
        maSinhVien,
        maPhongMoi,
        tuNgay,
        denNgay,
      } = req.query;

      const filters = {
        search,
        trangThai,
        maSinhVien,
        maPhongMoi,
        tuNgay,
        denNgay,
      };
      const pagination = { page, limit };

      const result = await yeuCauChuyenPhongService.getAllYeuCau(
        filters,
        pagination
      );

      return paginationResponse(
        res,
        result.yeuCaus,
        result.pagination,
        "Lấy danh sách yêu cầu chuyển phòng thành công"
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Lấy yêu cầu chuyển phòng theo ID
   * GET /api/yeu-cau-chuyen-phong/:maYeuCau
   */
  async getYeuCauById(req, res, next) {
    try {
      const { maYeuCau } = req.params;

      const yeuCau = await yeuCauChuyenPhongService.getYeuCauById(maYeuCau);

      return successResponse(
        res,
        yeuCau,
        "Lấy thông tin yêu cầu chuyển phòng thành công"
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Tạo yêu cầu chuyển phòng mới
   * POST /api/yeu-cau-chuyen-phong
   */
  async createYeuCau(req, res, next) {
    try {
      const yeuCauData = req.body;
      const createdBy =
        req.user?.maNhanVien || req.user?.MaSinhVien || "SYSTEM";

      const yeuCau = await yeuCauChuyenPhongService.createYeuCau(
        yeuCauData,
        createdBy
      );

      return successResponse(
        res,
        yeuCau,
        "Tạo yêu cầu chuyển phòng thành công"
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Cập nhật yêu cầu chuyển phòng
   * PUT /api/yeu-cau-chuyen-phong/:maYeuCau
   */
  async updateYeuCau(req, res, next) {
    try {
      const { maYeuCau } = req.params;
      const updateData = req.body;
      const updatedBy =
        req.user?.maNhanVien || req.user?.MaSinhVien || "SYSTEM";

      const yeuCau = await yeuCauChuyenPhongService.updateYeuCau(
        maYeuCau,
        updateData,
        updatedBy
      );

      return successResponse(
        res,
        yeuCau,
        "Cập nhật yêu cầu chuyển phòng thành công"
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Duyệt yêu cầu chuyển phòng
   * POST /api/yeu-cau-chuyen-phong/:maYeuCau/approve
   */
  async approveYeuCau(req, res, next) {
    try {
      const { maYeuCau } = req.params;
      const { ghiChu, selectedRoom, selectedBed } = req.body;
      const approvedBy = req.user?.maNhanVien || "ADMIN";

      const yeuCau = await yeuCauChuyenPhongService.approveYeuCau(
        maYeuCau,
        approvedBy,
        ghiChu,
        selectedRoom,
        selectedBed
      );

      return successResponse(
        res,
        yeuCau,
        "Duyệt yêu cầu chuyển phòng thành công"
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Từ chối yêu cầu chuyển phòng
   * POST /api/yeu-cau-chuyen-phong/:maYeuCau/reject
   */
  async rejectYeuCau(req, res, next) {
    try {
      const { maYeuCau } = req.params;
      const { lyDoTuChoi } = req.body;
      const rejectedBy = req.user?.maNhanVien || "ADMIN";

      const yeuCau = await yeuCauChuyenPhongService.rejectYeuCau(
        maYeuCau,
        rejectedBy,
        lyDoTuChoi
      );

      return successResponse(
        res,
        yeuCau,
        "Từ chối yêu cầu chuyển phòng thành công"
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Lấy yêu cầu chuyển phòng của sinh viên
   * GET /api/yeu-cau-chuyen-phong/sinh-vien/:maSinhVien
   */
  async getYeuCauBySinhVien(req, res, next) {
    try {
      const { maSinhVien } = req.params;

      const yeuCaus = await yeuCauChuyenPhongService.getYeuCauBySinhVien(
        maSinhVien
      );

      return successResponse(
        res,
        yeuCaus,
        "Lấy yêu cầu chuyển phòng của sinh viên thành công"
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Lấy chi tiết yêu cầu chuyển phòng của sinh viên đang đăng nhập
   * GET /api/yeu-cau-chuyen-phong/my-requests/:maYeuCau
   */
  async getMyYeuCauById(req, res, next) {
    try {
      const { maYeuCau } = req.params;
      const maSinhVien = req.user?.MaSinhVien;

      if (!maSinhVien) {
        return errorResponse(res, "Không tìm thấy thông tin sinh viên", 401);
      }

      const yeuCau = await yeuCauChuyenPhongService.getMyYeuCauById(
        maYeuCau,
        maSinhVien
      );

      return successResponse(
        res,
        yeuCau,
        "Lấy chi tiết yêu cầu chuyển phòng thành công"
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Lấy thống kê yêu cầu chuyển phòng
   * GET /api/yeu-cau-chuyen-phong/stats
   */
  async getYeuCauStats(req, res, next) {
    try {
      const stats = await yeuCauChuyenPhongService.getYeuCauStats();

      return successResponse(
        res,
        stats,
        "Lấy thống kê yêu cầu chuyển phòng thành công"
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Lấy yêu cầu chuyển phòng của sinh viên đang đăng nhập
   * GET /api/yeu-cau-chuyen-phong/my-requests
   */
  async getMyYeuCau(req, res, next) {
    try {
      const maSinhVien = req.user?.MaSinhVien;

      if (!maSinhVien) {
        return errorResponse(res, "Không tìm thấy thông tin sinh viên", 401);
      }

      const yeuCaus = await yeuCauChuyenPhongService.getYeuCauBySinhVien(
        maSinhVien
      );

      return successResponse(
        res,
        yeuCaus,
        "Lấy yêu cầu chuyển phòng của bạn thành công"
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Tạo yêu cầu chuyển phòng cho sinh viên đang đăng nhập
   * POST /api/yeu-cau-chuyen-phong/my-requests
   */
  async createMyYeuCau(req, res, next) {
    try {
      const maSinhVien = req.user?.MaSinhVien;

      if (!maSinhVien) {
        return errorResponse(res, "Không tìm thấy thông tin sinh viên", 401);
      }

      const yeuCauData = {
        ...req.body,
        MaSinhVien: maSinhVien,
      };

      const yeuCau = await yeuCauChuyenPhongService.createYeuCau(
        yeuCauData,
        maSinhVien
      );

      return successResponse(
        res,
        yeuCau,
        "Tạo yêu cầu chuyển phòng thành công"
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Lấy danh sách phòng và giường có sẵn cho chuyển phòng
   * GET /api/yeu-cau-chuyen-phong/available-rooms-beds
   */
  async getAvailableRoomsAndBeds(req, res, next) {
    try {
      const rooms = await yeuCauChuyenPhongService.getAvailableRoomsAndBeds();

      return successResponse(
        res,
        rooms,
        "Lấy danh sách phòng và giường có sẵn thành công"
      );
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new YeuCauChuyenPhongController();
