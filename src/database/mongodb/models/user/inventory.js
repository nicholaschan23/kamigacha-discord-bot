const mongoose = require("mongoose");

// Define a schema for storing an item
const itemSchema = new mongoose.Schema(
  {
    // Item name
    name: {
      type: String,
      required: true,
    },

    // Item quantity
    quantity: {
      type: Number,
      required: true,
    },

    // Item icon as a Discord emoji
    icon: {
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

  // Collection
  inventory: {
    type: Map,
    of: itemSchema,
    default: {},
  },
});

module.exports = () => {
  const client = require("../../../../../bot");
  return client.userDB.model("inventory", inventorySchema);
};
