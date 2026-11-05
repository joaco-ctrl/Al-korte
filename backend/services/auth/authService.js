const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../../config/database");

function publicUser(user) {
    return {
        id: user.id,
        nombre: user.nombre,
        email: user.email,
        saldo: user.saldo,
        fichas_casino: user.fichas_casino,
        blacklist_nivel: user.blacklist_nivel,
        rol: user.rol,
    };
}

function createToken(user) {
    return jwt.sign(
        { id: user.id, rol: user.rol, nombre: user.nombre },
        process.env.JWT_SECRET || "alkorte-local-development-secret",
        { expiresIn: "7d" },
    );
}

async function register({ nombre, email, password }) {
    if (typeof nombre !== "string" || nombre.trim().length < 2 || nombre.trim().length > 25) {
        throw Object.assign(new Error("El nombre debe tener entre 2 y 25 caracteres."), { status: 400 });
    }
    if (typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 100) {
        throw Object.assign(new Error("Ingresá un email válido."), { status: 400 });
    }
    if (typeof password !== "string" || password.length < 8 || password.length > 72) {
        throw Object.assign(new Error("La contraseña debe tener entre 8 y 72 caracteres."), { status: 400 });
    }

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        const [autos] = await connection.query("SELECT id FROM autos ORDER BY id LIMIT 1");
        if (!autos.length) {
            throw Object.assign(new Error("No hay autos iniciales configurados."), { status: 503 });
        }
        const hash = await bcrypt.hash(password, 10);
        const [result] = await connection.execute(
            "INSERT INTO usuarios (nombre, email, password, fichas_casino) VALUES (?, ?, ?, 100)",
            [nombre.trim(), email.trim().toLowerCase(), hash],
        );
        await connection.execute(
            "INSERT INTO transacciones (id_cuenta, tipo, moneda, monto) VALUES (?, 'CASINO', 'FICHAS', 100)",
            [result.insertId],
        );
        await connection.execute(
            "INSERT INTO transacciones (id_cuenta, tipo, moneda, monto) VALUES (?, 'AUTO', 'SALDO', 0)",
            [result.insertId],
        );
        await connection.execute(
            "INSERT INTO cuenta_autos (id_auto, id_cuenta, activo) VALUES (?, ?, 1)",
            [autos[0].id, result.insertId],
        );
        await connection.execute(
            `INSERT INTO cuenta_piezas (id_cuenta, id_auto, id_pieza)
             SELECT ?, ?, MIN(id) FROM piezas GROUP BY id_categoria`,
            [result.insertId, autos[0].id],
        );
        await connection.commit();
        const user = {
            id: result.insertId, nombre: nombre.trim(), email: email.trim().toLowerCase(),
            saldo: 1000, fichas_casino: 100, blacklist_nivel: 1, rol: "user",
        };
        return { token: createToken(user), user };
    } catch (error) {
        await connection.rollback();
        if (error.code === "ER_DUP_ENTRY") {
            throw Object.assign(new Error("Ya existe una cuenta con ese email."), { status: 409 });
        }
        throw error;
    } finally {
        connection.release();
    }
}

async function login({ email, password }) {
    if (typeof email !== "string" || typeof password !== "string" || !email || !password) {
        throw Object.assign(new Error("Ingresá email y contraseña."), { status: 400 });
    }
    const [rows] = await db.execute("SELECT * FROM usuarios WHERE email = ? LIMIT 1", [email.trim().toLowerCase()]);
    if (!rows.length || !(await bcrypt.compare(password, rows[0].password))) {
        throw Object.assign(new Error("Email o contraseña incorrectos."), { status: 401 });
    }
    const user = publicUser(rows[0]);
    return { token: createToken(user), user };
}

async function getCurrentUser(id) {
    const [rows] = await db.execute(
        "SELECT id, nombre, email, saldo, fichas_casino, blacklist_nivel, rol FROM usuarios WHERE id = ?",
        [id],
    );
    if (!rows.length) throw Object.assign(new Error("La cuenta ya no existe."), { status: 404 });
    return rows[0];
}

module.exports = { register, login, getCurrentUser };
