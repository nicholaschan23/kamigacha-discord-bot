const { Collection } = require("discord.js");
const utils = require("../../utils");
const logger = new utils.Logger("Blacklist cache");
const BlacklistModel = require("../../database/mongodb/models/global/blacklist");

class BlacklistCache {
  constructor(client) {
    this.client = client;
    this.blacklist = new Collection();
    this.initialize();

    // Add a reference to this instance on the client for easy access
    this.client.blacklistCache = this;
  }

  // Initialize the blacklist cache from the database
  async initialize() {
    const blacklistedUsers = await BlacklistModel(this.client).find({});
    blacklistedUsers.forEach((user) => {
      this.blacklist.set(user.blacklistUserID, {
        moderatorUserID: user.moderatorUserID,
        reason: user.reason,
        unixTimeMin: user.unixTimeMin,
      });
    });
    logger.success(`Blacklist cache initialized with ${this.blacklist.size} users`);
  }

  // Check if a user is blacklisted
  isBlacklisted(userID) {
    return this.blacklist.has(userID);
  }

  // Get the reason a user was blacklisted
  getReason(userID) {
    const user = this.blacklist.get(userID);
    return user ? user.reason : null;
  }

  // Add the blacklisted user to the database and cache then broadcast the update to all shards
  async addToBlacklist(userID, moderatorUserID, reason) {
    const newUser = new (BlacklistModel(this.client))({
      blacklistUserID: userID,
      moderatorUserID: moderatorUserID,
      reason: reason,
    });
    await newUser.save();

    const data = {
      moderatorUserID: moderatorUserID,
      reason: reason,
      unixTimeMin: newUser.unixTimeMin,
    };
    this.blacklist.set(userID, data);
    await this.broadcastUpdate("addToBlacklist", userID, data);
  }

  // Remove a user from the blacklist and broadcast the update to all shards
  async removeFromBlacklist(userID) {
    await BlacklistModel(this.client).deleteOne({ blacklistUserID: userID });
    this.blacklist.delete(userID);

    await this.broadcastUpdate("removeFromBlacklist", userID);
  }

  // Refresh the blacklist cache from the database
  async refreshCache() {
    this.blacklist.clear();
    await this.initialize();
  }

  // Broadcast an update to all shards
  async broadcastUpdate(action, userID, data = null) {
    await this.client.shard.broadcastEval(
      (client, { action, userID, data }) => {
        const blacklistCache = client.blacklistCache;
        if (action === "addToBlacklist") {
          blacklistCache.blacklist.set(userID, data);
        } else if (action === "removeFromBlacklist") {
          blacklistCache.blacklist.delete(userID);
        }
      },
      { context: { action, userID, data } }
    );
  }
}

module.exports = BlacklistCache;