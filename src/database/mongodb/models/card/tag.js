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
});

module.exports = (client) => {
  const database = client.cardDB;
  return database.model("collection tag", collectionTagSchema);
};
