const {
    account,
    db,
    giveInitialPieces,
    powerScore,
    recordTransaction,
    transaction,
} = require("../shared/gameUtils");

async function bootstrap(userId) {
    await transaction(async (connection) => {
        const user = await account(connection, userId, true);
        if (Number(user.fichas_casino) === 0) {
            const [history] = await connection.execute(
                "SELECT id FROM transacciones WHERE id_cuenta = ? AND tipo = 'CASINO' AND moneda = 'FICHAS' LIMIT 1",
                [userId],
            );
            if (!history.length) {
                await connection.execute("UPDATE usuarios SET fichas_casino = 100 WHERE id = ?", [userId]);
                await recordTransaction(connection, userId, "CASINO", "FICHAS", 100);
            }
        }

        const [garage] = await connection.execute(
            "SELECT id, id_auto, activo FROM cuenta_autos WHERE id_cuenta = ? ORDER BY activo DESC, id LIMIT 1 FOR UPDATE",
            [userId],
        );
        const [initialCar] = await connection.execute(
            `SELECT id FROM transacciones
             WHERE id_cuenta = ? AND tipo = 'AUTO' AND moneda = 'SALDO' AND monto = 0
             LIMIT 1`,
            [userId],
        );
        if (!garage.length) {
            if (initialCar.length) return;
            const [starterCars] = await connection.query("SELECT id FROM autos ORDER BY precio, id LIMIT 1");
            if (!starterCars.length) {
                throw Object.assign(new Error("No hay autos cargados. Importá el catálogo antes de jugar."), { status: 503 });
            }
            await connection.execute(
                "INSERT INTO cuenta_autos (id_auto, id_cuenta, activo) VALUES (?, ?, 1)",
                [starterCars[0].id, userId],
            );
            await giveInitialPieces(connection, userId, starterCars[0].id);
            await recordTransaction(connection, userId, "AUTO", "SALDO", 0);
        } else {
            if (!initialCar.length) await recordTransaction(connection, userId, "AUTO", "SALDO", 0);
            const [activeCars] = await connection.execute(
                "SELECT id FROM cuenta_autos WHERE id_cuenta = ? AND activo = 1 LIMIT 1 FOR UPDATE",
                [userId],
            );
            if (!activeCars.length) {
                await connection.execute("UPDATE cuenta_autos SET activo = 1 WHERE id = ?", [garage[0].id]);
                garage[0].activo = 1;
            }
            const activeCarId = garage.find((car) => car.activo)?.id_auto || garage[0].id_auto;
            await giveInitialPieces(connection, userId, activeCarId);
        }
    });

    const user = await account(db, userId);
    const [cars, pieces, categories, rarities, rivals, specialCars, specialPieces, shopCars, shopPieces] = await Promise.all([
        db.execute(
            `SELECT ca.id AS cuenta_auto_id, ca.id_auto, ca.activo, a.nombre, a.precio, a.precio_fichas,
                    a.HP, a.NM, a.Agarre, a.id_rareza, a.imagen,
                    r.nombre AS rareza
             FROM cuenta_autos ca JOIN autos a ON a.id = ca.id_auto
             JOIN rarezas r ON r.id = a.id_rareza
             WHERE ca.id_cuenta = ? ORDER BY ca.activo DESC, ca.id`,
            [userId],
        ),
        db.execute(
            `SELECT cp.id AS cuenta_pieza_id, cp.id_pieza, cp.id_auto, p.nombre, p.precio,
                    p.precio_fichas, p.HP, p.NM, p.Agarre, p.id_categoria, p.id_rareza,
                    c.nombre AS categoria, r.nombre AS rareza
             FROM cuenta_piezas cp JOIN piezas p ON p.id = cp.id_pieza
             JOIN categorias c ON c.id = p.id_categoria JOIN rarezas r ON r.id = p.id_rareza
             WHERE cp.id_cuenta = ? ORDER BY cp.id_auto IS NULL, cp.id`,
            [userId],
        ),
        db.query("SELECT id, nombre FROM categorias ORDER BY id"),
        db.query("SELECT id, nombre FROM rarezas ORDER BY id"),
        db.query("SELECT nivel, nombre_rival, hp_rival, nm_rival, agarre_rival FROM blacklist_rivales ORDER BY nivel"),
        db.query(
            `SELECT a.id, a.nombre, a.precio_fichas, a.HP, a.NM, a.Agarre, a.imagen, r.nombre AS rareza
             FROM autos a JOIN rarezas r ON r.id = a.id_rareza WHERE a.id_rareza = 5 ORDER BY a.id`,
        ),
        db.query(
            `SELECT p.id, p.nombre, p.precio_fichas, p.HP, p.NM, p.Agarre, c.nombre AS categoria, r.nombre AS rareza
             FROM piezas p JOIN rarezas r ON r.id = p.id_rareza JOIN categorias c ON c.id = p.id_categoria
             WHERE p.id_rareza = 5 ORDER BY p.id`,
        ),
        db.query(
            `SELECT a.id, a.nombre, a.precio, a.HP, a.NM, a.Agarre, a.id_rareza, a.imagen,
                    r.nombre AS rareza FROM autos a JOIN rarezas r ON r.id = a.id_rareza ORDER BY a.precio`,
        ),
        db.query(
            `SELECT p.id, p.nombre, p.precio, p.HP, p.NM, p.Agarre, p.id_categoria, p.id_rareza,
                    c.nombre AS categoria, r.nombre AS rareza
             FROM piezas p JOIN categorias c ON c.id = p.id_categoria
             JOIN rarezas r ON r.id = p.id_rareza ORDER BY p.precio`,
        ),
    ]);

    return {
        user,
        garage: cars[0].map((car) => ({ ...car, PR: powerScore(car) })),
        inventory: pieces[0],
        categories: categories[0],
        rarities: rarities[0],
        rivals: rivals[0],
        casinoStore: { autos: specialCars[0], piezas: specialPieces[0] },
        shop: { autos: shopCars[0], piezas: shopPieces[0] },
    };
}

module.exports = { bootstrap };
