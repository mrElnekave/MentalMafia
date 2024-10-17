// sockets/mafiaSocket.js

let players = {};
let gameState = { phase: "waiting", mafiaAlive: 1 };

module.exports = (io) => {
  io.on("connection", (socket) => {
    console.log(`Player connected: ${socket.id}`);

    // Player joins the game
    socket.on("joinGame", (username) => {
      players[socket.id] = { username, role: null, alive: true };
      io.emit("updatePlayers", players); // Broadcast updated player list
    });

    // Assign roles (1 Mafia by default, rest Normal)
    socket.on("assignRoles", () => {
      const playerIds = Object.keys(players);
      players[playerIds[0]].role = "Mafia"; // First player is Mafia
      playerIds.slice(1).forEach((id) => {
        players[id].role = "Normal";
      });
      io.emit("rolesAssigned", players); // Notify all clients of their roles
      gameState.mafiaAlive = 1; // Reset Mafia alive count
    });

    // Handle player actions (e.g., kill)
    socket.on("action", ({ action, targetId }) => {
      if (action === "kill" && players[socket.id]?.role === "Mafia") {
        players[targetId].alive = false;
        gameState.mafiaAlive -= 1; // Update Mafia alive count
      }

      if (gameState.mafiaAlive === 0) {
        io.emit("gameOver", { winner: "Villagers" }); // Notify game over
      } else {
        io.emit("updatePlayers", players); // Broadcast updated player status
      }
    });

    // Handle player disconnections
    socket.on("disconnect", () => {
      console.log(`Player disconnected: ${socket.id}`);
      delete players[socket.id];
      io.emit("updatePlayers", players); // Broadcast updated player list
    });
  });
};
