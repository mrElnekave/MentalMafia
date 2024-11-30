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
let rolesAssigned = false; // A flag to check if roles have been assigned

// Join Game Route (Simplified Example)
router.post('/game/join', (req, res) => {
    const { userId } = req.body;
  
    if (!userId || !users[userId]) {
      return res.status(400).json({ error: 'Invalid or missing userId' });
    }
  
    // Role assignment logic (run only once)
    if (!users[userId].role) {
      // Ensure roles are assigned only once per session
      const roles = ['Mafia', 'angel', 'detective', 'player', 'player'];
      roles.sort(() => Math.random() - 0.5); // Shuffle roles randomly
  
      Object.values(users).forEach((user, index) => {
        user.role = roles[index] || 'player';
      });
    }
  
    const userRole = users[userId].role;
    return res.json({ sessionId: '1', role: userRole, status: 'in-progress' });
  });
  

module.exports = router;
