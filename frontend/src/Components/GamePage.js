import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Vote from './Vote';
import '../App.css';

function GamePage() {
  const [players, setPlayers] = useState([]);
  const [gameStatus, setGameStatus] = useState(`night: mafia's turn`);
  const [message, setMessage] = useState('');
  const [userRole, setUserRole] = useState('');
  const userId = localStorage.getItem('userId');

  const fetchPlayers = async () => {
    try {
      const response = await axios.get('http://localhost:3001/api/game/players');
      setPlayers(response.data.players);
    } catch (error) {
      console.error('Error fetching players:', error.message);
    }
  };

  const fetchGameStatus = async () => {
    try {
      const response = await axios.get('http://localhost:3001/api/game/status');
      setGameStatus(response.data.status);
    } catch (error) {
      console.error('Error fetching game status:', error.message);
    }
  };

  const joinGame = async () => {
    try {
      const response = await axios.post('http://localhost:3001/api/user/game/join', { userId });
      setUserRole(response.data.role); // Set the user's role
      setGameStatus(response.data.status);
      await fetchPlayers(); // Fetch players after joining
    } catch (error) {
      console.error('Error joining game:', error.message);
      setMessage('Failed to join the game. Please try again.');
    }
  };

  const handleVoteComplete = async () => {
    await fetchPlayers();
    await fetchGameStatus();
  };

  useEffect(() => {
    if (userId) {
      joinGame(); // Automatically join the game if userId is available
    }
  }, [userId]);

  return (
    <div className="game-container">
      <h2>Game Status:{gameStatus}</h2>

      <div className="player-list">
        <h3>Players: {userRole}  </h3>
        {players.length > 0 ? (
          <ul>
            {players.map((player) => (
              <li
                key={player.userId}
                className={player.status === 'dead' ? 'dead' : 'alive'}
              >
                {player.name} - {player.status} {/* Only show status */}
              </li>
            ))}
          </ul>
        ) : (
          <p>No players available.</p>
        )}
      </div>

      {gameStatus === 'in-progress' && (
        <Vote
          userId={userId}
          userRole={userRole} // Pass the user's role
          players={players}
          setMessage={setMessage}
          onVoteComplete={handleVoteComplete}
        />
      )}

      {message && <p className="message">{message}</p>}
    </div>
  );
}

export default GamePage;
