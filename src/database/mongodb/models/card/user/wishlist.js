const mongoose = require("mongoose");

const wishlistSchema = new mongoose.Schema({
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

  wishlistLimit: {
    type: Number,
    default: 10,
  },

  wishlist: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "character",
    },
  ],
});

module.exports = (client) => {
  const database = client.cardDB;
  return database.model("wishlist", wishlistSchema);
};
