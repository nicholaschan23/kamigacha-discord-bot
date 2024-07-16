const mongoose = require("mongoose");

const userSettingsSchema = new mongoose.Schema({
  userId: {
    type: String,
    unique: true,
    required: true,
  },

  // Cooldowns in Unix time seconds
  cooldownPull: {
    type: Number,
    default: 0,
  },
  cooldownMultiPull: {
    type: Number,
    default: 0,
  },

  // DM reminders
  reminderPull: {
    type: Boolean,
    default: false,
  },
  reminderMultiPull: {
    type: Boolean,
    default: false,
  },
});

module.exports = () => {
  const client = require("../../../../../bot");
  return client.userDB.model("settings", userSettingsSchema);
};
