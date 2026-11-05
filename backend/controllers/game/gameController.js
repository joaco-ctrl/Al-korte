const asyncHandler = require("../shared/asyncHandler");
const { bootstrap } = require("../../services/game/gameService");

module.exports = {
    bootstrap: asyncHandler((req) => bootstrap(req.user.id)),
};
