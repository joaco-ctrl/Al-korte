const {
    account,
    db,
    httpError,
    positiveInt,
    recordTransaction,
    transaction,
} = require("../shared/gameUtils");
const { bootstrap } = require("../game/gameService");

async function activateCar(userId, carId) {
    const id = positiveInt(carId, "Auto");
    await transaction(async (connection) => {
        const [owned] = await connection.execute(
            "SELECT id FROM cuenta_autos WHERE id_cuenta = ? AND id_auto = ? LIMIT 1 FOR UPDATE",
            [userId, id],
        );
        if (!owned.length) throw httpError("Ese auto no está en tu garaje.", 404);
        await connection.execute("UPDATE cuenta_autos SET activo = 0 WHERE id_cuenta = ?", [userId]);
        await connection.execute("UPDATE cuenta_autos SET activo = 1 WHERE id = ?", [owned[0].id]);
    });
    return bootstrap(userId);
}

async function equipPiece(userId, { inventoryId, carId }) {
    const pieceRowId = positiveInt(inventoryId, "Pieza");
    const targetCarId = positiveInt(carId, "Auto");
    await transaction(async (connection) => {
        const [cars] = await connection.execute(
            "SELECT id FROM cuenta_autos WHERE id_cuenta = ? AND id_auto = ? LIMIT 1",
            [userId, targetCarId],
        );
        if (!cars.length) throw httpError("Ese auto no está en tu garaje.", 404);
        const [items] = await connection.execute(
            `SELECT cp.id, cp.id_pieza, cp.id_auto, p.id_categoria
             FROM cuenta_piezas cp JOIN piezas p ON p.id = cp.id_pieza
             WHERE cp.id = ? AND cp.id_cuenta = ? FOR UPDATE`,
            [pieceRowId, userId],
        );
        if (!items.length) throw httpError("La pieza no está en tu inventario.", 404);
        if (items[0].id_auto !== null) throw httpError("Primero desequipá esta pieza del otro auto.");
        const [conflicts] = await connection.execute(
            `SELECT cp.id FROM cuenta_piezas cp JOIN piezas p ON p.id = cp.id_pieza
             WHERE cp.id_cuenta = ? AND cp.id_auto = ? AND p.id_categoria = ? FOR UPDATE`,
            [userId, targetCarId, items[0].id_categoria],
        );
        for (const conflict of conflicts) {
            await connection.execute("UPDATE cuenta_piezas SET id_auto = NULL WHERE id = ?", [conflict.id]);
        }
        await connection.execute("UPDATE cuenta_piezas SET id_auto = ? WHERE id = ?", [targetCarId, pieceRowId]);
    });
    return bootstrap(userId);
}

async function unequipPiece(userId, inventoryId) {
    const id = positiveInt(inventoryId, "Pieza");
    const [result] = await db.execute(
        "UPDATE cuenta_piezas SET id_auto = NULL WHERE id = ? AND id_cuenta = ? AND id_auto IS NOT NULL",
        [id, userId],
    );
    if (!result.affectedRows) throw httpError("No se encontró una pieza equipada con ese identificador.", 404);
    return bootstrap(userId);
}

async function sellItem(userId, { type, id }) {
    const rowId = positiveInt(id, "Artículo");
    if (!["auto", "pieza"].includes(type)) throw httpError("Tipo de artículo inválido.");
    let saleValue;
    await transaction(async (connection) => {
        await account(connection, userId, true);
        if (type === "auto") {
            const [rows] = await connection.execute(
                `SELECT ca.id, ca.activo, a.precio FROM cuenta_autos ca
                 JOIN autos a ON a.id = ca.id_auto WHERE ca.id = ? AND ca.id_cuenta = ? FOR UPDATE`,
                [rowId, userId],
            );
            if (!rows.length) throw httpError("Auto no encontrado en el garaje.", 404);
            if (rows[0].activo) throw httpError("Activá otro auto antes de revender este.");
            saleValue = Math.floor(Number(rows[0].precio) * 0.5);
            await connection.execute("DELETE FROM cuenta_autos WHERE id = ?", [rowId]);
        } else {
            const [rows] = await connection.execute(
                `SELECT cp.id, p.precio FROM cuenta_piezas cp JOIN piezas p ON p.id = cp.id_pieza
                 WHERE cp.id = ? AND cp.id_cuenta = ? AND cp.id_auto IS NULL FOR UPDATE`,
                [rowId, userId],
            );
            if (!rows.length) throw httpError("Solo podés revender piezas que estén en tu inventario.", 409);
            saleValue = Math.floor(Number(rows[0].precio) * 0.5);
            await connection.execute("DELETE FROM cuenta_piezas WHERE id = ?", [rowId]);
        }
        await connection.execute("UPDATE usuarios SET saldo = saldo + ? WHERE id = ?", [saleValue, userId]);
        await recordTransaction(connection, userId, type.toUpperCase(), "SALDO", saleValue);
    });
    return { ...(await bootstrap(userId)), mensaje: `Venta realizada: +$${saleValue}.` };
}

module.exports = { activateCar, equipPiece, sellItem, unequipPiece };
