const mongoose = require("mongoose");
const client = require("../../../../../bot");

const moderatorSchema = new mongoose.Schema({
  // Moderator user Id
  userId: {
    type: String,
    unique: true,
    required: true,
  },
});

module.exports = () => {
  const client = require("../../../../../bot");
  return client.globalDB.model("moderator", moderatorSchema);
};
