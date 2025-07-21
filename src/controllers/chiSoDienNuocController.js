const { validationResult } = require("express-validator");
const chiSoDienNuocService = require("../services/chiSoDienNuocService");
const { successResponse, errorResponse } = require("../utils/response");

class ChiSoDienNuocController {
  async create(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return errorResponse(res, errors.array(), 422);
      }
      const result = await chiSoDienNuocService.create(req.body, req.user);
      return successResponse(
        res,
        result,
        "Tạo chỉ số điện nước thành công",
        201
      );
    } catch (err) {
      next(err);
    }
  }

  async update(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return errorResponse(res, errors.array(), 422);
      }
      const result = await chiSoDienNuocService.update(
        req.params.id,
        req.body,
        req.user
      );
      return successResponse(
        res,
        result,
        "Cập nhật chỉ số điện nước thành công"
      );
    } catch (err) {
      next(err);
    }
  }

  async getById(req, res, next) {
    try {
      const result = await chiSoDienNuocService.getById(req.params.id);
      if (!result) return errorResponse(res, "Không tìm thấy chỉ số", 404);
      return successResponse(res, result, "Lấy chỉ số điện nước thành công");
    } catch (err) {
      next(err);
    }
  }

  async getList(req, res, next) {
    try {
      const { page, limit, search } = req.query;
      const filter = {
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 10,
        search: search || "",
      };
      const result = await chiSoDienNuocService.getList(filter);
      return successResponse(
        res,
        result,
        "Lấy danh sách chỉ số điện nước thành công"
      );
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new ChiSoDienNuocController();
