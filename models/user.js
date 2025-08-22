const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    password: {
        type: String,
        required: true
    },
    balance: {
        type: Number,
        default: 1000
    },
    avatarUrl: {
        type: String,
        default: 'https://placehold.co/150x150/A0522D/FFF8E7?text=Outlaw'
    }
});

module.exports = mongoose.model('user', userSchema);