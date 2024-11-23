// src/components/Login.js

import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../App.css';

function Login() {
  const [name, setName] = useState('');
  const navigate = useNavigate();

  const playerId = new URLSearchParams(window.location.search).get('player') || 'default';
  localStorage.setItem('playerId', playerId)

  const handleLogin = async () => {
    try {
      const response = await axios.post('http://localhost:3001/api/user/login', { name });
      
      const { userId } = response.data;
      // Store userId in localStorage or state management
      localStorage.setItem('userId', userId);
      
      navigate('/game');
    } catch (error) {
      console.error('Login error:', error.response.data.error);
    }
  };

  return (
    <div className="login-container">
      <h2>Mafia Game Login</h2>
      <input
        type="text"
        placeholder="Enter your name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <button onClick={handleLogin} disabled={!name}>
        Login
      </button>
    </div>
  );
}

export default Login;
