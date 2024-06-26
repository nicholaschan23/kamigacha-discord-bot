const mongoose = require("mongoose");

const moderatorSchema = new mongoose.Schema({
  // Moderator user Id
  userId: {
    type: String,
    unique: true,
    required: true,
  },
});

module.exports = (client) => {
  const database = client.globalDB;
  return database.model("moderator", moderatorSchema);
};
