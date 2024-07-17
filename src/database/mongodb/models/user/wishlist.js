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
    { _id: false },
  ],
});

module.exports = () => {
  const client = require("../../../../../bot");
  return client.userDB.model("wishlist", wishlistSchema);
};
