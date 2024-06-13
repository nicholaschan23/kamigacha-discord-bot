const mongoose = require("mongoose");

const globalAccessSchema = new mongoose.Schema({
  userID: {
    type: String,
    unique: true,
    required: true,
  },
  status: {
    type: String,
    enum: ["whitelist", "blacklist"],
    required: true,
  },
  invitedByUserID: {
    type: String,
    required: true,
  },
  reason: {
    type: String,
    required: function () {
      return this.status === "blacklist"; // Reason is required only for blacklist entries
    },
  },
});

module.exports = (client) => {
  const database = client.globalDB;
  return database.model("global access", globalAccessSchema);
};
