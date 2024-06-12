const mongoose = require("mongoose");
const cardSchema = require("../card")

// Define a schema for storing pity timers
const schema = new mongoose.Schema({
  userID: String,

  // Pity timers
  cards: {
    type: Map,
    of: cardSchema,
    default: new Map(),
  },
});

const UserCollectionModel = mongoose.model("collection", schema);

module.exports = UserCollectionModel;
