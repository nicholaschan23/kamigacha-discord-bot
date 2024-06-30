const mongoose = require("mongoose");

const filterSchema = new mongoose.Schema({
  emoji: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  filter: {
    type: String,
    required: true,
  },
});

const collectionFilterSchema = new mongoose.Schema({
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

  filterLimit: {
    type: Number,
    default: 25,
  },

  /**
   * Collection filters list.
   * @type {Array<{emoji: string, name: string, filter: string}>}
   */
  filterList: {
    type: [filterSchema],
    default: () => [
      { emoji: "🗓️", name: "Date", filter: "order=date" },
      // { emoji: ":heart:", name: "Show Wishlist", filter: "wishlist<>" },
      // { emoji: ":heart:", name: "Wishlist", filter: "order=wishlist" },
      { emoji: "▪️", name: "Untagged", filter: "tag=none" },
      { emoji: "🏷️", name: "Tagged", filter: "tag!=none" },
    ],
  },
});

module.exports = (client) => {
  const database = client.userDB;
  return database.model("collection filter", collectionFilterSchema);
};
