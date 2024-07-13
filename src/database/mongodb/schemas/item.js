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

module.exports = itemSchema;
