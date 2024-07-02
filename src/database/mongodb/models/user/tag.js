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
  userId: {
    type: String,
    unique: true,
    required: true,
  },

  // Privacy settings
  isPrivate: {
    type: Boolean,
    default: false,
  },

  tagLimit: {
    type: Number,
    default: 25,
  },

  /**
   * Collection tags list.
   * @type {Array<{tag: string, emoji: string, quantity: number}>}
   * @default {}
   */
  tagList: [
    {
      tag: { type: String, required: true },
      emoji: { type: String, required: true },
      quantity: { type: Number, default: 0 },
    },
  ],
});

module.exports = (client) => {
  const database = client.userDB;
  return database.model("collection tag", collectionTagSchema);
};
