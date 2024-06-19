const mongoose = require("mongoose");
const totalCardsPulledSchema = require("../../schemas/totalCardsPulled");

const userStatsSchema = new mongoose.Schema({
  userID: {
    type: String,
    unique: true,
    required: true,
  },

  // Privacy settings
  isPrivate: {
    type: Boolean,
    default: false,
  },

  // Card stats
  totalCardsPulled: {
    type: totalCardsPulledSchema,
    default: () => ({}),
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
  },
});

module.exports = (client) => {
  const database = client.userDB;
  return database.model("stats", userStatsSchema);
};
