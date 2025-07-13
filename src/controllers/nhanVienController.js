const NhanVienService = require("../services/nhanVienService");
const { successResponse, errorResponse } = require("../utils/response");

class NhanVienController {
  async getAll(req, res, next) {
    try {
      const { page = 1, limit = 10, search, vaiTro, trangThai } = req.query;

      const result = await NhanVienService.getAll({
        page: parseInt(page),
        limit: parseInt(limit),
        search,
        vaiTro,
        trangThai,
      });

      return successResponse(res, result, "Lấy danh sách nhân viên thành công");
    } catch (error) {
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const { id } = req.params;
      const nhanVien = await NhanVienService.getById(id);

      return successResponse(
        res,
        nhanVien,
        "Lấy thông tin nhân viên thành công"
      );
    } catch (error) {
      next(error);
    }
  }

  async create(req, res, next) {
    try {
      const adminId = req.user.MaNhanVien;
      const nhanVien = await NhanVienService.create(req.body, adminId);

      return successResponse(res, nhanVien, "Tạo nhân viên thành công", 201);
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const { id } = req.params;
      const adminId = req.user.MaNhanVien;

      const nhanVien = await NhanVienService.update(id, req.body, adminId);

      return successResponse(res, nhanVien, "Cập nhật nhân viên thành công");
    } catch (error) {
      next(error);
    }
  }

  async toggleStatus(req, res, next) {
    try {
      const { id } = req.params;
      const adminId = req.user.MaNhanVien;

      const result = await NhanVienService.toggleStatus(id, adminId);

      return successResponse(
        res,
        result,
        "Thay đổi trạng thái nhân viên thành công"
      );
    } catch (error) {
      next(error);
    }
  }

  async delete(req, res, next) {
    try {
      const { id } = req.params;
      const adminId = req.user.MaNhanVien;

      await NhanVienService.delete(id, adminId);

      return successResponse(res, null, "Xóa nhân viên thành công");
    } catch (error) {
      next(error);
    }
  }

  async canDelete(req, res, next) {
    try {
      const { id } = req.params;
      const result = await NhanVienService.canDelete(id);

      return successResponse(res, result, "Kiểm tra khả năng xóa thành công");
    } catch (error) {
      next(error);
    }
  }

  async getStats(req, res, next) {
    try {
      const stats = await NhanVienService.getStats();

      return successResponse(res, stats, "Lấy thống kê nhân viên thành công");
    } catch (error) {
      next(error);
    }
  }

  async getRoles(req, res, next) {
    try {
      const roles = await NhanVienService.getRoles();

      return successResponse(res, roles, "Lấy danh sách vai trò thành công");
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new NhanVienController();
