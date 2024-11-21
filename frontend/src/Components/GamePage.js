// src/components/GamePage.js

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Vote from './Vote';
import '../App.css';

function GamePage() {
    const [sessionId, setSessionId] = useState('');
    const [gameStatus, setGameStatus] = useState('');
    const [role, setRole] = useState('');
    const [players, setPlayers] = useState([]);
    const [message, setMessage] = useState('');
    const userId = localStorage.getItem('userId');
  
    useEffect(() => {
      const joinGame = async () => {
        try {
          const response = await axios.post('http://localhost:3001/api/user/game/join', { userId });
          setSessionId(response.data.sessionId);
          setGameStatus(response.data.status);
          setRole(players[userId].role || response.data.role); // Set the assigned role
          fetchPlayers();
        } catch (error) {
          console.error('Join game error:', error.response?.data?.error || error.message);
        }
      };
  
      joinGame();
    }, [userId]);
  
    const fetchPlayers = async () => {
      try {
        const response = await axios.get('http://localhost:3001/api/game/players', {
          params: { sessionId },
        });
        setPlayers(response.data.players);
      } catch (error) {
        console.error('Fetch players error:', error.response?.data?.error || error.message);
      }
    };
  
    return (
      <div className="game-container">
        <h2>Game Started</h2>
        <p>Your role: {role}</p>
        <Vote
          userId={userId}
          role={role}
          players={players}
          sessionId={sessionId}
          setMessage={setMessage}
        />
        {message && <p className="message">{message}</p>}
      </div>
    );
  }
  export default GamePage;