const mongoose = require("mongoose");

const userPitySchema = new mongoose.Schema({
  userID: {
    type: String,
    unique: true,
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
