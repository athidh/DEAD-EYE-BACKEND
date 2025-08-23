const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middlewares/authMiddleware');

router.post('/register', authController.register);
router.post('/login', authController.login);

// --- NEW: Route to get user profile data ---
router.get('/profile', authMiddleware, authController.getProfile);

module.exports = router;