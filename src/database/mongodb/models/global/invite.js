const mongoose = require("mongoose");

const inviteSchema = new mongoose.Schema({
  // Who sent the invite
  senderUserID: {
    type: String,
    required: true,
  },

  // Who received the invite
  receiverUserID: {
    type: String,
    unique: true,
    required: true,
  },

  // When invite was accepted
  unixTimeSeconds: {
    type: Number,
    default: () => Math.floor(Date.now() / 1000),
  },
});

module.exports = (client) => {
  const database = client.globalDB;
  return database.model("invite", inviteSchema);
};
