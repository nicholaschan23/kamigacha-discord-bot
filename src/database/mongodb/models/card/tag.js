const mongoose = require("mongoose");

const collectionTagSchema = new mongoose.Schema({
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

  // Tags for card sets: key = tag name, value = emoji
  tagList: {
    type: Map,
    of: String,
    default: {},
  },

  // Cards associate with a tag: key = tag name, value = array of cards with that tag
  taggedCards: {
    type: Map,
    of: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "card",
      },
    ],
    default: new Map()
  },
});

module.exports = (client) => {
  const database = client.cardDB;
  return database.model("collection tag", collectionTagSchema);
};
