const express = require("express");
const controller = require("../../controllers/shop/shopController");
const { authenticate } = require("../../middlewares/auth");

const router = express.Router();
router.post("/buy", authenticate, controller.buyItem);
router.post("/casino/store/buy", authenticate, controller.buySpecialItem);
router.post("/boxes/open", authenticate, controller.openBox);

module.exports = router;
