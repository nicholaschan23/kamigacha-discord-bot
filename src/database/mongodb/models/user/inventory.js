const mongoose = require("mongoose");
const item = require("../../schemas/item");

const inventorySchema = new mongoose.Schema({
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
  inventory: {
    type: Map,
    of: item,
    default: {},
  },
});

module.exports = (client) => {
  const database = client.userDB;
  return database.model("inventory", inventorySchema);
};
