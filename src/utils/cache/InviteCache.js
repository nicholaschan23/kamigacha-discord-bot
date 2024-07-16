const { Collection } = require("discord.js");
const InviteModel = require("../../database/mongodb/models/global/invite");
const Logger = require("../Logger");
const logger = new Logger("Invite cache");

class InviteCache {
  constructor(client) {
    this.client = client;
    this.invites = new Collection();
    this.initialize();
  }

  // Initialize the invite cache from the database
  async initialize() {
    const allInvites = await InviteModel().find({});
    allInvites.forEach((invite) => {
      this.invites.set(invite.receiverUserId, {
        senderUserId: invite.senderUserId,
        unixTimeSeconds: invite.unixTimeSeconds,
      });
    });
    logger.success(`Invite cache initialized with ${this.invites.size} invites`);
  }

  // Check if a user is invited
  isInvited(userId) {
    return this.invites.has(userId);
  }

  // Get the sender of the invite
  getSender(userId) {
    const invite = this.invites.get(userId);
    return invite ? invite.senderUserId : null;
  }

  // Add a new invite to the database and cache
  async addInvite(senderUserId, receiverUserId) {
    const newInvite = new (InviteModel())({
      senderUserId,
      receiverUserId,
    });
    await newInvite.save();

    const data = {
      senderUserId,
      unixTimeSeconds: newInvite.unixTimeSeconds,
    };
    this.invites.set(receiverUserId, data);
    await this.broadcastUpdate("addInvite", receiverUserId, data);
  }

  // Remove an invite from the database and cache
  async removeInvite(receiverUserId) {
    await InviteModel().deleteOne({ receiverUserId });
    this.invites.delete(receiverUserId);
    await this.broadcastUpdate("removeInvite", receiverUserId);
  }

  // Refresh the invite cache from the database
  async refreshCache() {
    this.invites.clear();
    await this.initialize();
  }

  // Broadcast an update to all shards
  async broadcastUpdate(action, userId, data = null) {
    await this.client.cluster.broadcastEval(
      (client, { action, userId, data }) => {
        const inviteCache = client.inviteCache;
        if (action === "addInvite") {
          inviteCache.invites.set(userId, data);
        } else if (action === "removeInvite") {
          inviteCache.invites.delete(userId);
        }
      },
      { context: { action, userId, data } }
    );
  }
}

module.exports = InviteCache;
