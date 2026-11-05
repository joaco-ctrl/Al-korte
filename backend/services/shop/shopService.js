const {
    account,
    db,
    giveInitialPieces,
    httpError,
    positiveInt,
    recordTransaction,
    transaction,
} = require("../shared/gameUtils");
const { bootstrap } = require("../game/gameService");

async function purchase(userId, { type, id, currency = "SALDO" }) {
    const itemId = positiveInt(id, "Artículo");
    if (!["auto", "pieza"].includes(type)) throw httpError("Tipo de artículo inválido.");
    if (!["SALDO", "FICHAS"].includes(currency)) throw httpError("Moneda inválida.");
    const table = type === "auto" ? "autos" : "piezas";
    const priceColumn = currency === "FICHAS" ? "precio_fichas" : "precio";
    const balanceColumn = currency === "FICHAS" ? "fichas_casino" : "saldo";

    await transaction(async (connection) => {
        const user = await account(connection, userId, true);
        const rarityFilter = currency === "FICHAS" ? " AND id_rareza = 5" : "";
        const [items] = await connection.execute(
            `SELECT id, ${priceColumn} AS price FROM ${table} WHERE id = ?${rarityFilter} FOR UPDATE`,
            [itemId],
        );
        if (!items.length) throw httpError(currency === "FICHAS"
            ? "El artículo no pertenece a la tienda especial."
            : "Artículo no encontrado.", 404);
        const price = Number(items[0].price);
        if (price <= 0 || user[balanceColumn] < price) {
            throw httpError(currency === "FICHAS" ? "No tenés fichas suficientes." : "No tenés saldo suficiente.");
        }
        await connection.execute(
            `UPDATE usuarios SET ${balanceColumn} = ${balanceColumn} - ? WHERE id = ?`,
            [price, userId],
        );
        if (type === "auto") {
            const active = currency === "SALDO" ? 1 : 0;
            if (active) await connection.execute("UPDATE cuenta_autos SET activo = 0 WHERE id_cuenta = ?", [userId]);
            await connection.execute(
                "INSERT INTO cuenta_autos (id_auto, id_cuenta, activo) VALUES (?, ?, ?)",
                [itemId, userId, active],
            );
            await giveInitialPieces(connection, userId, itemId);
        } else {
            await connection.execute(
                "INSERT INTO cuenta_piezas (id_cuenta, id_auto, id_pieza) VALUES (?, NULL, ?)",
                [userId, itemId],
            );
        }
        await recordTransaction(connection, userId, type.toUpperCase(), currency, -price);
    });
    return bootstrap(userId);
}

function buyItem(userId, item) {
    return purchase(userId, { ...item, currency: "SALDO" });
}

function buySpecialItem(userId, item) {
    return purchase(userId, { ...item, currency: "FICHAS" });
}

module.exports = { buyItem, buySpecialItem };
