// ExtendedClient.js
const { Client, Collection, Events } = require("discord.js");
const { ClusterClient } = require("discord-hybrid-sharding");
const BlacklistCache = require("../../utils/cache/BlacklistCache");
const InviteCache = require("../../utils/cache/InviteCache");
const mongooseConnect = require("../../database/mongodb/mongooseConnect");
const findEvents = require("./findEvents");
const registerInteractions = require("./registerInteractions");
const findCommands = require("./findCommands");
const registerCommands = require("./registerCommands");
const utils = require("../../utils");
const logger = new utils.Logger("Client");

class ExtendedClient extends Client {
  constructor(options) {
    super(options);

    // Collections
    this.commands = new Collection();
    this.cooldowns = new Collection();
    this.autocompleteInteractions = new Collection();
    this.buttonInteractions = new Collection();
    this.modalInteractions = new Collection();
    this.selectMenuInteractions = new Collection();

    // Attach the ClusterClient
    this.cluster = new ClusterClient(this);
  }

  async init() {
    // Connect to MongoDB
    await mongooseConnect(this);

    // Initialize caches
    this.blacklistCache = new BlacklistCache(this);
    this.inviteCache = new InviteCache(this);

    // Load event listeners
    findEvents(this);

    // Load interaction handlers
    registerInteractions(this);

    const commands = findCommands(this);

    await this.login(process.env.DISCORD_BOT_TOKEN);

    this.once(Events.ClientReady, (client) => {
      registerCommands(client, commands);
      logger.info(`Bot is ready on cluster ${client.cluster.id}`);
    });

    // Handle shutdown
    const shutdown = async () => {
      try {
        // Closing MongoDB connections
        await this.userDB.close();
        await this.guildDB.close();
        await this.globalDB.close();
        await this.cardDB.close();

        await this.destroy();
        process.exit(0);
      } catch (err) {
        logger.error("Error during shutdown:", err);
        process.exit(1);
      }
    };

    process.on("SIGINT", async () => {
      logger.info("Received SIGINT. Initiating shutdown...");
      await shutdown();
    });

    process.on("SIGTERM", async () => {
      logger.info("Received SIGTERM. Initiating shutdown...");
      await shutdown();
    });
  }
}

module.exports = ExtendedClient;
