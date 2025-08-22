// models/user.js

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
    // Changed the field name to reflect that it's a file name
    avatarFileName: {
        type: String,
        // Set a default filename. This assumes 'outlaw.jpg' exists in your avatars folder.
        default: 'outlaw.jpg'
    }
});

module.exports = mongoose.model('User', userSchema);