import React, { useState } from 'react';
import axios from 'axios';
import '../App.css';

function Vote({ userId, role, players, sessionId, setMessage }) {
  const [targetId, setTargetId] = useState('');

  const handleVote = async () => {
    try {
      const response = await axios.post('http://localhost:3001/api/game/vote', {
        userId,
        voteeId: targetId,
      });
      setMessage(response.data.message);
    } catch (error) {
      console.error('Vote error:', error.response?.data?.error || error.message);
    }
  };

  const handleAction = async () => {
    let url = '';
    if (role === 'god') {
      url = 'http://localhost:3001/api/game/action/kill';
    } else if (role === 'angel') {
      url = 'http://localhost:3001/api/game/action/revive';
    } else {
      return;
    }

    try {
      const response = await axios.post(url, { userId, targetId });
      setMessage(response.data.message);
    } catch (error) {
      console.error('Action error:', error.response?.data?.error || error.message);
    }
  };

  return (
    <div className="vote-container">
      <h3>Choose a player:</h3>
      <select onChange={(e) => setTargetId(e.target.value)} value={targetId}>
        <option value="">Select a player</option>
        {players
          .filter((p) => p.userId !== userId && p.status === 'alive')
          .map((player) => (
            <option key={player.userId} value={player.userId}>
              {player.name}
            </option>
          ))}
      </select>
      <button onClick={handleVote} disabled={!targetId}>
        Vote
      </button>
      {(role === 'god' || role === 'angel') && (
        <button onClick={handleAction} disabled={!targetId}>
          {role === 'god' ? 'Kill' : 'Revive'}
        </button>
      )}
    </div>
  );
}

export default Vote;
