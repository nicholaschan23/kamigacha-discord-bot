const { Collection } = require("discord.js");
const InviteModel = require("../../database/mongodb/models/global/invite");
const utils = require("../../utils");
const logger = new utils.Logger("Invite cache");

class InviteCache {
  constructor(client) {
    this.client = client;
    this.invites = new Collection();
    this.initialize();
  }

  // Initialize the invite cache from the database
  async initialize() {
    const allInvites = await InviteModel(this.client).find({});
    allInvites.forEach((invite) => {
      this.invites.set(invite.receiverUserID, {
        senderUserID: invite.senderUserID,
        unixTimeSeconds: invite.unixTimeSeconds,
      });
    });
    logger.success(`Invite cache initialized with ${this.invites.size} invites`);
  }

  // Check if a user is invited
  isInvited(userID) {
    return this.invites.has(userID);
  }

  // Get the sender of the invite
  getSender(userID) {
    const invite = this.invites.get(userID);
    return invite ? invite.senderUserID : null;
  }

  // Add a new invite to the database and cache
  async addInvite(senderUserID, receiverUserID) {
    const newInvite = new (InviteModel(this.client))({
      senderUserID,
      receiverUserID,
    });
    await newInvite.save();

    const data = {
      senderUserID,
      unixTimeSeconds: newInvite.unixTimeSeconds,
    };
    this.invites.set(receiverUserID, data);
    await this.broadcastUpdate("addInvite", receiverUserID, data);
  }

  // Remove an invite from the database and cache
  async removeInvite(receiverUserID) {
    await InviteModel(this.client).deleteOne({ receiverUserID });
    this.invites.delete(receiverUserID);
    await this.broadcastUpdate("removeInvite", receiverUserID);
  }

  // Refresh the invite cache from the database
  async refreshCache() {
    this.invites.clear();
    await this.initialize();
  }

  // Broadcast an update to all shards
  async broadcastUpdate(action, userID, data = null) {
    await this.client.cluster.broadcastEval(
      (client, { action, userID, data }) => {
        const inviteCache = client.inviteCache;
        if (action === "addInvite") {
          inviteCache.invites.set(userID, data);
        } else if (action === "removeInvite") {
          inviteCache.invites.delete(userID);
        }
      },
      { context: { action, userID, data } }
    );
  }
}

module.exports = InviteCache;
