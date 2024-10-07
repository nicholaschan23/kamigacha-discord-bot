const mongoose = require("mongoose");

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

  // Items user holds {item name, quantity}
  inventory: {
    type: Map,
    of: Number,
    default: new Map(),
  },
});

module.exports = mongoose.model("inventory", inventorySchema);