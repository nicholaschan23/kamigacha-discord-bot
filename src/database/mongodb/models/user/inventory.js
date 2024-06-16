const mongoose = require("mongoose");
const item = require("../../schemas/item");

const inventorySchema = new mongoose.Schema({
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
  inventory: {
    type: Map,
    of: item,
    default: new Map(),
  },
});

module.exports = (client) => {
  const database = client.userDB;
  return database.model("inventory", inventorySchema);
};