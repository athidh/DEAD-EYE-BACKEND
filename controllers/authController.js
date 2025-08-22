// const bcrypt = require('bcrypt'); // bcrypt is no longer needed
const jwt = require('jsonwebtoken');
const User = require('../models/user');

// --- UPDATED Register Logic ---
exports.register = async (req, res) => {
    try {
        // Now accepts avatarUrl from the request body
        const { username, password, avatarUrl } = req.body;

        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ message: 'Username already taken.' });
        }

        // Hashing logic has been removed
        const newUser = new User({
            username,
            password: password, // Stores the password directly
            avatarUrl: avatarUrl, // Saves the avatar URL from the form
        });

        await newUser.save();
        res.status(201).json({ message: 'User registered successfully!' });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: 'Server error during registration.' });
    }
};

// --- UPDATED Login Logic ---
exports.login = async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials.' });
        }

        // Compares the plain text password directly
        const isMatch = (password === user.password);

        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials.' });
        }

        const payload = {
            user: {
                id: user.id,
            },
        };

        const token = jwt.sign(payload, process.env.JWT_SECRET, {
            expiresIn: '1h',
        });

        res.status(200).json({ message: 'Login successful.', token });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error during login.' });
    }
};

// --- Get User Profile (No changes needed here) ---
exports.getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }
        res.json(user);
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ message: 'Server error.' });
    }
};