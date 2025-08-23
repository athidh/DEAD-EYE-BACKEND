const Duel = require('./models/duel');
const User = require('./models/user');

let matchmakingQueue = [];
let activeGames = {};

function getRoundWinner(p1Move, p2Move) {
    if (p1Move === p2Move) return 'tie';
    if (
        (p1Move === 'Rock' && p2Move === 'Scissors') ||
        (p1Move === 'Scissors' && p2Move === 'Paper') ||
        (p1Move === 'Paper' && p2Move === 'Rock')
    ) {
        return 'player1';
    }
    return 'player2';
}

function initializeGameSocket(io) {
    io.on('connection', (socket) => {
        console.log(`✨ A user connected: ${socket.id}`);

        socket.on('find-match', async (userId) => {
            if (!userId) {
                console.log(`[Validation Error] Socket ${socket.id} tried to find a match without a userId.`);
                return;
            }
            console.log(`[Matchmaking] User ${userId} is looking for a match.`);

            if (matchmakingQueue.some(p => p.userId === userId) || Object.values(activeGames).some(g => g.player1.userId === userId || g.player2.userId === userId)) {
                console.log(`[Matchmaking] User ${userId} is already in queue or in a game.`);
                return;
            }
            matchmakingQueue.push({ userId, socketId: socket.id });

            if (matchmakingQueue.length >= 2) {
                const p1Info = matchmakingQueue.shift();
                const p2Info = matchmakingQueue.shift();

                try {
                    const player1 = await User.findById(p1Info.userId);
                    const player2 = await User.findById(p2Info.userId);
                    const newDuel = new Duel({ player1: player1.username, player2: player2.username, status: 'active' });
                    await newDuel.save();

                    const gameRoomId = newDuel._id.toString();
                    
                    activeGames[gameRoomId] = {
                        player1: { userId: p1Info.userId, username: player1.username, socketId: p1Info.socketId, move: null },
                        player2: { userId: p2Info.userId, username: player2.username, socketId: p2Info.socketId, move: null },
                        scores: { player1: 0, player2: 0 }
                    };

                    const player1Socket = io.sockets.sockets.get(p1Info.socketId);
                    const player2Socket = io.sockets.sockets.get(p2Info.socketId);
                    if(player1Socket) player1Socket.join(gameRoomId);
                    if(player2Socket) player2Socket.join(gameRoomId);
                    
                    io.to(gameRoomId).emit('match-found', {
                        roomId: gameRoomId,
                        players: {
                            player1: { username: player1.username, avatarUrl: player1.avatarUrl },
                            player2: { username: player2.username, avatarUrl: player2.avatarUrl }
                        }
                    });

                    console.log(`[Matchmaking] Match started: ${player1.username} vs ${player2.username} in room ${gameRoomId}`);
                } catch (error) {
                    console.error("[Matchmaking Error] Error starting match:", error);
                }
            }
        });

        socket.on('make-move', (data) => {
            const { roomId, userId, move } = data;
            const game = activeGames[roomId];
            if (!game) return;

            const isPlayer1 = game.player1.userId.toString() === userId;
            if (isPlayer1) game.player1.move = move;
            else game.player2.move = move;

            if (game.player1.move && game.player2.move) {
                const winner = getRoundWinner(game.player1.move, game.player2.move);
                if (winner === 'player1') game.scores.player1++;
                else if (winner === 'player2') game.scores.player2++;

                // --- THE FIX: Changed io.to(roomId).emit to io.emit ---
                // This broadcasts the result to EVERYONE, including spectators.
                io.emit('round-result', {
                    duelId: roomId, // Pass the duelId so the frontend knows which card to update
                    winner: winner,
                    moves: { player1: game.player1.move, player2: game.player2.move },
                    scores: game.scores
                });

                game.player1.move = null;
                game.player2.move = null;

                if (game.scores.player1 >= 3 || game.scores.player2 >= 3) {
                    const gameWinner = game.scores.player1 >= 3 ? game.player1.username : game.player2.username;
                    
                    // --- THE FIX: Changed io.to(roomId).emit to io.emit ---
                    // This broadcasts the final result to EVERYONE.
                    io.emit('game-over', {
                        duelId: roomId, // Pass the duelId
                        winner: gameWinner
                    });

                    Duel.findByIdAndUpdate(roomId, {
                        status: 'finished',
                        winner: gameWinner,
                        scores: game.scores
                    }).then(() => {
                        console.log(`[Game ${roomId}] Game finished. Winner: ${gameWinner}.`);
                        delete activeGames[roomId];
                    }).catch(err => console.error(err));
                }
            }
        });

        socket.on('disconnect', () => {
            console.log(`👋 User disconnected: ${socket.id}`);
            matchmakingQueue = matchmakingQueue.filter(p => p.socketId !== socket.id);

            let gameToEnd = null;
            let remainingPlayerSocketId = null;
            for (const roomId in activeGames) {
                const game = activeGames[roomId];
                if (game.player1.socketId === socket.id || game.player2.socketId === socket.id) {
                    gameToEnd = roomId;
                    remainingPlayerSocketId = game.player1.socketId === socket.id ? game.player2.socketId : game.player1.socketId;
                    break;
                }
            }

            if (gameToEnd && remainingPlayerSocketId) {
                console.log(`[Game ${gameToEnd}] A player disconnected. Notifying opponent.`);
                io.to(remainingPlayerSocketId).emit('opponent-disconnected');
                delete activeGames[gameToEnd];
            }
        });
    });
}

module.exports = initializeGameSocket;
