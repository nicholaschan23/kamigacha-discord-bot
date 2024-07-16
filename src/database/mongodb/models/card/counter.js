const mongoose = require("mongoose");

const counterSchema = new mongoose.Schema({
  _id: {
    type: String,
    required: true,
  },

  sequenceValue: {
    type: Number,
    default: -1,
    required: true,
  },
});

module.exports = () => {
  const client = require("../../../../../bot");
  return client.cardDB.model("counter", counterSchema);
};
