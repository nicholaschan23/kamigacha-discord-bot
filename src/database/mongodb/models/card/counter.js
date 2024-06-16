const mongoose = require("mongoose");

const counterSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  value: { type: Number, required: true },
});

module.exports = (client) => {
  const database = client.cardDB;
  return database.model("counter", counterSchema);
};
