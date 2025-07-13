const PhongService = require("../services/phongService");
const { successResponse, paginationResponse } = require("../utils/response");

class PhongController {
  async getAllPhong(req, res, next) {
    try {
      const { page, limit, search, loaiPhong, trangThai } = req.query;

      const filters = { search, loaiPhong, trangThai };
      const pagination = { page, limit };

      const result = await PhongService.getAllPhong(filters, pagination);

      return paginationResponse(
        res,
        result.phongs,
        result.pagination,
        "Lấy danh sách phòng thành công"
      );
    } catch (error) {
      next(error);
    }
  }

  async getPhongById(req, res, next) {
    try {
      const { maPhong } = req.params;

      const phong = await PhongService.getPhongById(maPhong);

      return successResponse(res, phong, "Lấy thông tin phòng thành công");
    } catch (error) {
      next(error);
    }
  }

  async createPhong(req, res, next) {
    try {
      const phongData = req.body;
      const createdBy = req.user.TenDangNhap;

      const phong = await PhongService.createPhong(phongData, createdBy);

      return successResponse(res, phong, "Tạo phòng thành công", 201);
    } catch (error) {
      next(error);
    }
  }

  async updatePhong(req, res, next) {
    try {
      const { maPhong } = req.params;
      const updateData = req.body;
      const updatedBy = req.user.TenDangNhap;

      const phong = await PhongService.updatePhong(
        maPhong,
        updateData,
        updatedBy
      );

      return successResponse(res, phong, "Cập nhật phòng thành công");
    } catch (error) {
      next(error);
    }
  }

  async deletePhong(req, res, next) {
    try {
      const { maPhong } = req.params;

      const result = await PhongService.deletePhong(maPhong);

      return successResponse(res, result, "Xóa phòng thành công");
    } catch (error) {
      next(error);
    }
  }

  async getAvailableRooms(req, res, next) {
    try {
      const rooms = await PhongService.getAvailableRooms();

      return successResponse(
        res,
        rooms,
        "Lấy danh sách phòng trống thành công"
      );
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new PhongController();
