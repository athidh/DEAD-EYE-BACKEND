const Duel = require('../models/duel');
const User = require('../models/user');

const getIo = (req) => {
    return req.app.get('socketio');
};

// Logic to start a new duel 
exports.startDuel = async (req, res) => {
    try {
        const { player1, player2 } = req.body;
        const io = getIo(req);
        const newDuel = new Duel({ player1, player2 });
        await newDuel.save();

        io.emit('new-duel', {
            duelId: newDuel._id,
            player1: newDuel.player1,
            player2: newDuel.player2,
            scores: newDuel.scores,
            status: newDuel.status
        });

        res.status(201).json({ message: 'Duel started successfully!', duel: newDuel });
    } catch (error) {
        console.error('Start duel error:', error);
        res.status(500).json({ message: 'Server error starting duel.' });
    }
};

// Logic for a user to place a wager 
exports.placeWager = async (req, res) => {
    try {
        const { duelId, amount, betOnPlayer } = req.body;
        const userId = req.user.id; 
        const io = getIo(req);

        const duel = await Duel.findById(duelId);
        const user = await User.findById(userId);

        if (!duel || !user) {
            return res.status(404).json({ message: 'Duel or user not found.' });
        }
        if (duel.status !== 'pending') {
            return res.status(400).json({ message: 'Wagers are closed for this duel.' });
        }
        if (user.balance < amount) {
            return res.status(400).json({ message: 'Insufficient balance.' });
        }
        user.balance -= amount;
        duel.wagers.push({ userId, amount, betOnPlayer });

        await user.save();
        await duel.save();

        io.emit('new-wager', {
            user: user.username,
            amount,
            betOnPlayer
        });

        res.status(200).json({ message: 'Wager placed successfully!', newBalance: user.balance });
    } catch (error) {
        console.error('Place wager error:', error);
        res.status(500).json({ message: 'Server error placing wager.' });
    }
};

// --- Logic to end a round and determine the winner ---
exports.endRound = async (req, res) => {
    try {
        const { duelId, winner } = req.body; // winner could be 'player1' or 'player2'
        const io = getIo(req);
        const duel = await Duel.findById(duelId);
        if (!duel) {
            return res.status(404).json({ message: 'Duel not found.' });
        }

        if (winner === 'player1') {
            duel.scores.player1 += 1;
        } else if (winner === 'player2') {
            duel.scores.player2 += 1;
        }
        duel.status = 'finished'; 
        duel.winner = winner;
        await duel.save();

        const winnings = {};
        for (const wager of duel.wagers) {
            const user = await User.findById(wager.userId);
            if (!user) continue;

            if (wager.betOnPlayer === winner) {
                const payout = wager.amount * 2; 
                user.balance += payout;
                winnings[user.username] = payout;
            } else {
                winnings[user.username] = 0; 
            }
            await user.save();
        }
        
        io.emit('round-ended', {
            duelId,
            winner,
            scores: duel.scores,
            winnings
        });

        res.status(200).json({ message: 'Round ended successfully!', scores: duel.scores, winner });
    } catch (error) {
        console.error('End round error:', error);
        res.status(500).json({ message: 'Server error ending round.' });
    }
};

// --- UPDATED: Logic to get ALL current duels ---
exports.getCurrentDuel = async (req, res) => {
    try {
        // Use .find() to get all duels that are not 'finished'
        const currentDuels = await Duel.find({
            status: { $ne: 'finished' }
        }).sort({ createdAt: -1 });

        // If no duels are found, it's not an error; just return an empty array.
        if (!currentDuels) {
            return res.status(200).json([]);
        }

        res.status(200).json(currentDuels);

    } catch (error) {
        console.error('Get current duels error:', error);
        res.status(500).json({ message: 'Server error.' });
    }
};

exports.handleGameResult = async (req, res) => {
    try {
        const { winner, scores, duelId } = req.body;
        const io = req.app.get('socketio');

        // Find the duel and update scores
        const duel = await Duel.findById(duelId);
        if (!duel) {
            return res.status(404).json({ message: 'Duel not found.' });
        }

        duel.scores.player1 = scores.player1;
        duel.scores.player2 = scores.player2;

        // Optional: Check for game end and trigger payouts
        if (duel.scores.player1 >= 3 || duel.scores.player2 >= 3) {
            duel.status = 'finished';
            duel.winner = winner;
            // Add your wager payout logic here
        }

        await duel.save();

        // Broadcast the real-time update to all dashboards
        io.emit('score-update', {
            duelId: duel._id,
            scores: duel.scores,
            winner: duel.winner,
            status: duel.status
        });

        res.status(200).json({ message: 'Game state updated successfully.' });

    } catch (error)
        {
        console.error('Game result handling error:', error);
        res.status(500).json({ message: 'Server error.' });
    }
};