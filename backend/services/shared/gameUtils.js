const db = require("../../config/database");

function httpError(message, status = 400) {
    return Object.assign(new Error(message), { status });
}

async function transaction(work) {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        const result = await work(connection);
        await connection.commit();
        return result;
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
}

function positiveInt(value, label) {
    const parsed = Number(value);
    if (!Number.isSafeInteger(parsed) || parsed <= 0) throw httpError(`${label} inválido.`);
    return parsed;
}

function powerScore(stats) {
    return Math.round((Number(stats.HP) + Number(stats.NM) + Number(stats.Agarre)) / 3);
}

async function account(connection, id, lock = false) {
    const [rows] = await connection.execute(
        `SELECT id, nombre, saldo, fichas_casino, blacklist_nivel, rol
         FROM usuarios WHERE id = ? ${lock ? "FOR UPDATE" : ""}`,
        [id],
    );
    if (!rows.length) throw httpError("La cuenta ya no existe.", 404);
    return rows[0];
}

async function getActiveCar(connection, userId, lock = false) {
    const [cars] = await connection.execute(
        `SELECT ca.id AS cuenta_auto_id, ca.id_auto, ca.activo, a.nombre, a.HP, a.NM, a.Agarre,
                a.precio, a.precio_fichas, a.id_rareza, a.imagen
         FROM cuenta_autos ca JOIN autos a ON a.id = ca.id_auto
         WHERE ca.id_cuenta = ? AND ca.activo = 1 LIMIT 1 ${lock ? "FOR UPDATE" : ""}`,
        [userId],
    );
    if (!cars.length) throw httpError("No hay auto activo. Elegí uno en el garaje para poder correr.", 409);
    return cars[0];
}

async function getCarStats(connection, userId, car) {
    const [pieces] = await connection.execute(
        `SELECT cp.id AS cuenta_pieza_id, cp.id_pieza, cp.id_auto, p.nombre, p.HP, p.NM,
                p.Agarre, p.id_categoria, c.nombre AS categoria
         FROM cuenta_piezas cp
         JOIN piezas p ON p.id = cp.id_pieza
         JOIN categorias c ON c.id = p.id_categoria
         WHERE cp.id_cuenta = ? AND cp.id_auto = ?`,
        [userId, car.id_auto],
    );
    const stats = pieces.reduce((total, piece) => ({
        HP: total.HP + Number(piece.HP),
        NM: total.NM + Number(piece.NM),
        Agarre: total.Agarre + Number(piece.Agarre),
    }), { HP: Number(car.HP), NM: Number(car.NM), Agarre: Number(car.Agarre) });
    return { ...stats, PR: powerScore(stats), pieces };
}

function simulateRace(playerPR, opponentPR, traction, rawPower = playerPR * 2) {
    const turns = [];
    let playerProgress = 0;
    let opponentProgress = 0;
    const slipRisk = Math.max(0, Math.min(0.58, ((rawPower - traction) / Math.max(rawPower, 1)) * 0.65));
    const distance = 100;
    for (let turn = 0; turn < 12 && playerProgress < distance && opponentProgress < distance; turn += 1) {
        const spunOut = Math.random() < slipRisk;
        const playerAdvance = spunOut ? 0 : Math.max(2, 5 + playerPR / 25 + Math.random() * 8);
        const opponentAdvance = Math.max(2, 5 + opponentPR / 25 + Math.random() * 8);
        playerProgress = Math.min(distance, playerProgress + playerAdvance);
        opponentProgress = Math.min(distance, opponentProgress + opponentAdvance);
        turns.push({
            turn: turn + 1,
            player: Math.round(playerProgress),
            rival: Math.round(opponentProgress),
            spunOut,
        });
    }
    return {
        won: playerProgress >= opponentProgress,
        turns,
        slipRisk: Math.round(slipRisk * 100),
        playerPR,
        opponentPR,
    };
}

async function recordTransaction(connection, userId, type, currency, amount) {
    await connection.execute(
        "INSERT INTO transacciones (id_cuenta, tipo, moneda, monto) VALUES (?, ?, ?, ?)",
        [userId, type, currency, amount],
    );
}

async function giveInitialPieces(connection, userId, carId) {
    await connection.execute(
        `INSERT INTO cuenta_piezas (id_cuenta, id_auto, id_pieza)
         SELECT ?, ?, MIN(p.id) FROM piezas p
         WHERE NOT EXISTS (
             SELECT 1 FROM cuenta_piezas cp
             JOIN piezas equipped_piece ON equipped_piece.id = cp.id_pieza
             WHERE cp.id_cuenta = ? AND cp.id_auto = ? AND equipped_piece.id_categoria = p.id_categoria
         )
         GROUP BY p.id_categoria`,
        [userId, carId, userId, carId],
    );
}

module.exports = {
    account,
    db,
    getActiveCar,
    getCarStats,
    giveInitialPieces,
    httpError,
    positiveInt,
    powerScore,
    recordTransaction,
    simulateRace,
    transaction,
};
