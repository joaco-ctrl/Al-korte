const asyncHandler = require("../shared/asyncHandler");
const service = require("../../services/casino/casinoService");

module.exports = {
    roulette: asyncHandler((req) => service.roulette(req.user.id, req.body)),
    blackjack: asyncHandler((req) => service.blackjack(req.user.id, req.body.action, req.body.amount)),
};
