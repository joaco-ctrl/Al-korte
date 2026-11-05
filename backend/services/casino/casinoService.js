const authService = require("../auth/authService");
const {
    account,
    db,
    httpError,
    positiveInt,
    recordTransaction,
    transaction,
} = require("../shared/gameUtils");

const blackjackGames = new Map();

async function roulette(userId, { amount, choice }) {
    const wager = positiveInt(amount, "Apuesta");
    const validChoice = choice === "red" || choice === "black" || choice === "green"
        || (Number.isInteger(Number(choice)) && Number(choice) >= 0 && Number(choice) <= 36);
    if (!validChoice) throw httpError("Elegí rojo, negro, verde o un número del 0 al 36.");
    const number = Math.floor(Math.random() * 37);
    const redNumbers = new Set([1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36]);
    const color = number === 0 ? "green" : redNumbers.has(number) ? "red" : "black";
    const win = String(choice) === String(number) || choice === color;
    const payout = win ? (String(choice) === String(number) || choice === "green" ? wager * 36 : wager * 2) : 0;
    await transaction(async (connection) => {
        const user = await account(connection, userId, true);
        if (user.fichas_casino < wager) throw httpError("No tenés fichas suficientes.");
        await connection.execute(
            "UPDATE usuarios SET fichas_casino = fichas_casino - ? + ? WHERE id = ?",
            [wager, payout, userId],
        );
        await recordTransaction(connection, userId, "CASINO", "FICHAS", -wager + payout);
    });
    return { number, color, win, apuesta: wager, pago: payout, user: await authService.getCurrentUser(userId) };
}

function drawCard() {
    const rank = Math.floor(Math.random() * 13) + 1;
    const suit = ["♠", "♥", "♦", "♣"][Math.floor(Math.random() * 4)];
    return {
        rank: Math.min(rank, 10),
        name: rank === 1 ? "A" : rank > 10 ? ["J", "Q", "K"][rank - 11] : String(rank),
        suit,
    };
}

function handValue(cards) {
    let total = cards.reduce((sum, card) => sum + card.rank, 0);
    let aces = cards.filter((card) => card.rank === 1).length;
    while (aces > 0 && total + 10 <= 21) {
        total += 10;
        aces -= 1;
    }
    return total;
}

async function settleBlackjack(userId, game) {
    while (handValue(game.dealer) < 17) game.dealer.push(drawCard());
    const playerTotal = handValue(game.player);
    const dealerTotal = handValue(game.dealer);
    const playerNatural = game.player.length === 2 && playerTotal === 21;
    const dealerNatural = game.dealer.length === 2 && dealerTotal === 21;
    const won = playerTotal <= 21 && (dealerTotal > 21 || playerTotal > dealerTotal);
    const push = playerTotal <= 21 && (playerTotal === dealerTotal || (playerNatural && dealerNatural));
    const payout = push ? game.wager : won ? (playerNatural && !dealerNatural ? Math.floor(game.wager * 2.5) : game.wager * 2) : 0;
    await transaction(async (connection) => {
        if (payout) {
            await connection.execute("UPDATE usuarios SET fichas_casino = fichas_casino + ? WHERE id = ?", [payout, userId]);
            await recordTransaction(connection, userId, "CASINO", "FICHAS", payout);
        }
    });
    game.done = true;
    blackjackGames.delete(userId);
    return {
        game: { player: game.player, dealer: game.dealer, playerTotal, dealerTotal },
        resultado: push ? "Empate" : won ? "Ganaste" : "Perdiste",
        pago: payout,
        user: await authService.getCurrentUser(userId),
    };
}

async function blackjack(userId, action, amount) {
    if (action === "start") {
        const wager = positiveInt(amount, "Apuesta");
        if (blackjackGames.has(userId)) throw httpError("Terminá tu mano actual antes de repartir otra.", 409);
        blackjackGames.set(userId, { starting: true });
        try {
            await transaction(async (connection) => {
                const user = await account(connection, userId, true);
                if (user.fichas_casino < wager) throw httpError("No tenés fichas suficientes.");
                await connection.execute("UPDATE usuarios SET fichas_casino = fichas_casino - ? WHERE id = ?", [wager, userId]);
                await recordTransaction(connection, userId, "CASINO", "FICHAS", -wager);
            });
        } catch (error) {
            blackjackGames.delete(userId);
            throw error;
        }
        const game = { wager, player: [drawCard(), drawCard()], dealer: [drawCard(), drawCard()], done: false };
        blackjackGames.set(userId, game);
        if (handValue(game.player) === 21 || handValue(game.dealer) === 21) return settleBlackjack(userId, game);
        return { game: { player: game.player, dealer: [game.dealer[0], { hidden: true }], playerTotal: handValue(game.player) } };
    }

    const game = blackjackGames.get(userId);
    if (!game || game.done || game.starting) throw httpError("No hay una mano de Blackjack activa.", 409);
    if (action === "hit") {
        game.player.push(drawCard());
        if (handValue(game.player) > 21) {
            game.done = true;
            blackjackGames.delete(userId);
            return {
                game: { player: game.player, dealer: game.dealer, playerTotal: handValue(game.player), dealerTotal: handValue(game.dealer) },
                resultado: "Perdiste",
                pago: 0,
                user: await authService.getCurrentUser(userId),
            };
        }
        return {
            game: { player: game.player, dealer: [game.dealer[0], { hidden: true }], playerTotal: handValue(game.player) },
            user: await authService.getCurrentUser(userId),
        };
    }
    if (action !== "stand") throw httpError("Acción de Blackjack inválida.");
    return settleBlackjack(userId, game);
}

module.exports = { blackjack, roulette };
