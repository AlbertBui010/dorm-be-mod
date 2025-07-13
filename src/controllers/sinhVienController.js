const SinhVienService = require("../services/sinhVienService");
const { successResponse, paginationResponse } = require("../utils/response");

class SinhVienController {
  async getAllSinhVien(req, res, next) {
    try {
      const { page, limit, search, gioiTinh } = req.query;

      const filters = { search, gioiTinh };
      const pagination = { page, limit };

      const result = await SinhVienService.getAllSinhVien(filters, pagination);

      return paginationResponse(
        res,
        result.sinhViens,
        result.pagination,
        "Lấy danh sách sinh viên thành công"
      );
    } catch (error) {
      next(error);
    }
  }

  async getSinhVienById(req, res, next) {
    try {
      const { maSinhVien } = req.params;

      const sinhVien = await SinhVienService.getSinhVienById(maSinhVien);

      return successResponse(
        res,
        sinhVien,
        "Lấy thông tin sinh viên thành công"
      );
    } catch (error) {
      next(error);
    }
  }

  async getSinhVienWithoutBed(req, res, next) {
    try {
      const { gioiTinhPhong } = req.query;

      const filters = { gioiTinhPhong };
      const sinhViens = await SinhVienService.getSinhVienWithoutBed(filters);

      return successResponse(
        res,
        sinhViens,
        "Lấy danh sách sinh viên chưa có giường thành công"
      );
    } catch (error) {
      next(error);
    }
  }

  async createSinhVien(req, res, next) {
    try {
      const sinhVienData = req.body;
      const createdBy = req.user.TenDangNhap;

      const sinhVien = await SinhVienService.createSinhVien(
        sinhVienData,
        createdBy
      );

      return successResponse(res, sinhVien, "Tạo sinh viên thành công", 201);
    } catch (error) {
      next(error);
    }
  }

  async updateSinhVien(req, res, next) {
    try {
      const { maSinhVien } = req.params;
      const updateData = req.body;
      const updatedBy = req.user.TenDangNhap;

      const sinhVien = await SinhVienService.updateSinhVien(
        maSinhVien,
        updateData,
        updatedBy
      );

      return successResponse(res, sinhVien, "Cập nhật sinh viên thành công");
    } catch (error) {
      next(error);
    }
  }

  async deleteSinhVien(req, res, next) {
    try {
      const { maSinhVien } = req.params;

      const result = await SinhVienService.deleteSinhVien(maSinhVien);

      return successResponse(res, result, "Xóa sinh viên thành công");
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new SinhVienController();
