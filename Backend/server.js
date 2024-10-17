// server.js

const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

// Import routes and socket logic
const gameRoutes = require("./Routes/Game");
const mafiaSocket = require("./Sockets/mainSocket");

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

// Middleware
app.use(cors());
app.use(express.json());

// Use routes
app.use("/api", gameRoutes);

// Initialize socket logic
mafiaSocket(io);

// Start the server
const PORT = 3000;
server.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
