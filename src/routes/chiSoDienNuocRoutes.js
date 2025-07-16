const express = require("express");
const router = express.Router();
const { authenticate } = require("../middleware/auth");
const chiSoDienNuocController = require("../controllers/chiSoDienNuocController");

const {
  validateCreate,
  validateUpdate,
} = require("../validators/chiSoDienNuocValidator");

router.post("/", authenticate, validateCreate, chiSoDienNuocController.create);
router.put(
  "/:id",
  authenticate,
  validateUpdate,
  chiSoDienNuocController.update
);
router.get("/", authenticate, chiSoDienNuocController.getList);
router.get("/:id", authenticate, chiSoDienNuocController.getById);

module.exports = router;
