const mongoose = require("mongoose");

const collectionTagsSchema = new mongoose.Schema({
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

  // Tags for card sets
  tags: {
    type: Map,
    of: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "card",
      },
    ],
    default: {},
  },
});

module.exports = (client) => {
  const database = client.cardDB;
  return database.model("collection", collectionTagsSchema);
};
