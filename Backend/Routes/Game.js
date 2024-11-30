const express = require('express');
const router = express.Router();
const {
  assignRoles,
  processVotes,
  mafiaSelectTarget,
  angelSave,
  detectiveInvestigate,
  finalizeRound,
  checkWinCondition,
} = require('../gameLogic');
const { users } = require('../data');

// Helper function to validate a user
function validateUser(userId) {
  const user = users[userId];
  if (!user) {
    return { error: 'Invalid user.' };
  }
  return { user };
}

// Start the game
router.post('/start', (req, res) => {
  assignRoles();
  res.json({ message: 'Game started, roles assigned!' });
});

// Voting endpoint
router.post('/vote', (req, res) => {
  const { userId, voteeId } = req.body;

  // Validate user
  const { error, user } = validateUser(userId);
  if (error || user.status !== 'alive') {
    return res.status(400).json({ error: 'Invalid or dead user cannot vote.' });
  }

  // Validate votee
  const { error: voteeError } = validateUser(voteeId);
  if (voteeError || users[voteeId].status !== 'alive') {
    return res.status(400).json({ error: 'Invalid or dead votee.' });
  }

  // Register vote
  user.voted = true;
  users[voteeId].votes = (users[voteeId].votes || 0) + 1;

  // Check if all alive players have voted
  const allVotesSubmitted = Object.values(users)
    .filter((u) => u.status === 'alive')
    .every((u) => u.voted);

  if (allVotesSubmitted) {
    console.log("All alive players have voted. Processing votes...");
    const result = processVotes();
    const roundResult = finalizeRound(); // Process Mafia's kill and Angel's save actions

    if (roundResult !== 'in-progress') {
      return res.json({ message: `Game ended: ${roundResult}`, status: 'ended' });
    }

    return res.json({ message: 'Votes processed. Proceeding to the next round.', status: 'in-progress' });
  }

  res.json({ message: 'Vote registered. Waiting for other players to vote.' });
});

// Mafia's kill action
router.post('/action/kill', (req, res) => {
  const { userId, targetId } = req.body;

  // Validate Mafia user
  const { error, user } = validateUser(userId);
  if (error || user.role !== 'Mafia') {
    return res.status(400).json({ error: 'Only the Mafia can perform this action.' });
  }

  // Validate target
  const { error: targetError } = validateUser(targetId);
  if (targetError || users[targetId].status !== 'alive') {
    return res.status(400).json({ error: 'Invalid target for Mafia kill.' });
  }

  user.voted = true; // Mafia has completed their vote
  mafiaSelectTarget(targetId);
  res.json({ message: 'Mafia has selected a target.' });
});

// Angel's save action
router.post('/action/save', (req, res) => {
  const { userId, targetId } = req.body;

  // Validate Angel user
  const { error, user } = validateUser(userId);
  if (error || user.role !== 'angel') {
    return res.status(400).json({ error: 'Only the Angel can perform this action.' });
  }

  // Validate target
  const { error: targetError } = validateUser(targetId);
  if (targetError || users[targetId].status !== 'alive') {
    return res.status(400).json({ error: 'Invalid target for Angel save.' });
  }

  user.voted = true; // Angel has completed their vote
  angelSave(targetId);
  res.json({ message: 'Angel has saved a player.' });
});

// Detective's investigate action
router.post('/action/investigate', (req, res) => {
  const { userId, targetId } = req.body;

  // Validate Detective user
  const { error, user } = validateUser(userId);
  if (error || user.role !== 'detective') {
    return res.status(400).json({ error: 'Only the Detective can perform this action.' });
  }

  // Validate target
  const { error: targetError, user: target } = validateUser(targetId);
  if (targetError || target.status !== 'alive') {
    return res.status(400).json({ error: 'Invalid target for investigation.' });
  }

  // Return the role of the investigated player
  user.voted = true;
  res.json({ message: `The role of the target is ${users[targetId].role}.` });
  detectiveInvestigate(targetID)
});

// Fetch all players
router.get('/players', (req, res) => {
  const playerData = Object.values(users).map((player) => ({
    userId: player.userId,
    name: player.name,
    role: player.role,
    status: player.status,
  }));
  res.json({ players: playerData });
});

// Check game status
router.get('/status', (req, res) => {
  const result = checkWinCondition();
  if (result === 'players_win') {
    return res.json({ status: 'ended', result: 'Players win!' });
  } else if (result === 'mafia_win') {
    return res.json({ status: 'ended', result: 'Mafia wins!' });
  }
  return res.json({ status: 'in-progress' });
});

module.exports = router;
