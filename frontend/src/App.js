// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'; // Router setup
import Login from './Components/login.js';
// import Game from './Components/Game';


const App = () => {
  return (
    <Router>
      <div className="h-screen bg-gray-100">
       
        <Routes>
          <Route path="/" element={<Login />} /> {/* Login page */}
        
        </Routes>
      </div>
    </Router>
  );
};

export default App;
