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
      character: String,
      series: String,
    },
  ],
});

module.exports = (client) => {
  const database = client.userDB;
  return database.model("wishlist", wishlistSchema);
};
