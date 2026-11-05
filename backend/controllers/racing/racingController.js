const asyncHandler = require("../shared/asyncHandler");
const service = require("../../services/racing/racingService");

module.exports = {
    runRace: asyncHandler((req) => service.runRace(req.user.id)),
    blacklistRace: asyncHandler((req) => service.blacklistRace(req.user.id)),
    enterChampionship: asyncHandler((req) => service.enterChampionship(req.user.id, req.body.bracket)),
};
