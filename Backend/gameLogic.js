const { users } = require('./data');

let gameState = {
  stage: 'mafia', // Initial stage: mafia, angel, detective, voting
  targetedPlayer: null,
  savedPlayer: null,
  investigatedPlayer: null,
};

function getGameStage() {
  return gameState.stage;
}

function nextStage() {
  if (gameState.stage === 'mafia') {
    gameState.stage = 'angel';
  } else if (gameState.stage === 'angel') {
    gameState.stage = 'detective';
  } else if (gameState.stage === 'detective') {
    gameState.stage = 'voting';
  } else if (gameState.stage === 'voting') {
    gameState.stage = 'mafia'; // Reset to Mafia stage for the next round
  }
}

function assignRoles() {
  const playerIds = Object.keys(users);
  playerIds.sort(() => Math.random() - 0.5); // Shuffle player IDs randomly

  users[playerIds[0]].role = 'Mafia'; // Assign the first player as Mafia
  users[playerIds[1]].role = 'angel'; // Assign the second player as Angel
  users[playerIds[2]].role = 'detective'; // Assign the third player as Detective
  for (let i = 3; i < playerIds.length; i++) {
    users[playerIds[i]].role = 'player'; // Assign the rest as regular players
  }
  console.log("Roles assigned:", users);
}

function processVotes() {
  if (gameState.stage !== 'voting') {
    console.log("It's not the Voting stage.");
    return;
  }
  nextStage();
  const voteCounts = {};
  Object.values(users).forEach((user) => {
    if (user.votes) {
      voteCounts[user.userId] = user.votes;
    }
    // Reset voting flags
    user.voted = false;
    user.votes = 0;
  });

  const maxVotes = Math.max(...Object.values(voteCounts));
  if (Object.keys(voteCounts).length === 0 || maxVotes === 0) {
    console.log("No votes were cast this round. Advancing to the next round.");
    return 'next_round';
  }

  const tiedPlayers = Object.keys(voteCounts).filter((id) => voteCounts[id] === maxVotes);
  if (tiedPlayers.length > 1) {
    console.log("There's a tie in votes. No one is eliminated.");
    return 'next_round';
  }

  const votedOutId = tiedPlayers[0];
  users[votedOutId].status = 'dead';
  console.log(`${users[votedOutId].name} was voted out.`);
  return 'next_round';
}

function mafiaSelectTarget(targetId) {
  if (gameState.stage !== 'mafia') {
    console.log("It's not the Mafia's turn.");
    return;
  }
  nextStage()
  const target = users[targetId];
  if (target && target.status === 'alive') {
    target.targetedByMafia = true;
    console.log(`Mafia selected ${target.name} as their target.`);
  } else {
    console.log("Invalid Mafia target. Action ignored.");
  }
}

function angelSave(targetId) {
  if (gameState.stage !== 'angel') {
    console.log("It's not the Angel's turn.");
    return;
  }
  nextStage();
  const target = users[targetId];
  if (target && target.status === 'alive') {
    target.savedByAngel = true;
    console.log(`Angel chose to save ${target.name}.`);
  } else {
    console.log("Invalid Angel save target. Action ignored.");
  }
}

function detectiveInvestigate(targetId) {
  if (gameState.stage !== 'detective') {
    console.log("It's not the Detective's turn.");
    return;
  }
  nextStage();
  const target = users[targetId];

  if (!target || target.status !== 'alive') {
    console.log("Invalid target: User does not exist or is not alive.");
    return;
  }

  console.log(`Detective investigated ${target.name}. Their role is ${target.role}.`);
  return target.role;
}

function finalizeRound() {
  Object.values(users).forEach((user) => {
    if (user.targetedByMafia) {
      if (user.savedByAngel) {
        console.log(`Angel saved ${user.name} from Mafia's kill.`);
      } else {
        user.status = 'dead';
        console.log(`Mafia killed ${user.name}.`);
      }
      // Reset round-specific flags
      user.targetedByMafia = false;
      user.savedByAngel = false;
    }
  });

  // Reset game state for the next round
  gameState.targetedPlayer = null;
  gameState.savedPlayer = null;
  gameState.investigatedPlayer = null;

  return checkWinCondition();
}

function checkWinCondition() {
  const alivePlayers = Object.values(users).filter((u) => u.status === 'alive');
  const mafiaAlive = alivePlayers.some((u) => u.role === 'Mafia');
  const nonMafiaAlive = alivePlayers.some((u) => u.role !== 'Mafia');

  if (!mafiaAlive) {
    console.log("Players win! The Mafia has been eliminated.");
    return 'players_win';
  }
  if (mafiaAlive && !nonMafiaAlive) {
    console.log("Mafia wins! All non-Mafia players are dead.");
    return 'mafia_win';
  }

  return 'in-progress';
}

function resetVotingStatus() {
  Object.values(users).forEach((user) => {
    user.voted = false;
  });
}

module.exports = {
  assignRoles,
  processVotes,
  mafiaSelectTarget,
  angelSave,
  finalizeRound,
  checkWinCondition,
  resetVotingStatus,
  detectiveInvestigate,
  getGameStage,
};
