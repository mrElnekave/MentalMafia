// data.js

const users = {}; // Stores user info by userId

function generateId() {
  return Math.random().toString(36).substr(2, 9);
}

module.exports = {
  users,
  generateId,
};
