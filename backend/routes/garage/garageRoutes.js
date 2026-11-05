const express = require("express");
const controller = require("../../controllers/garage/garageController");
const { authenticate } = require("../../middlewares/auth");

const router = express.Router();
router.put("/garage/:carId/active", authenticate, controller.activateCar);
router.post("/inventory/equip", authenticate, controller.equipPiece);
router.delete("/inventory/:inventoryId/equip", authenticate, controller.unequipPiece);
router.post("/inventory/sell", authenticate, controller.sellItem);

module.exports = router;
