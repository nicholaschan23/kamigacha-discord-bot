const mongoose = require("mongoose");

const tagSchema = new mongoose.Schema({
  emoji: {
    type: String,
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    default: 0,
  },
});

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
    of: tagSchema,
    default: {},
  },
});

module.exports = (client) => {
  const database = client.userDB;
  return database.model("collection tag", collectionTagSchema);
};
