const LyDoTuChoi = require("../models/LyDoTuChoi");

const getAllLyDoTuChoi = async () => {
  try {
    const lyDos = await LyDoTuChoi.findAll();
    return lyDos;
  } catch (error) {
    throw new Error("Không thể lấy danh sách lý do từ chối: " + error.message);
  }
};

module.exports = {
  getAllLyDoTuChoi,
};
