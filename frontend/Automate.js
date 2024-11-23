const axios = require('axios');
const BASE_URL = 'http://localhost:3001/api';

async function simulatePlayers() {
  const players = [];

  console.log('Logging in players...');
  for (let i = 0; i < 5; i++) {
    try {
      const response = await axios.post(`${BASE_URL}/user/login`, { name: `Player${i + 1}` });
      players.push({ userId: response.data.userId, name: `Player${i + 1}`, status: 'alive' });
      console.log(`Player${i + 1} logged in with userId: ${response.data.userId}`);
    } catch (error) {
      console.error(`Error logging in Player${i + 1}:`, error.message);
    }
  }

  console.log('\nPlayers joining the game...');
  for (const player of players) {
    try {
      const response = await axios.post(`${BASE_URL}/user/game/join`, { userId: player.userId });
      player.role = response.data.role;
      console.log(`${player.name} joined with role: ${player.role}`);
    } catch (error) {
      console.error(`Error joining game for ${player.name}:`, error.message);
    }
  }

  let round = 1;
  let gameOver = false;

  while (!gameOver) {
    console.log(`\n--- Round ${round} ---`);

    const mafia = players.find(p => p.role === 'god' && p.status === 'alive');
    if (mafia) {
      const target = players.find(p => p.status === 'alive' && p.role !== 'god');
      if (target) {
        try {
          await axios.post(`${BASE_URL}/game/action/kill`, { userId: mafia.userId, targetId: target.userId });
          console.log(`Mafia (${mafia.name}) selected ${target.name} as a target.`);
        } catch (error) {
          console.error('Mafia action error:', error.message);
        }
      }
    }

    const angel = players.find(p => p.role === 'angel' && p.status === 'alive');
    if (angel) {
      const deadPlayer = players.find(p => p.status === 'dead');
      if (deadPlayer) {
        try {
          await axios.post(`${BASE_URL}/game/action/revive`, { userId: angel.userId, targetId: deadPlayer.userId });
          deadPlayer.status = 'alive';
          console.log(`Angel (${angel.name}) revived ${deadPlayer.name}`);
        } catch (error) {
          console.error('Angel action error:', error.message);
        }
      }
    }

    console.log('\nPlayers are voting...');
    for (const player of players.filter(p => p.status === 'alive')) {
      let voteTarget;
      
      // Set a 50% chance to vote for the Mafia, if the Mafia is alive
      if (mafia && Math.random() < 0.1) {
        voteTarget = mafia;
      } else {
        // Choose a random alive player who isn't the voter
        const aliveTargets = players.filter(p => p.status === 'alive' && p.userId !== player.userId);
        voteTarget = aliveTargets[Math.floor(Math.random() * aliveTargets.length)];
      }

      if (voteTarget) {
        try {
          await axios.post(`${BASE_URL}/game/vote`, { userId: player.userId, voteeId: voteTarget.userId });
          console.log(`${player.name} voted to eliminate ${voteTarget.name}`);
        } catch (error) {
          console.error(`Vote error by ${player.name}:`, error.message);
        }
      }
    }

    // Check the game status after each round
    try {
      const gameStatusResponse = await axios.get(`${BASE_URL}/game/status`);
      const gameStatus = gameStatusResponse.data.status;
      console.log(`Game status after Round ${round}: ${gameStatus}`);
      
      if (gameStatus === 'ended') {
        console.log(`\n--- Game over: ${gameStatusResponse.data.result} ---`);
        gameOver = true;
        break;
      }
    } catch (error) {
      console.error('Error checking game status:', error.message);
    }

    // Reset voting and increment the round counter
    players.forEach(p => (p.voted = false));
    round++;

    // Add a delay to simulate rounds more clearly
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log('\nSimulation complete!');
}

simulatePlayers().catch(console.error);
