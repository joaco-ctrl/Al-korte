const asyncHandler = require("../shared/asyncHandler");
const service = require("../../services/shop/shopService");
const { openBox } = require("../../services/loot-box/lootBoxService");

module.exports = {
    buyItem: asyncHandler((req) => service.buyItem(req.user.id, req.body), 201),
    buySpecialItem: asyncHandler((req) => service.buySpecialItem(req.user.id, req.body), 201),
    openBox: asyncHandler((req) => openBox(req.user.id, req.body.type)),
};
