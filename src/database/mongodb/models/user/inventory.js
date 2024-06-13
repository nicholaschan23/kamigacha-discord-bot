const mongoose = require("mongoose");
const item = require("../../schemas/item");

// Define a schema for storing a user's card collection
const inventorySchema = new mongoose.Schema({
  userID: {
    type: String,
    required: true,
  },

  // Privacy settings
  isPrivate: {
    type: Boolean,
    default: false
  },

  // Collection
  inventory: {
    type: Map,
    of: item,
    default: new Map(),
  },
});

module.exports = (client) => {
  const database = client.userDB;
  return database.model("user inventory", inventorySchema);
};