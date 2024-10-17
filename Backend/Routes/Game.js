// routes/gameRoutes.js

const express = require("express");
const router = express.Router();

// Check server status
router.get("/", (req, res) => {
  res.send("Mafia Game Server is running.");
});

module.exports = router;
