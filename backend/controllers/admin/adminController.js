const asyncHandler = require("../shared/asyncHandler");
const service = require("../../services/admin/adminService");

module.exports = {
    list: asyncHandler((req) => service.adminList(req.params.type)),
    save: asyncHandler((req) => service.adminSave(req.params.type, req.params.id, req.body)),
    remove: asyncHandler((req) => service.adminDelete(req.params.type, req.params.id)),
};
