const mongoose = require("mongoose");

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

const characterSchema = new mongoose.Schema({
  character: {
    type: String,
    required: true,
  },

  series: {
    type: String,
    required: true,
  },

  // Number of players who have this character on their wishlist
  wishlist: {
    type: Number,
    default: 0,
  },

  // Key is .jpg name
  circulation: {
    type: Map,
    of: circulationSchema,
    default: () => new Map(),
  },
});

module.exports = (client) => {
  const database = client.globalDB;
  return database.model("character", characterSchema);
};
