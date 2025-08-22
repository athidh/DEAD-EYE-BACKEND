const mongoose = require('mongoose');

const duelSchema = new mongoose.Schema({
    player1: {
        type: String,
        required: true
    },
    player2: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'active', 'finished'],
        default: 'pending'
    },
    scores: {
        player1: {
            type: Number,
            default: 0
        },
        player2: {
            type: Number,
            default: 0
        }
    },
    wagers: [{
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        amount: {
            type: Number,
            required: true
        },
        betOnPlayer: {
            type: String, // 'player1' or 'player2'
            enum: ['player1', 'player2'],
            required: true
        },
        timestamp: {
            type: Date,
            default: Date.now
        }
    }],
    winner: {
        type: String, 
        default: null
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('duel', duelSchema);