const mongoose = require("mongoose");

const userStatsSchema = new mongoose.Schema({
  userID: {
    type: String,
    unique: true,
    required: true,
  },

  // Card stats
  totalCardsPulled: {
    type: Number,
    default: 0,
  },
  cardUpgradesComplete: {
    type: Number,
    default: 0,
  },
  cardUpgradesFailed: {
    type: Number,
    default: 0,
  },

  totalSetsComplete: {
    type: Number,
    default: 0,
  }
});

module.exports = (client) => {
  const database = client.userDB;
  return database.model("user pity", userStatsSchema);
};
