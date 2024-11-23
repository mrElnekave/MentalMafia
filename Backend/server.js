// server.js

const express = require('express');
const app = express();
const http = require('http');
const socketIo = require('socket.io');
const gameRoutes = require('./Routes/Game.js');
const userRoutes = require('./Routes/UserRoutes');
const cors = require('cors');

const server = http.createServer(app);
const io = socketIo(server);

const PORT = process.env.PORT || 3001;

app.use(express.json());

const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3006',
  'http://localhost:3003',
  'http://localhost:3004',
  'http://localhost:3005',
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true); // Allow the origin
    } else {
      callback(new Error('Not allowed by CORS')); // Deny the origin
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

// Use Routes
app.use('/api/game', gameRoutes);
app.use('/api/user', userRoutes);

// Start the server
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

app.get('/', (req, res) => {
    res.send('Server is working!');
  });
  

// Socket.io setup
io.on('connection', (socket) => {
  console.log('New client connected');

  // Handle socket events here

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

module.exports = { app, io };
