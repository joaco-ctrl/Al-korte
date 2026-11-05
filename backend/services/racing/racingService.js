const {
    account,
    getActiveCar,
    getCarStats,
    giveInitialPieces,
    httpError,
    powerScore,
    recordTransaction,
    simulateRace,
    transaction,
} = require("../shared/gameUtils");
const { bootstrap } = require("../game/gameService");

async function runRace(userId) {
    let result;
    await transaction(async (connection) => {
        const car = await getActiveCar(connection, userId, true);
        const stats = await getCarStats(connection, userId, car);
        const rivalPR = Math.max(10, Math.round(stats.PR * (0.78 + Math.random() * 0.44)));
        result = { ...simulateRace(stats.PR, rivalPR, stats.Agarre, stats.HP + stats.NM), auto: car.nombre };
        const reward = result.won ? 350 : 75;
        await connection.execute("UPDATE usuarios SET saldo = saldo + ? WHERE id = ?", [reward, userId]);
        await recordTransaction(connection, userId, "AUTO", "SALDO", reward);
        result.reward = reward;
        result.currency = "saldo";
    });
    return result;
}

async function blacklistRace(userId) {
    let outcome;
    await transaction(async (connection) => {
        const user = await account(connection, userId, true);
        if (user.blacklist_nivel > 3) throw httpError("Completaste los tres niveles de la Blacklist.", 409);
        const [rivals] = await connection.execute(
            "SELECT * FROM blacklist_rivales WHERE nivel = ? LIMIT 1",
            [user.blacklist_nivel],
        );
        if (!rivals.length) throw httpError("No hay un rival configurado para este nivel.", 503);
        const rival = rivals[0];
        const car = await getActiveCar(connection, userId, true);
        const stats = await getCarStats(connection, userId, car);
        outcome = {
            ...simulateRace(
                stats.PR,
                powerScore({ HP: rival.hp_rival, NM: rival.nm_rival, Agarre: rival.agarre_rival }),
                stats.Agarre,
                stats.HP + stats.NM,
            ),
            auto: car.nombre,
            rival: rival.nombre_rival,
            nivel: rival.nivel,
        };
        if (outcome.won) {
            await connection.execute(
                "INSERT INTO cuenta_autos (id_auto, id_cuenta, activo) VALUES (?, ?, 0)",
                [rival.auto_recompensa_id, userId],
            );
            await giveInitialPieces(connection, userId, rival.auto_recompensa_id);
            await connection.execute(
                "UPDATE usuarios SET blacklist_nivel = blacklist_nivel + 1 WHERE id = ?",
                [userId],
            );
            outcome.recompensa = "Auto del rival";
        } else {
            await connection.execute("DELETE FROM cuenta_autos WHERE id = ? AND id_cuenta = ?", [car.cuenta_auto_id, userId]);
            outcome.recompensa = "Pink slip: perdiste tu auto activo.";
        }
    });
    return { ...outcome, ...(await bootstrap(userId)) };
}

async function enterChampionship(userId, bracket) {
    const fee = 300;
    const brackets = {
        street: { label: "Street", minPR: 0, maxPR: 55 },
        pro: { label: "Pro", minPR: 55, maxPR: 100 },
        elite: { label: "Elite", minPR: 100, maxPR: Infinity },
    };
    const selected = brackets[bracket];
    if (!selected) throw httpError("Categoría de campeonato inválida.");
    let raceResult;
    await transaction(async (connection) => {
        const user = await account(connection, userId, true);
        const car = await getActiveCar(connection, userId, true);
        const stats = await getCarStats(connection, userId, car);
        if (stats.PR > selected.maxPR || (bracket !== "street" && stats.PR <= selected.minPR)) {
            throw httpError(`Tu PR no corresponde a la categoría ${selected.label}.`);
        }
        if (user.saldo < fee) throw httpError("No tenés saldo suficiente para la inscripción.");
        await connection.execute("UPDATE usuarios SET saldo = saldo - ? WHERE id = ?", [fee, userId]);
        await recordTransaction(connection, userId, "AUTO", "SALDO", -fee);
        raceResult = {
            ...simulateRace(stats.PR, Math.round(stats.PR * (0.82 + Math.random() * 0.38)), stats.Agarre, stats.HP + stats.NM),
        };
        if (raceResult.won) {
            await connection.execute("UPDATE usuarios SET saldo = saldo + 1400 WHERE id = ?", [userId]);
            await recordTransaction(connection, userId, "AUTO", "SALDO", 1400);
        }
        raceResult.premio = raceResult.won ? 1400 : 0;
    });
    return { ...raceResult, categoria: selected.label, inscripcion: fee };
}

module.exports = { blacklistRace, enterChampionship, runRace };
