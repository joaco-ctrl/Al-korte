function asyncHandler(work, status = 200) {
    return async (req, res, next) => {
        try {
            return res.status(status).json(await work(req));
        } catch (error) {
            return next(error);
        }
    };
}

module.exports = asyncHandler;
