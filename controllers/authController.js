// const bcrypt = require('bcrypt'); // bcrypt is no longer needed
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const path = require('path');
const fs = require('fs');

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
        res.json({
            username: user.username,
            balance: user.balance,
            avatarFileName: user.avatarFileName,
        });
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ message: 'Server error.' });
    }
};

// --- Set Avatar Logic ---
exports.setAvatar = async (req, res) => {
    try {
        const { avatarFileName } = req.body;
        const userId = req.user.id; 
        const avatarPath = path.join(AVATARS_DIR, avatarFileName);
        if (!fs.existsSync(avatarPath)) {
            return res.status(400).json({ message: 'Invalid avatar selected.' });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        
        user.avatarFileName = avatarFileName;
        await user.save();

        res.status(200).json({ 
            message: 'Avatar updated successfully!', 
            avatarFileName: user.avatarFileName 
        });

    } catch (error) {
        console.error('Set avatar error:', error);
        res.status(500).json({ message: 'Server error setting avatar.' });
    }
};