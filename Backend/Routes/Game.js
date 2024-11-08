// Game.js
const express = require('express');
const router = express.Router();
const { users } = require('../data.js');
const { processVotes, checkWinCondition } = require('../gameLogic');

// Cast Vote
router.post('/vote', (req, res) => {
  const { userId, voteeId } = req.body;

  if (!users[userId] || !users[voteeId]) {
    return res.status(400).json({ error: 'Invalid user(s)' });
  }

  if (users[voteeId].status !== 'alive') {
    return res.status(400).json({ error: 'Cannot vote for a dead player' });
  }

  if (users[userId].voted) {
    return res.status(400).json({ error: 'You have already voted' });
  }

  users[userId].voted = true;
  users[voteeId].votes = (users[voteeId].votes || 0) + 1;

  // Check if all alive players have voted
  const alivePlayers = Object.values(users).filter(u => u.status === 'alive');
  if (alivePlayers.every(u => u.voted)) {
    processVotes();
  }

  return res.json({ message: 'Vote cast successfully' });
});

// God Kill Action
router.post('/action/kill', (req, res) => {
  const { userId, targetId } = req.body;

  if (!users[userId] || !users[targetId]) {
    return res.status(400).json({ error: 'Invalid user(s)' });
  }
  if (users[userId].role !== 'god') {
    return res.status(403).json({ error: 'Only god can perform this action' });
  }

  users[targetId].status = 'dead';
  checkWinCondition();
  return res.json({ message: 'Player eliminated' });
});

// Angel Revive Action
router.post('/action/revive', (req, res) => {
    const { userId, targetId } = req.body;
  
    if (!users[userId] || !users[targetId]) {
      return res.status(400).json({ error: 'Invalid user(s)' });
    }
  
    if (users[userId].role !== 'angel') {
      return res.status(403).json({ error: 'Only angel can perform this action' });
    }
  
    if (users[targetId].status === 'alive') {
      return res.status(400).json({ error: 'Player is already alive' });
    }
  
    
  
    users[targetId].status = 'alive';
    //users[targetId].revived = true; // Mark as revived to prevent further revives
    return res.json({ message: 'Player revived' });
  });


// Fetch All Players
router.get('/players', (req, res) => {
  const players = Object.values(users).map(user => ({
    userId: user.userId,
    name: user.name,
    status: user.status,
    role: user.role,
  }));
  return res.json({ players });
});

module.exports = router;
