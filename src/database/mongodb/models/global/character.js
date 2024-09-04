const mongoose = require("mongoose");

// Define the schema for circulation stats
const circulationSchema = new mongoose.Schema(
  {
    destroyed: {
      type: Number,
      default: 0,
    },
    generated: {
      type: Number,
      default: 0,
    },
  },
  { _id: false }
);

// Define the schema for each set with a timestamp
const setSchema = new mongoose.Schema(
  {
    rarities: {
      type: Map,
      of: circulationSchema,
      default: () => new Map(),
    },

    // When the set was added to the character
    timestamp: {
      type: Number,
      default: () => Math.floor(Date.now() / 1000), // Defaults to current Unix timestamp
    },
  },
  { _id: false }
);

// Define the schema for a unique character
const characterSchema = new mongoose.Schema(
  {
    character: {
      type: String,
      required: true,
    },

    series: {
      type: String,
      required: true,
    },

    // Number of players who have this character on their wish list
    wishCount: {
      type: Number,
      default: 0,
    },

    // Top map: key is set number
    // Nested map: key is rarity letter
    circulation: {
      type: Map,
      of: setSchema,
      default: () => new Map(),
    },
  },
  { _id: false }
);

module.exports = () => {
  const client = require("../../../../../bot");
  return client.globalDB.model("character", characterSchema);
};
