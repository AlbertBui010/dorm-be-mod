const express = require("express");
const router = express.Router();
const lyDoTuChoiController = require("../controllers/lydotuchoiController");

// GET /api/ly-do-tu-choi
router.get("/", lyDoTuChoiController.getAllLyDoTuChoi);

module.exports = router;
