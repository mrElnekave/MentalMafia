// UserRoutes.js
const express = require('express');
const router = express.Router();
const { users, generateId } = require('../data.js');
const { assignRoles } = require('../gameLogic');

// User Login
router.post('/login', (req, res) => {
  const { name } = req.body;
  if (!name) {
    return res.status(400).json({ error: 'Name is required' });
  }

  const userId = generateId();
  users[userId] = { userId, name, status: 'alive', isLoggedIn: true };

  return res.json({ userId });
});

// Join the game
router.post('/game/join', (req, res) => {
    const { userId } = req.body;

  if (!users[userId] || !users[userId].isLoggedIn) {
    return res.status(400).json({ error: 'Invalid or inactive user' });
  }

  // Assign roles if we have exactly 5 players and roles are not assigned yet
  if (Object.keys(users).length === 5 && !Object.values(users).some(u => u.role)) {
    console.log('Assigning roles...');
    assignRoles();
  }

  // Confirm roles are assigned and log the response
  const userRole = users[userId].role;
  const status = userRole ? 'in-progress' : 'waiting';
  console.log(`Player ${userId} joining with role: ${userRole || 'waiting'}`);

  res.json({
    role: userRole || 'waiting',
    status,
  });
});

module.exports = router;
