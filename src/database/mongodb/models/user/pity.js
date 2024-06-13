const mongoose = require("mongoose");

// Define a schema for storing user pity timers
const userPitySchema = new mongoose.Schema({
  userID: {
    type: String,
    required: true,
  },

  // Pity timers
  UR: {
    type: Number,
    default: 0,
  },
  SR: {
    type: Number,
    default: 0,
  },
  SSR: {
    type: Number,
    default: 0,
  },
});

module.exports = (client) => {
  const database = client.userDB;
  return database.model("user pity", userPitySchema);
};
