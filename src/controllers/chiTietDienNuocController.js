const ChiTietDienNuocService = require("../services/chiTietDienNuocService");
const { successResponse, errorResponse } = require("../utils/response");
const { SinhVien } = require("../models");

class ChiTietDienNuocController {
  async getChiTietDienNuoc(req, res) {
    try {
      const filters = req.query;
      // Nếu filter theo MaSinhVien, kiểm tra sinh viên có tồn tại không
      if (filters.MaSinhVien) {
        const sv = await SinhVien.findOne({
          where: { MaSinhVien: filters.MaSinhVien },
        });
        if (!sv) {
          return successResponse(
            res,
            [],
            "Không tìm thấy sinh viên với mã này"
          );
        }
      }
      const chiTietDienNuoc = await ChiTietDienNuocService.getChiTietDienNuoc(
        undefined,
        filters
      );
      return successResponse(
        res,
        chiTietDienNuoc,
        "Lấy danh sách chi tiết điện nước thành công"
      );
    } catch (err) {
      return errorResponse(res, err.message);
    }
  }

  async getChiTietDienNuocById(req, res) {
    try {
      const { id } = req.params;
      const chiTiet = await ChiTietDienNuocService.getById(id);
      if (!chiTiet) {
        return errorResponse(res, "Không tìm thấy chi tiết điện nước", 404);
      }
      return successResponse(res, chiTiet, "Lấy chi tiết điện nước thành công");
    } catch (err) {
      return errorResponse(res, err.message);
    }
  }

  async getMyChiTietDienNuoc(req, res) {
    try {
      const maSinhVien = req.user?.maSinhVien;
      if (!maSinhVien) {
        return errorResponse(res, "Không xác định được sinh viên", 403);
      }
      const filters = req.query;
      const chiTietDienNuoc = await ChiTietDienNuocService.getChiTietDienNuoc(
        maSinhVien,
        filters
      );
      return successResponse(
        res,
        chiTietDienNuoc,
        "Lấy chi tiết điện nước của sinh viên thành công"
      );
    } catch (err) {
      return errorResponse(res, err.message);
    }
  }
}

module.exports = new ChiTietDienNuocController();
