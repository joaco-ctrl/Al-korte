const authService = require("../../services/auth/authService");

async function register(req, res, next) {
    try {
        return res.status(201).json(await authService.register(req.body));
    } catch (error) {
        return next(error);
    }
}

async function login(req, res, next) {
    try {
        return res.json(await authService.login(req.body));
    } catch (error) {
        return next(error);
    }
}

async function me(req, res, next) {
    try {
        return res.json({ user: await authService.getCurrentUser(req.user.id) });
    } catch (error) {
        return next(error);
    }
}

module.exports = { register, login, me };
