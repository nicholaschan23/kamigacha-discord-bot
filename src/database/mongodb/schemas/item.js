const mongoose = require("mongoose");

// Define a schema for storing an item
const itemSchema = new mongoose.Schema({
  name: String,
  quantity: {
    type: Number,
    required: true,
  }
});

module.exports = itemSchema;
