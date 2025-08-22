const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/user');

//register logic here
exports.register = async (req, res) => {
 try {
 const { username, password } = req.body;
 const existingUser = await User.findOne({ username });
 if (existingUser) { return res.status(400).json({ message: 'Username already taken.' });
}
 const salt = await bcrypt.genSalt(10);
 const hashedPassword = await bcrypt.hash(password, salt);
const newUser = new User({
 username,
 password: hashedPassword,
 });
 await newUser.save();
res.status(201).json({ message: 'User registered successfully!' });
 } catch (error) {
 console.error('Registration error:', error);
res.status(500).json({ message: 'Server error during registration.' }); }
};

//login logic hereee
exports.login = async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials.' });
        }
        const isMatch = await bcrypt.compare(password, user.password);
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

// --- NEW: Get User Profile ---
exports.getProfile = async (req, res) => {
 try {
 const user = await User.findById(req.user.id).select('-password');
if (!user) {
 return res.status(404).json({ message: 'User not found.' });
 }
res.json({
 username: user.username,
 balance: user.balance,
 avatarUrl: user.avatarUrl,
 });
 } catch (error) {
 console.error('Get profile error:', error);
 res.status(500).json({ message: 'Server error.' }); }
};