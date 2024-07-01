const mongoose = require("mongoose");

const characterVersionSchema = new mongoose.Schema({
  set: Number,
  rarity: String,
  imageUrl: String,
  circulation: {
    type: Number,
    default: 0,
  }
});

const characterSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },

  // alias: {
  //   type: [String],
  // },

  series: {
    type: String,
    required: true,
  },

  // Number of players who have this character on their wishlist
  wishlist: {
    type: Number,
    default: 0,
  },

  versions: [characterVersionSchema]
});

module.exports = (client) => {
  const database = client.cardDB;
  return database.model("character", characterSchema);
};
