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

async function roulette(userId, { amount, choice, betType }) {
    const wager = positiveInt(amount, "Apuesta");
    const resolvedBetType = betType || (["red", "black", "green"].includes(choice) ? "color" : "number");
    const numericChoice = typeof choice === "number" || (typeof choice === "string" && /^\d+$/.test(choice))
        ? Number(choice)
        : NaN;
    const validChoice = (resolvedBetType === "color" && ["red", "black", "green"].includes(choice))
        || (resolvedBetType === "number" && Number.isInteger(numericChoice) && numericChoice >= 0 && numericChoice <= 36)
        || (["dozen", "column"].includes(resolvedBetType) && ["first", "second", "third"].includes(choice))
        || (resolvedBetType === "outside" && ["low", "even", "odd", "high", "red", "black"].includes(choice));
    if (!validChoice) throw httpError("Elegí un color, una docena válida o un número del 0 al 36.");
    const number = Math.floor(Math.random() * 37);
    const redNumbers = new Set([1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36]);
    const color = number === 0 ? "green" : redNumbers.has(number) ? "red" : "black";
    const dozen = number === 0 ? null : Math.ceil(number / 12);
    const column = number === 0 ? null : ["third", "first", "second"][number % 3];
    const outsideBetWins = choice === "low"
        ? number >= 1 && number <= 18
        : choice === "high"
            ? number >= 19 && number <= 36
            : choice === "even"
                ? number > 0 && number % 2 === 0
                : choice === "odd"
                    ? number % 2 === 1
                    : choice === color;
    const win = resolvedBetType === "number"
        ? numericChoice === number
        : resolvedBetType === "color"
            ? choice === color
            : resolvedBetType === "dozen"
                ? choice === ["first", "second", "third"][dozen - 1]
                : resolvedBetType === "column"
                    ? choice === column
                    : outsideBetWins;
    const payout = !win
        ? 0
        : resolvedBetType === "number" || (resolvedBetType === "color" && choice === "green")
            ? wager * 36
            : ["dozen", "column"].includes(resolvedBetType)
                ? wager * 3
                : wager * 2;
    await transaction(async (connection) => {
        const user = await account(connection, userId, true);
        if (user.fichas_casino < wager) throw httpError("No tenés fichas suficientes.");
        await connection.execute(
            "UPDATE usuarios SET fichas_casino = fichas_casino - ? + ? WHERE id = ?",
            [wager, payout, userId],
        );
        await recordTransaction(connection, userId, "CASINO", "FICHAS", -wager + payout);
    });
    return { number, color, dozen, betType: resolvedBetType, win, apuesta: wager, pago: payout, user: await authService.getCurrentUser(userId) };
}

