const mongoose = require("mongoose");

const wishSchema = new mongoose.Schema({
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

  wishListLimit: {
    type: Number,
    default: 10,
  },

  wishList: [
    {
      character: String,
      series: String,
    },
    { _id: false },
  ],
});

module.exports = mongoose.model("wish", wishSchema);
