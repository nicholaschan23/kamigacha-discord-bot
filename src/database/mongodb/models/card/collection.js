const mongoose = require("mongoose");

const cardCollectionSchema = new mongoose.Schema({
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

  // Collection
  cardsOwned: {
    type: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "card",
      },
    ],
    default: [],
  },
});

module.exports = () => {
  const client = require("../../../../../bot");
  return client.cardDB.model("collection", cardCollectionSchema);
};
