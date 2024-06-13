const mongoose = require("mongoose");

// Define a schema for storing user settings
const userSettingsSchema = new mongoose.Schema({
  userID: {
    type: String,
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