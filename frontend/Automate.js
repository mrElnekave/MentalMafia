const axios = require('axios');
const BASE_URL = 'http://localhost:3001/api';

async function simulatePlayers() {
  const players = [];

  // Step 1: Log in fake players
  console.log('Logging in players...');
  for (let i = 0; i < 5; i++) {
    const response = await axios.post(`${BASE_URL}/user/login`, { name: `Player${i + 1}` });
    const userId = response.data.userId;
    players.push({ userId, name: `Player${i + 1}`, status: 'alive' });
    console.log(`Player${i + 1} logged in with userId: ${userId}`);
  }

  // Step 2: Have each player join the game and wait for role assignment
  console.log('\nPlayers joining the game...');
  for (const player of players) {
    const response = await axios.post(`${BASE_URL}/user/game/join`, { userId: player.userId });
    player.role = response.data.role;
    player.status = response.data.status;
    console.log(`Player ${player.name} joined game with role: ${player.role}`);
  }

  // Identify roles
  const mafia = players.find(p => p.role === 'god');
  const angel = players.find(p => p.role === 'angel');
  let round = 1;

  // Step 3: Loop until Mafia is eliminated
  while (true) {
    console.log(`\n--- Round ${round} ---`);

    // Wait before the round starts
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Mafia kills a player
    const alivePlayers = players.filter(p => p.status === 'alive' && p.role !== 'god');
    if (mafia && alivePlayers.length > 0) {
      const target = alivePlayers[Math.floor(Math.random() * alivePlayers.length)];
      const response = await axios.post(`${BASE_URL}/game/action/kill`, { userId: mafia.userId, targetId: target.userId });
      target.status = 'dead';
      console.log(`Mafia (${mafia.name}) killed ${target.name}: ${response.data.message}`);
    }

    // Angel revives any dead player
    const deadPlayers = players.filter(p => p.status === 'dead');
    if (angel && deadPlayers.length > 0) {
      const reviveTarget = deadPlayers[Math.floor(Math.random() * deadPlayers.length)];
      const response = await axios.post(`${BASE_URL}/game/action/revive`, { userId: angel.userId, targetId: reviveTarget.userId });
      reviveTarget.status = 'alive';
      console.log(`Angel (${angel.name}) revived ${reviveTarget.name}: ${response.data.message}`);
    }

    // Players (including the Angel) vote to eliminate the suspected Mafia
    console.log('\nPlayers are voting...');
    const votingPlayers = players.filter(p => p.status === 'alive' && p.role !== 'god'); // Includes Angel and normal players

    for (const player of votingPlayers) {
      let randomTarget;

      // 20% chance to vote for the Mafia, 80% chance to vote for a random player
      if (Math.random() < 0.2 && mafia && mafia.status === 'alive') {
        randomTarget = mafia; // Vote for the Mafia
      } else {
        // Vote for a random alive player (excluding self and Mafia if not chosen)
        const possibleTargets = players.filter(target => target.status === 'alive' && target.userId !== player.userId);
        randomTarget = possibleTargets[Math.floor(Math.random() * possibleTargets.length)];
      }

      try {
        const response = await axios.post(`${BASE_URL}/game/vote`, { userId: player.userId, voteeId: randomTarget.userId });
        console.log(`${player.name} voted to eliminate ${randomTarget.name}: ${response.data.message}`);
      } catch (error) {
        console.error(`${player.name} could not vote due to error: ${error.response?.data?.error || error.message}`);
      }
    }

    // Check if Mafia is still alive
    const isMafiaAlive = players.some(p => p.role === 'god' && p.status === 'alive');
    if (!isMafiaAlive) {
      console.log('\n--- Mafia has been eliminated! Players win! ---');
      break;
    } else {
      console.log('\nMafia is still alive. Moving to the next round...');
      round++;
    }

    // Wait a bit before starting the next round
    await new Promise(resolve => setTimeout(resolve, 3000));
  }

  console.log('\nSimulation complete!');
}

simulatePlayers().catch(console.error);
