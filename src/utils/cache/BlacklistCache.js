const { Collection } = require("discord.js");
const Logger = require("../Logger");
const logger = new Logger("Blacklist cache");
const BlacklistModel = require("../../database/mongodb/models/global/blacklist");

class BlacklistCache {
  constructor(client) {
    this.client = client;
    this.blacklist = new Collection();
    this.initialize();
  }

  // Initialize the blacklist cache from the database
  async initialize() {
    const blacklistedUsers = await BlacklistModel().find({});
    blacklistedUsers.forEach((user) => {
      this.blacklist.set(user.blacklistUserId, {
        moderatorUserId: user.moderatorUserId,
        reason: user.reason,
        unixTimeSeconds: user.unixTimeSeconds,
      });
    });
    logger.success(`Blacklist cache initialized with ${this.blacklist.size} users`);
  }

  // Check if a user is blacklisted
  isBlacklisted(userId) {
    return this.blacklist.has(userId);
  }

  // Get the reason a user was blacklisted
  getReason(userId) {
    const user = this.blacklist.get(userId);
    return user ? user.reason : null;
  }

  // Add the blacklisted user to the database and cache then broadcast the update to all shards
  async addToBlacklist(userId, moderatorUserId, reason) {
    const newUser = new (BlacklistModel())({
      blacklistUserId: userId,
      moderatorUserId: moderatorUserId,
      reason: reason,
    });
    await newUser.save();

    const data = {
      moderatorUserId: moderatorUserId,
      reason: reason,
      unixTimeSeconds: newUser.unixTimeSeconds,
    };
    this.blacklist.set(userId, data);
    await this.broadcastUpdate("addToBlacklist", userId, data);
  }

  // Remove a user from the blacklist and broadcast the update to all shards
  async removeFromBlacklist(userId) {
    await BlacklistModel().deleteOne({ blacklistUserId: userId });
    this.blacklist.delete(userId);

    await this.broadcastUpdate("removeFromBlacklist", userId);
  }

  // Refresh the blacklist cache from the database
  async refreshCache() {
    this.blacklist.clear();
    await this.initialize();
  }

  // Broadcast an update to all shards
  async broadcastUpdate(action, userId, data = null) {
    await this.client.cluster.broadcastEval(
      async (client, context) => {
        const { action, userId, data } = context;
        const blacklistCache = client.blacklistCache;
        if (action === "addToBlacklist") {
          blacklistCache.blacklist.set(userId, data);
        } else if (action === "removeFromBlacklist") {
          blacklistCache.blacklist.delete(userId);
        }
      },
      { context: { action, userId, data } }
    );
  }
}

module.exports = BlacklistCache;
