const donGiaDienNuocService = require("../services/donGiaDienNuocService");
const { successResponse, errorResponse } = require("../utils/response");
const { validationResult } = require("express-validator");

const donGiaDienNuocController = {
  // Lấy tất cả đơn giá với phân trang
  async getAllDonGia(req, res) {
    try {
      const { page = 1, limit = 10, search = "" } = req.query;
      const result = await donGiaDienNuocService.getAllDonGia(
        page,
        limit,
        search
      );

      return successResponse(res, result, "Lấy danh sách đơn giá thành công");
    } catch (error) {
      return errorResponse(res, error.message, 500);
    }
  },

  // Lấy đơn giá theo ID
  async getDonGiaById(req, res) {
    try {
      const { id } = req.params;
      const donGia = await donGiaDienNuocService.getDonGiaById(id);

      return successResponse(res, donGia, "Lấy thông tin đơn giá thành công");
    } catch (error) {
      const statusCode = error.message.includes("Không tìm thấy") ? 404 : 500;
      return errorResponse(res, error.message, statusCode);
    }
  },

  // Lấy đơn giá hiện hành
  async getCurrentDonGia(req, res) {
    try {
      const donGia = await donGiaDienNuocService.getCurrentDonGia();

      if (!donGia) {
        return errorResponse(res, "Không có đơn giá hiện hành", 404);
      }

      return successResponse(res, donGia, "Lấy đơn giá hiện hành thành công");
    } catch (error) {
      return errorResponse(res, error.message, 500);
    }
  },

  // Tạo đơn giá mới
  async createDonGia(req, res) {
    try {
      // Kiểm tra validation
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return errorResponse(res, "Dữ liệu không hợp lệ", 400, errors.array());
      }

      const maNhanVien = req.user.MaNhanVien;
      const newDonGia = await donGiaDienNuocService.createDonGia(
        req.body,
        maNhanVien
      );

      return successResponse(res, newDonGia, "Tạo đơn giá mới thành công", 201);
    } catch (error) {
      const statusCode = error.message.includes("đã tồn tại") ? 409 : 500;
      return errorResponse(res, error.message, statusCode);
    }
  },

  // Cập nhật đơn giá
  async updateDonGia(req, res) {
    try {
      // Kiểm tra validation
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return errorResponse(res, "Dữ liệu không hợp lệ", 400, errors.array());
      }

      const { id } = req.params;
      const maNhanVien = req.user.MaNhanVien;

      const updatedDonGia = await donGiaDienNuocService.updateDonGia(
        id,
        req.body,
        maNhanVien
      );

      return successResponse(res, updatedDonGia, "Cập nhật đơn giá thành công");
    } catch (error) {
      let statusCode = 500;
      if (error.message.includes("Không tìm thấy")) {
        statusCode = 404;
      } else if (
        error.message.includes("Không thể chỉnh sửa") ||
        error.message.includes("đã tồn tại")
      ) {
        statusCode = 400;
      }
      return errorResponse(res, error.message, statusCode);
    }
  },

  // Xóa đơn giá
  async deleteDonGia(req, res) {
    try {
      // Kiểm tra validation
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return errorResponse(res, "Dữ liệu không hợp lệ", 400, errors.array());
      }

      const { id } = req.params;
      const result = await donGiaDienNuocService.deleteDonGia(id);

      return successResponse(res, result, "Xóa đơn giá thành công");
    } catch (error) {
      let statusCode = 500;
      if (error.message.includes("Không tìm thấy")) {
        statusCode = 404;
      } else if (error.message.includes("Không thể xóa")) {
        statusCode = 400;
      }
      return errorResponse(res, error.message, statusCode);
    }
  },

  // Kiểm tra các bản ghi liên quan
  async checkRelatedRecords(req, res) {
    try {
      const { id } = req.params;
      const result = await donGiaDienNuocService.checkRelatedRecords(id);

      return successResponse(
        res,
        result,
        "Kiểm tra bản ghi liên quan thành công"
      );
    } catch (error) {
      return errorResponse(res, error.message, 500);
    }
  },

  // Kiểm tra có thể chỉnh sửa không
  async checkCanEdit(req, res) {
    try {
      const { id } = req.params;
      const { canEdit } = await donGiaDienNuocService.canEditDonGia(id);

      return successResponse(
        res,
        { canEdit },
        "Kiểm tra quyền chỉnh sửa thành công"
      );
    } catch (error) {
      const statusCode = error.message.includes("Không tìm thấy") ? 404 : 500;
      return errorResponse(res, error.message, statusCode);
    }
  },

  // Kiểm tra có thể xóa không
  async checkCanDelete(req, res) {
    try {
      const { id } = req.params;
      const result = await donGiaDienNuocService.canDeleteDonGia(id);

      return successResponse(res, result, "Kiểm tra quyền xóa thành công");
    } catch (error) {
      return errorResponse(res, error.message, 500);
    }
  },
};

module.exports = donGiaDienNuocController;
