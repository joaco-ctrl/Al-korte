const express = require("express");
const controller = require("../../controllers/casino/casinoController");
const { authenticate } = require("../../middlewares/auth");

const router = express.Router();
router.post("/casino/roulette", authenticate, controller.roulette);
router.post("/casino/blackjack", authenticate, controller.blackjack);

module.exports = router;
