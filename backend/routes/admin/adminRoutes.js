const express = require("express");
const controller = require("../../controllers/admin/adminController");
const { authenticate, requireAdmin } = require("../../middlewares/auth");

const router = express.Router();
router.use(authenticate, requireAdmin);
router.get("/:type", controller.list);
router.post("/:type", controller.save);
router.put("/:type/:id", controller.save);
router.delete("/:type/:id", controller.remove);

module.exports = router;
