const jwt = require('jsonwebtoken');
const User = require('../models/user');

// --- Register Logic ---
exports.register = async (req, res) => {
    try {
        const { username, password, avatarUrl } = req.body;
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ message: 'Username already taken.' });
        }
        const newUser = new User({
            username,
            password: password, // Storing password directly
            avatarUrl: avatarUrl,
        });
        await newUser.save();
        res.status(201).json({ message: 'User registered successfully!' });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: 'Server error during registration.' });
    }
};

// --- Login Logic ---
exports.login = async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ username });
        if (!user || user.password !== password) {
            return res.status(400).json({ message: 'Invalid credentials.' });
        }
        const payload = { user: { id: user.id } };
        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.status(200).json({ message: 'Login successful.', token });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error during login.' });
    }
};

// --- UPDATED: Get User Profile ---
// This function now correctly includes the user's ID in the response.
exports.getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }
        // THE FIX: The 'id' field is now included.
        res.json({
            id: user._id, // <-- THIS IS THE CRITICAL FIX
            username: user.username,
            balance: user.balance,
            avatarUrl: user.avatarUrl,
        });
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ message: 'Server error.' });
    }
};

// --- Get Public User Data by Username ---
// This is needed for the spectate page to fetch avatars.
exports.getUserByUsername = async (req, res) => {
    try {
        const user = await User.findOne({ username: req.params.username }).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }
        res.json(user);
    } catch (error) {
        console.error('Get user by username error:', error);
        res.status(500).json({ message: 'Server error.' });
    }
};
