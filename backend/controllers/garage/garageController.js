const asyncHandler = require("../shared/asyncHandler");
const service = require("../../services/garage/garageService");

module.exports = {
    activateCar: asyncHandler((req) => service.activateCar(req.user.id, req.params.carId)),
    equipPiece: asyncHandler((req) => service.equipPiece(req.user.id, req.body)),
    unequipPiece: asyncHandler((req) => service.unequipPiece(req.user.id, req.params.inventoryId)),
    sellItem: asyncHandler((req) => service.sellItem(req.user.id, req.body)),
};
