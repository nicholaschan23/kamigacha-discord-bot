const mongoose = require("mongoose");

const cardCollectionSchema = new mongoose.Schema({
  userID: {
    type: String,
    unique: true,
    required: true,
  },

  // Privacy settings
  isPrivate: {
    type: Boolean,
    default: false
  },

  // Collection
  cardCodes: [{
    type: String,
    unique: true,
  }],
});

module.exports = (client) => {
  const database = client.userDB;
  return database.model("collection", cardCollectionSchema);
};