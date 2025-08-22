require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const cors = require('cors');
const app = express();

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.error('❌ Error: MONGODB_URI is not defined in the .env file. Please create a .env file in the root directory and add MONGODB_URI=YOUR_ATLAS_URI');
    process.exit(1);
}

mongoose.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log('✅ MongoDB Atlas connected successfully.'))
.catch(err => console.error('🔴 MongoDB Atlas connection error:', err));

// --- Middleware ---
app.use(cors());
app.use(express.json());

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// NEW: Serve static files from the 'avatars' folder in the root directory
// This makes files like 'avatar1.jpg' accessible via '/avatars/avatar1.jpg'
app.use('/avatars', express.static(path.join(__dirname, 'avatars'))); 

const authRoutes = require('./routes/auth');
const duelRoutes = require('./routes/duel');

app.use('/auth', authRoutes);
app.use('/duel', duelRoutes);

module.exports = app;