const mongoose = require("mongoose");

// Define a schema for an item
const itemSchema = new mongoose.Schema(
  {
    // Item quantity
    quantity: {
      type: Number,
      required: true,
    },

    // Item type to lookup icon
    type: {
      type: String,
      require: true,
    },
  },
  { _id: false }
);

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

  // Items user holds, with item name as the key
  inventory: {
    type: Map,
    of: itemSchema,
    default: new Map(),
  },
});

module.exports = () => {
  const client = require("../../../../../bot");
  return client.userDB.model("inventory", inventorySchema);
};
