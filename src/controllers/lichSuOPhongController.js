const LichSuOPhongService = require("../services/lichSuOPhongService");
const { successResponse, paginationResponse } = require("../utils/response");

class LichSuOPhongController {
  async getAllLichSuOPhong(req, res, next) {
    try {
      const { page, limit, MaSinhVien, MaPhong } = req.query;

      const filters = {
        MaSinhVien,
        MaPhong,
      };

      const pagination = { page, limit };

      const result = await LichSuOPhongService.getAllLichSuOPhong(
        filters,
        pagination
      );

      return paginationResponse(
        res,
        result.lichSuOPhongs,
        result.pagination,
        "Lấy danh sách lịch sử ở phòng thành công"
      );
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new LichSuOPhongController();
