// src/Login.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // Navigation hook from React Router
// Correct import
import { io } from 'socket.io-client';


const socket = io('http://localhost:3000'); // Connect to the backend server

const Login = () => {
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate(); // Use for navigation

  const handleLogin = () => {
    if (!username) {
      setError('Username is required');
      return;
    }

    // Emit the joinGame event to the backend
    socket.emit('joinGame', username);

    // Navigate to the game page
    navigate('/game');
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900">
      <div className="bg-white p-8 rounded-lg shadow-md w-96">
        <h1 className="text-2xl font-bold mb-6 text-center">Login to Mafia Game</h1>
        <input
          type="text"
          placeholder="Enter your username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full px-4 py-2 mb-4 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={handleLogin}
          className="w-full bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600 transition"
        >
          Join Game
        </button>
        {error && <p className="text-red-500 mt-4">{error}</p>}
      </div>
    </div>
  );
};

export default Login;
