const mongoose = require("mongoose");

const totalCardsPulledSchema = new mongoose.Schema(
  {
    C: {
      type: Number,
      default: 0,
    },
    R: {
      type: Number,
      default: 0,
    },
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
    UGC: {
      type: Number,
      default: 0,
    },
  },
  { _id: false }
);

const userStatsSchema = new mongoose.Schema({
  userId: {
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

module.exports = mongoose.model("stats", userStatsSchema);