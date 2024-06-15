const mongoose = require("mongoose");

const moderatorSchema = new mongoose.Schema({
  // Moderator user ID
  userID: {
    type: String,
    unique: true,
    required: true,
  },
});

module.exports = (client) => {
  const database = client.globalDB;
  return database.model("invite", moderatorSchema);
};
