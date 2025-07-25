const SinhVienService = require("../services/sinhVienService");
const { successResponse, paginationResponse } = require("../utils/response");
class SinhVienController {
  async getAllSinhVien(req, res, next) {
    try {
      const { page, limit, search, gioiTinh, trangThai, maPhong } = req.query;

      const filters = { search, gioiTinh, trangThai };
      if (maPhong) filters.maPhong = maPhong;
      const pagination = { page, limit };

      const result = await SinhVienService.getAllSinhVien(filters, pagination);

      return paginationResponse(
        res,
        result.sinhViens,
        result.pagination,
        "Lấy danh sách sinh viên thành công",
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
        "Lấy thông tin sinh viên thành công",
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
        "Lấy danh sách sinh viên chưa có giường thành công",
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
        createdBy,
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
        updatedBy,
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

  async toggleStudentStatus(req, res, next) {
    try {
      const { maSinhVien } = req.params;
      const updatedBy = req.user.TenDangNhap;

      const sinhVien = await SinhVienService.toggleStudentStatus(
        maSinhVien,
        updatedBy,
      );

      return successResponse(
        res,
        sinhVien,
        "Thay đổi trạng thái sinh viên thành công",
      );
    } catch (error) {
      next(error);
    }
  }

  async checkRelatedRecords(req, res, next) {
    try {
      const { maSinhVien } = req.params;

      const result = await SinhVienService.checkRelatedRecords(maSinhVien);

      return successResponse(
        res,
        result,
        "Kiểm tra dữ liệu liên quan thành công",
      );
    } catch (error) {
      next(error);
    }
  }

  async getStudentStats(req, res, next) {
    try {
      const stats = await SinhVienService.getStudentStats();

      return successResponse(res, stats, "Lấy thống kê sinh viên thành công");
    } catch (error) {
      next(error);
    }
  }
  async checkIn(req, res, next) {
    try {
      const { maSinhVien } = req.params;
      const updatedBy = req.user?.TenDangNhap || "system";
      const result = await SinhVienService.studentCheckIn(
        maSinhVien,
        updatedBy,
      );
      return successResponse(
        res,
        result?.toJSON ? result.toJSON() : result,
        "sinh viên đã nhận phòng",
      );
    } catch (error) {
      next(error);
    }
  }
  async checkOut(req, res, next) {
    try {
      const { maSinhVien } = req.params;
      const updatedBy = req.user?.TenDangNhap || "system";
      const result = await SinhVienService.studentCheckOut(
        maSinhVien,
        updatedBy,
      );
      return successResponse(res, result, "sinh viên đã thôi ở ký túc xá");
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new SinhVienController();
