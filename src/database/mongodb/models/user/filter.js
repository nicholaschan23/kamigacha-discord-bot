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
      { _id: false },
    ],
    default: () => [
      { emoji: "🗓️", label: "Date", filter: "order=date" },
      // { emoji: ":heart:", label: "Show Wish", filter: "wish<>" },
      // { emoji: ":heart:", label: "Wish", filter: "order=wish" },
      { emoji: "🏷️", label: "Tagged", filter: "tag!=none" },
      { emoji: "▪️", label: "Untagged", filter: "tag=none" },
    ],
  },
});

module.exports = () => {
  const client = require("../../../../../bot");
  return client.userDB.model("collection filter", collectionFilterSchema);
};
