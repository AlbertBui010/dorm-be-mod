const lyDoTuChoiService = require("../services/lydotuchoiService");

const getAllLyDoTuChoi = async (req, res) => {
  try {
    const lyDos = await lyDoTuChoiService.getAllLyDoTuChoi();
    res.status(200).json(lyDos);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getAllLyDoTuChoi,
};
