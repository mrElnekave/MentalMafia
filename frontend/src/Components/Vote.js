import React, { useState } from 'react';
import axios from 'axios';
import '../App.css';

function Vote({ userId, userRole, players, setMessage, onVoteComplete }) {
  const [selectedPlayerId, setSelectedPlayerId] = useState('');

  const handleVote = async () => {
    try {
      const response = await axios.post('http://localhost:3001/api/game/vote', {
        userId,
        voteeId: selectedPlayerId,
      });
      setMessage(response.data.message);

      if (onVoteComplete) {
        onVoteComplete();
      }
    } catch (error) {
      setMessage(`Vote error: ${error.response?.data?.error || error.message}`);
    }
  };

  const handleSpecialAction = async (action) => {
    let url = '';
    if (action === 'kill') url = 'http://localhost:3001/api/game/action/kill';
    if (action === 'save') url = 'http://localhost:3001/api/game/action/save';
    if (action === 'investigate') url = 'http://localhost:3001/api/game/action/investigate';

    try {
      const response = await axios.post(url, {
        userId,
        targetId: selectedPlayerId,
      });
      setMessage(response.data.message);

      if (onVoteComplete) {
        onVoteComplete();
      }
    } catch (error) {
      setMessage(`Action error: ${error.response?.data?.error || error.message}`);
    }
  };

  return (
    <div className="vote-container">
      <h3>Choose a player:</h3>
      <select
        onChange={(e) => setSelectedPlayerId(e.target.value)}
        value={selectedPlayerId}
      >
        <option value="">Select a player</option>
        {players
          .filter((p) => p.userId !== userId && p.status === 'alive')
          .map((player) => (
            <option key={player.userId} value={player.userId}>
              {player.name} - {player.status}
            </option>
          ))}
      </select>

      {(userRole === 'player' ||  userRole === 'Mafia' || userRole === 'angel' || userRole === 'detective') && (
        <button onClick={handleVote} disabled={!selectedPlayerId}>
          Vote
        </button>
      )}

      {userRole === 'Mafia' && (
        <button
          onClick={() => handleSpecialAction('kill')}
          disabled={!selectedPlayerId}
        >
          Mafia Kill
        </button>
      )}

      {userRole === 'angel' && (
        <button
          onClick={() => handleSpecialAction('save')}
          disabled={!selectedPlayerId}
        >
          Angel Save
        </button>
      )}

      {userRole === 'detective' && (
        <button
          onClick={() => handleSpecialAction('investigate')}
          disabled={!selectedPlayerId}
        >
          Investigate
        </button>
      )}
    </div>
  );
}

export default Vote;
