const express = require("express");
const controller = require("../../controllers/game/gameController");
const { authenticate } = require("../../middlewares/auth");

const router = express.Router();
router.get("/", authenticate, controller.bootstrap);

module.exports = router;
