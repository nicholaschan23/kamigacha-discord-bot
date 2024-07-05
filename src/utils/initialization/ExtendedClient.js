const { Client, Collection, Events } = require("discord.js");
const { ClusterClient } = require("discord-hybrid-sharding");

// Database
const mongooseConnect = require("../../database/mongodb/mongooseConnect");
const { loadS3Structures, getCardStructure, getSleeveStructure } = require("../../database/aws/s3Structure");

// Initialization helpers
const findEvents = require("./findEvents");
const registerInteractions = require("./registerInteractions");
const findCommands = require("./findCommands");
const registerCommands = require("./registerCommands");

// Util
const Logger = require("../Logger");
const logger = new Logger("Client");
const config = require("../../config");
const { ensureDirExists } = require("../fileSystem");
const BlacklistCache = require("../../utils/cache/BlacklistCache");
const InviteCache = require("../../utils/cache/InviteCache");

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
    await ensureDirExists(config.DEFAULT_SLEEVED_PATH + "/foo");
    await ensureDirExists(config.RAW_SCALED_PATH + "/foo");

    // Fetch all cards from S3 Bucket
    await loadS3Structures();
    const [jsonCards, seriesKeys] = await getCardStructure();
    this.jsonCards = jsonCards;
    this.jsonCardsKeys = seriesKeys;

    // Fetch all sleeves from S3 Bucket
    const jsonSleeves = await getSleeveStructure();
    this.jsonSleeves = jsonSleeves;

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

    this.once(Events.ClientReady, async (client) => {
      await registerCommands(client, commands);
      logger.info(`Bot is ready on cluster ${client.cluster.id}`);
    });

    await this.login(process.env.DISCORD_BOT_TOKEN);

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
