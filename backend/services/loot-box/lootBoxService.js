const {
    account,
    db,
    giveInitialPieces,
    httpError,
    recordTransaction,
    transaction,
} = require("../shared/gameUtils");
const { bootstrap } = require("../game/gameService");

const boxPrice = 650;
const rarityWeights = { 1: 58, 2: 25, 3: 11, 4: 5, 5: 1 };

function pickWeightedRarity() {
    const entries = Object.entries(rarityWeights);
    let choice = Math.random() * entries.reduce((sum, [, weight]) => sum + weight, 0);
    for (const [rarity, weight] of entries) {
        choice -= weight;
        if (choice < 0) return Number(rarity);
    }
    return 1;
}

async function openBox(userId, type) {
    if (!["auto", "pieza"].includes(type)) throw httpError("Tipo de caja inválido.");
    let prize;
    await transaction(async (connection) => {
        const user = await account(connection, userId, true);
        if (user.saldo < boxPrice) throw httpError(`La caja cuesta $${boxPrice}.`);
        const [items] = type === "auto"
            ? await connection.query("SELECT a.*, r.nombre AS rareza FROM autos a JOIN rarezas r ON r.id = a.id_rareza")
            : await connection.query(
                `SELECT p.*, r.nombre AS rareza, c.nombre AS categoria
                 FROM piezas p JOIN rarezas r ON r.id = p.id_rareza
                 JOIN categorias c ON c.id = p.id_categoria`,
            );
        if (!items.length) throw httpError("No hay premios configurados.");
        const rarity = pickWeightedRarity();
        const candidates = items.filter((item) => Number(item.id_rareza) === rarity);
        const pool = candidates.length ? candidates : items;
        prize = pool[Math.floor(Math.random() * pool.length)];
        await connection.execute("UPDATE usuarios SET saldo = saldo - ? WHERE id = ?", [boxPrice, userId]);
        if (type === "auto") {
            await connection.execute(
                "INSERT INTO cuenta_autos (id_auto, id_cuenta, activo) VALUES (?, ?, 0)",
                [prize.id, userId],
            );
            await giveInitialPieces(connection, userId, prize.id);
        } else {
            await connection.execute(
                "INSERT INTO cuenta_piezas (id_cuenta, id_auto, id_pieza) VALUES (?, NULL, ?)",
                [userId, prize.id],
            );
        }
        await recordTransaction(connection, userId, "CAJA", "SALDO", -boxPrice);
    });
    return { premio: prize, tipo: type, precio: boxPrice, ...(await bootstrap(userId)) };
}

module.exports = { boxPrice, openBox };
