const jwt = require("jsonwebtoken");
const db = require("../config/database");

function authenticate(req, res, next) {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : "";

    if (!token) {
        return res.status(401).json({ error: "Iniciá sesión para continuar." });
    }

    try {
        req.user = jwt.verify(token, process.env.JWT_SECRET || "alkorte-local-development-secret");
        return next();
    } catch (error) {
        return res.status(401).json({ error: "La sesión venció. Volvé a iniciar sesión." });
    }
}

async function requireAdmin(req, res, next) {
    try {
        const [users] = await db.execute("SELECT rol FROM usuarios WHERE id = ? LIMIT 1", [req.user.id]);
        if (users[0]?.rol !== "admin") {
            return res.status(403).json({ error: "Esta acción requiere permisos de administrador." });
        }
        return next();
    } catch (error) {
        return next(error);
    }
}

module.exports = { authenticate, requireAdmin };
