const mongoose = require("mongoose");

const userPitySchema = new mongoose.Schema({
  userId: {
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

module.exports = mongoose.model("pity", userPitySchema);
