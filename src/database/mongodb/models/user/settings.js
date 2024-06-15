const mongoose = require("mongoose");

const userSettingsSchema = new mongoose.Schema({
  userID: {
    type: String,
    unique: true,
    required: true,
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

module.exports = (client) => {
  const database = client.userDB;
  return database.model("user settings", userSettingsSchema);
};