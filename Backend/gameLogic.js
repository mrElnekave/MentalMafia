// gameLogic.js
const { users } = require('./data');

// Assign roles to 5 players in a single game
function assignRoles() {
    const playerIds = Object.keys(users);
    if (playerIds.length < 5) return; // Ensure there are 5 players
  
    console.log('Shuffling players and assigning roles...');
    const shuffledPlayerIds = playerIds.sort(() => 0.5 - Math.random());
  
    // Assign roles
    users[shuffledPlayerIds[0]].role = 'god';
    console.log(`Assigned god role to ${shuffledPlayerIds[0]}`);
  
    users[shuffledPlayerIds[1]].role = 'angel';
    console.log(`Assigned angel role to ${shuffledPlayerIds[1]}`);
  
    for (let i = 2; i < shuffledPlayerIds.length; i++) {
      users[shuffledPlayerIds[i]].role = 'player';
      console.log(`Assigned player role to ${shuffledPlayerIds[i]}`);
    }
  
    console.log('Roles assigned:', playerIds.map(id => ({ id, role: users[id].role })));
  }
  
// Process votes and determine the result
function processVotes() {
    const voteCounts = {};
    Object.values(users).forEach(user => {
      if (user.votes) {
        voteCounts[user.userId] = (voteCounts[user.userId] || 0) + user.votes;
        delete user.votes; // Reset vote count for the next round
      }
      user.voted = false; // Reset voting status for the next round
    });
  
    // Determine the player with the most votes
    const [eliminatedUserId] = Object.entries(voteCounts).reduce(
      (acc, [userId, count]) => (count > acc[1] ? [userId, count] : acc),
      [null, 0]
    );
  
    if (eliminatedUserId) {
      users[eliminatedUserId].status = 'dead';
      console.log(`Player ${eliminatedUserId} has been eliminated`);
      checkWinCondition();
    }
  }

// Check if there's a win condition
function checkWinCondition() {
    const alivePlayers = Object.values(users).filter(user => user.status === 'alive');
    const mafiaAlive = alivePlayers.some(user => user.role === 'god');
    const playersAlive = alivePlayers.some(user => user.role === 'player');
  
    if (!mafiaAlive) {
      console.log('Players win!');
      process.exit(); // Ends the game simulation
    } else if (!playersAlive) {
      console.log('Mafia wins!');
      process.exit(); // Ends the game simulation
    }
  }

module.exports = {
  assignRoles,
  processVotes,
  checkWinCondition,
};
