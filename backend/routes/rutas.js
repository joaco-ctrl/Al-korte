const express = require("express");
const db = require("../config/database");

const router = express.Router();
router.get("/health", async (req, res, next) => {
    try {
        await db.query("SELECT 1");
        return res.json({ status: "ok" });
    } catch (error) {
        return next(error);
    }
});

router.use(require("./auth/authRoutes"));
router.use("/game", require("./game/gameRoutes"));
router.use(require("./garage/garageRoutes"));
router.use(require("./shop/shopRoutes"));
router.use(require("./racing/racingRoutes"));
router.use(require("./casino/casinoRoutes"));
router.use("/admin", require("./admin/adminRoutes"));

module.exports = router;
