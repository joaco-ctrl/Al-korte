const express = require("express");
const controller = require("../../controllers/auth/authController");
const { authenticate } = require("../../middlewares/auth");

const router = express.Router();
router.post("/registro", controller.register);
router.post("/login", controller.login);
router.get("/me", authenticate, controller.me);

module.exports = router;
