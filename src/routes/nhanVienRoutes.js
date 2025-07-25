const express = require("express");
const router = express.Router();

const nhanVienController = require("../controllers/nhanVienController");
const {
  authenticate,
  authorizeEmployeeManagement,
} = require("../middleware/auth");
const nhanVienValidator = require("../validators/nhanVienValidator");

// Middleware để yêu cầu quyền QuanTriVien cho tất cả routes
router.use(authenticate);
router.use(authorizeEmployeeManagement);

// Routes
router.get("/", nhanVienController.getAll);
router.get("/stats", nhanVienController.getStats);
router.get("/roles", nhanVienController.getRoles);
router.get("/:id", nhanVienController.getById);
router.get("/:id/can-delete", nhanVienController.canDelete);

router.post("/", nhanVienValidator.create, nhanVienController.create);

router.put("/:id", nhanVienValidator.update, nhanVienController.update);

router.delete("/:id", nhanVienController.delete);

module.exports = router;
