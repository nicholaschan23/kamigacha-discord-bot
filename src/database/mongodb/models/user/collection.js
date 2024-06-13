const mongoose = require("mongoose");
const cardSchema = require("../../schemas/card");

// Define a schema for storing a user's card collection
const cardCollectionSchema = new mongoose.Schema({
  userID: {
    type: String,
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