const mongoose = require("mongoose");

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
   * @type {Array<{emoji: string, label: string, filter: string}>}
   */
  filterList: {
    type: [{}],
    default: () => [
      { emoji: "🗓️", label: "Date", filter: "order=date" },
      // { emoji: ":heart:", label: "Show Wishlist", filter: "wishlist<>" },
      // { emoji: ":heart:", label: "Wishlist", filter: "order=wishlist" },
      { emoji: "▪️", label: "Untagged", filter: "tag=none" },
      { emoji: "🏷️", label: "Tagged", filter: "tag!=none" },
    ],
  },
});

module.exports = (client) => {
  const database = client.userDB;
  return database.model("collection filter", collectionFilterSchema);
};
