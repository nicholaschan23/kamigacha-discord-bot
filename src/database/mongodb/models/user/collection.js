const mongoose = require("mongoose");
const cardSchema = require("../../schemas/card");

const cardCollectionSchema = new mongoose.Schema({
  userID: {
    type: String,
    unique: true,
    required: true,
  },

  // Privacy settings
  isPrivate: {
    type: Boolean,
    default: false
  },

  // Collection
  cards: {
    type: Map,
    of: cardSchema,
    default: new Map(),
  },
});

module.exports = (client) => {
  const database = client.userDB;
  return database.model("user collection", cardCollectionSchema);
};