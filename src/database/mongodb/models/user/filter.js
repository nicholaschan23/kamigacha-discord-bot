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

  /**
   * Collection filters list.
   * @type {Array<{emoji: string, label: string, filter: string}>}
   */
  filterList: {
    type: [
      {
        emoji: { type: String, required: true },
        label: { type: String, required: true },
        filter: { type: String, required: true },
      },
    ],
    default: () => [
      { emoji: "🗓️", label: "Date", filter: "order=date" },
      // { emoji: ":heart:", label: "Show Wishlist", filter: "wishlist<>" },
      // { emoji: ":heart:", label: "Wishlist", filter: "order=wishlist" },
      { emoji: "🏷️", label: "Tagged", filter: "tag!=none" },
      { emoji: "▪️", label: "Untagged", filter: "tag=none" },
    ],
  },
});

module.exports = (client) => {
  const database = client.userDB;
  return database.model("collection filter", collectionFilterSchema);
};
