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

// Define the schema for each rarity, each with individual circulation stats
const raritySchema = new mongoose.Schema(
  {
    rarities: {
      type: Map,
      of: circulationSchema,
      default: () => new Map(),
    },
  },
  { _id: false }
);

// Define the schema for a unique character
const characterSchema = new mongoose.Schema({
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

  // Index represents set number
  // Set 1 is at index 0 in this case
  circulation: {
    type: [raritySchema],
    default: () => [],
  },
});

module.exports = () => {
  const client = require("../../../../../bot");
  return client.globalDB.model("character", characterSchema);
};