function drawCard() {
    const rank = Math.floor(Math.random() * 13) + 1;
    const suit = ["♠", "♥", "♦", "♣"][Math.floor(Math.random() * 4)];
    return {
        rank: Math.min(rank, 10),
        pairRank: rank > 10 ? "face" : rank,
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

function canSplitHand(hand) {
    return hand.cards.length === 2
        && !hand.done
        && !hand.splitAces
        && hand.cards[0].pairRank === hand.cards[1].pairRank;
}

function serializeBlackjack(game, revealDealer = false) {
    const activeHand = game.hands[game.activeHandIndex];
    return {
        player: activeHand?.cards || game.hands[0].cards,
        dealer: revealDealer ? game.dealer : [game.dealer[0], { hidden: true }],
        playerTotal: activeHand ? handValue(activeHand.cards) : 0,
        dealerTotal: revealDealer ? handValue(game.dealer) : undefined,
        hands: game.hands.map((hand) => ({
            id: hand.id,
            cards: hand.cards,
            total: handValue(hand.cards),
            wager: hand.wager,
            done: hand.done,
            doubled: hand.doubled,
            result: hand.result,
        })),
        activeHand: game.activeHandIndex,
        done: game.done,
        canHit: Boolean(activeHand && !activeHand.done && !game.done),
        canStand: Boolean(activeHand && !activeHand.done && !game.done),
        canDouble: Boolean(activeHand && activeHand.cards.length === 2 && !activeHand.done && !game.done),
        canSplit: Boolean(activeHand && canSplitHand(activeHand) && game.hands.length < 4 && !game.done),
    };
}

async function settleBlackjack(userId, game) {
    const canDealerDraw = game.hands.some((hand) => hand.cards.length && handValue(hand.cards) <= 21);
    if (canDealerDraw) {
        while (handValue(game.dealer) < 17) game.dealer.push(drawCard());
    }
    const dealerTotal = handValue(game.dealer);
    const dealerNatural = game.dealer.length === 2 && dealerTotal === 21;
    let payout = 0;
    for (const hand of game.hands) {
        const playerTotal = handValue(hand.cards);
        const playerNatural = !hand.fromSplit && hand.cards.length === 2 && playerTotal === 21;
        const won = playerTotal <= 21 && (
            (playerNatural && !dealerNatural)
            || (!dealerNatural && (dealerTotal > 21 || playerTotal > dealerTotal))
        );
        const push = playerTotal <= 21 && (
            (playerNatural && dealerNatural)
            || (!playerNatural && !dealerNatural && playerTotal === dealerTotal)
        );
        hand.result = push ? "Empate" : won ? "Ganaste" : "Perdiste";
        if (push) payout += hand.wager;
        else if (won) payout += playerNatural && !dealerNatural
            ? Math.floor(hand.wager * 2.5)
            : hand.wager * 2;
    }
    await transaction(async (connection) => {
        if (payout) {
            await connection.execute("UPDATE usuarios SET fichas_casino = fichas_casino + ? WHERE id = ?", [payout, userId]);
            await recordTransaction(connection, userId, "CASINO", "FICHAS", payout);
        }
    });
    game.done = true;
    blackjackGames.delete(userId);
    const wonHands = game.hands.filter((hand) => hand.result === "Ganaste").length;
    const pushHands = game.hands.filter((hand) => hand.result === "Empate").length;
    const resultado = wonHands === game.hands.length
        ? "Ganaste"
        : wonHands || pushHands
            ? pushHands === game.hands.length ? "Empate" : "Mano terminada"
            : "Perdiste";
    return {
        game: serializeBlackjack(game, true),
        resultado,
        pago: payout,
        user: await authService.getCurrentUser(userId),
    };
}

async function debitBlackjackWager(userId, wager) {
    await transaction(async (connection) => {
        const user = await account(connection, userId, true);
        if (user.fichas_casino < wager) throw httpError("No tenés fichas suficientes para esa acción.");
        await connection.execute("UPDATE usuarios SET fichas_casino = fichas_casino - ? WHERE id = ?", [wager, userId]);
        await recordTransaction(connection, userId, "CASINO", "FICHAS", -wager);
    });
}

async function advanceBlackjack(userId, game) {
    while (game.activeHandIndex < game.hands.length && game.hands[game.activeHandIndex].done) {
        game.activeHandIndex += 1;
    }
    if (game.activeHandIndex >= game.hands.length) return settleBlackjack(userId, game);
    return { game: serializeBlackjack(game), user: await authService.getCurrentUser(userId) };
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
        const game = {
            hands: [{ id: 1, cards: [drawCard(), drawCard()], wager, done: false, doubled: false, splitAces: false, fromSplit: false }],
            dealer: [drawCard(), drawCard()],
            activeHandIndex: 0,
            nextHandId: 2,
            done: false,
            actionPending: false,
        };
        blackjackGames.set(userId, game);
        if (handValue(game.hands[0].cards) === 21 || handValue(game.dealer) === 21) {
            game.hands[0].done = true;
            game.activeHandIndex = 1;
            return settleBlackjack(userId, game);
        }
        return { game: serializeBlackjack(game), user: await authService.getCurrentUser(userId) };
    }

    const game = blackjackGames.get(userId);
    if (!game || game.done || game.starting) throw httpError("No hay una mano de Blackjack activa.", 409);
    if (game.actionPending) throw httpError("Esperá a que termine tu acción actual.", 409);
    const hand = game.hands[game.activeHandIndex];
    if (!hand) throw httpError("No hay una mano activa para jugar.", 409);
    game.actionPending = true;
    try {
        if (action === "hit") {
            hand.cards.push(drawCard());
            if (handValue(hand.cards) >= 21) {
                hand.done = true;
                return await advanceBlackjack(userId, game);
            }
            return { game: serializeBlackjack(game), user: await authService.getCurrentUser(userId) };
        }
        if (action === "stand") {
            hand.done = true;
            return await advanceBlackjack(userId, game);
        }
        if (action === "double") {
            if (hand.cards.length !== 2 || hand.done) throw httpError("Solo podés doblar con las dos cartas iniciales.", 409);
            await debitBlackjackWager(userId, hand.wager);
            hand.wager *= 2;
            hand.doubled = true;
            hand.cards.push(drawCard());
            hand.done = true;
            return await advanceBlackjack(userId, game);
        }
        if (action === "split") {
            if (!canSplitHand(hand) || game.hands.length >= 4) {
                throw httpError("Solo podés dividir parejas iguales y jugar hasta cuatro manos.", 409);
            }
            await debitBlackjackWager(userId, hand.wager);
            const [firstCard, secondCard] = hand.cards;
            const splitAces = firstCard.pairRank === 1;
            const leftHand = {
                id: hand.id,
                cards: [firstCard, drawCard()],
                wager: hand.wager,
                done: splitAces,
                doubled: false,
                splitAces,
                fromSplit: true,
            };
            const rightHand = {
                id: game.nextHandId++,
                cards: [secondCard, drawCard()],
                wager: hand.wager,
                done: splitAces,
                doubled: false,
                splitAces,
                fromSplit: true,
            };
            if (!splitAces) {
                leftHand.done = handValue(leftHand.cards) >= 21;
                rightHand.done = handValue(rightHand.cards) >= 21;
            }
            game.hands.splice(game.activeHandIndex, 1, leftHand, rightHand);
            if (splitAces) return await advanceBlackjack(userId, game);
            return { game: serializeBlackjack(game), user: await authService.getCurrentUser(userId) };
        }
        throw httpError("Acción de Blackjack inválida.");
    } finally {
        game.actionPending = false;
    }
}

module.exports = { blackjack, roulette };
