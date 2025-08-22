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
    }
});

module.exports = mongoose.model('user', userSchema);