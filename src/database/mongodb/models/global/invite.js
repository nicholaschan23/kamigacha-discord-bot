const mongoose = require("mongoose");

const inviteSchema = new mongoose.Schema({
  // Who sent the invite
  senderUserId: {
    type: String,
    required: true,
  },

  // Who received the invite
  receiverUserId: {
    type: String,
    unique: true,
    required: true,
  },

  // When invite was accepted in Unix time seconds
  unixTimeSeconds: {
    type: Number,
    default: () => Math.floor(Date.now() / 1000),
  },
});

module.exports = mongoose.model("invite", inviteSchema);
