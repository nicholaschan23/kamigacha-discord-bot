const { Client, Collection, Events } = require("discord.js");
const { ClusterClient } = require("discord-hybrid-sharding");

// Database
const mongooseConnect = require("../../database/mongodb/mongooseConnect");
const { downloadFiles } = require("../../database/aws/downloadFiles");
const { getCardModel } = require("../../database/aws/preprocessing/cardModel");
const { getCharacterModel } = require("../../database/aws/preprocessing/characterModel");
const { getFormattedNames } = require("../../database/aws/preprocessing/formattedNames");
const { initCharacterDB } = require("../../database/mongodb/initialization/characterDB");
const { getSearchModel } = require("../../database/aws/preprocessing/searchModel");

// Initialization helpers
const findEvents = require("./findEvents");
const registerInteractions = require("./registerInteractions");
const findCommands = require("./findCommands");
const registerCommands = require("./registerCommands");

// Util
const Logger = require("../Logger");
const logger = new Logger("Client");
const config = require("../../config");
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
    await downloadFiles("customisations/boarders", config.IMAGES_PATH);

    // Fetch all cards from S3 Bucket
    const { model: jsonCards, keys: seriesKeys } = await getCardModel();
    this.jsonCards = jsonCards;
    this.jsonCardsKeys = seriesKeys;

    // Organize into unique characters
    const { model: jsonCharacters, keys: characterKeys } = await getCharacterModel(this.jsonCards, this.jsonCardsKeys);
    this.jsonCharacters = jsonCharacters;
    this.jsonCharacterKeys = characterKeys;

    // Map character and series names to hash table
    this.characterNameMap = await getFormattedNames(this.jsonCharacterKeys, config.CHARACTER_NAME_MAP_PATH);
    this.seriesNameMap = await getFormattedNames(this.jsonCardsKeys, config.SERIES_NAME_MAP_PATH);

    // Preprocess card search
    const { model: jsonSearches } = await getSearchModel(this.jsonCharacters, this.jsonCharacterKeys, this.characterNameMap, this.seriesNameMap);
    this.jsonSearches = jsonSearches;

    // Connect to MongoDB
    await mongooseConnect(this);

    await initCharacterDB(this);

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
