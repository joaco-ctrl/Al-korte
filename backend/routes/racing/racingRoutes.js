const express = require("express");
const controller = require("../../controllers/racing/racingController");
const { authenticate } = require("../../middlewares/auth");

const router = express.Router();
router.post("/races", authenticate, controller.runRace);
router.post("/blacklist/race", authenticate, controller.blacklistRace);
router.post("/championships/enter", authenticate, controller.enterChampionship);

module.exports = router;
