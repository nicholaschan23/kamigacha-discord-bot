const mongoose = require("mongoose");

const blacklistSchema = new mongoose.Schema({
  // Who is blacklisted
  blacklistUserId: {
    type: String,
    unique: true,
    required: true,
  },

  // Who blacklisted the user
  moderatorUserId: {
    type: String,
    required: true,
  },

  // Reason for getting blacklisted
  reason: {
    type: String,
    required: true,
  },

  // When user was blacklisted in Unix time seconds
  unixTimeSeconds: {
    type: Number,
    default: () => Math.floor(Date.now() / 1000),
  },
});

module.exports = mongoose.model("blacklist", blacklistSchema);
