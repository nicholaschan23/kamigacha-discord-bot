const mongoose = require("mongoose");

const blacklistSchema = new mongoose.Schema({
  // Who is blacklisted
  blacklistUserID: {
    type: String,
    unique: true,
    required: true,
  },

  // Who blacklisted the user
  moderatorUserID: {
    type: String,
    required: true,
  },

  // Reason for getting blacklisted
  reason: {
    type: String,
    required: true,
  },

  // When user was blacklisted
  unixTimeMin: { 
    type: Number,
    default: () => Math.floor(Date.now() / 60000),
  },
});

module.exports = (client) => {
  const database = client.globalDB;
  return database.model("blacklist", blacklistSchema);
};
