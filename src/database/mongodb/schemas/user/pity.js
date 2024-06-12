const mongoose = require("mongoose");

// Define a schema for storing pity timers
const schema = new mongoose.Schema({
  userID: String,

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

const UserPityModel = mongoose.model("pity", schema);

module.exports = UserPityModel;
