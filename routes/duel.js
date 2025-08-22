const express = require('express');
const router = express.Router();
const duelController = require('../controllers/duelController');
const authMiddleware = require('../middlewares/authMiddleware');

//  get the current duel state
router.get('/current', duelController.getCurrentDuel);

// Route to place a wager on a duel
router.post('/wager', authMiddleware,duelController.placeWager);

// Route to start a new duel
router.post('/start', duelController.startDuel);

// Route to record the outcome of a round
router.post('/end-round', duelController.endRound);

module.exports = router;