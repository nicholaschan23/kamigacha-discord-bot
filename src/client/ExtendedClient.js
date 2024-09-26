require('module-alias/register');
const shutdownManager = require("@utils/shutdownManager");
const { Client, Collection } = require("discord.js");

// Database
const mongooseConnect = require("@database/mongodb/mongooseConnect");
const { downloadFiles } = require("@database/aws/downloadFiles");
const { getCardModel } = require("@database/aws/preprocessing/cardModel");
const { getCharacterModel } = require("@database/aws/preprocessing/characterModel");
const { getFormattedNames } = require("@database/aws/preprocessing/formattedNames");
const { initCharacterDB } = require("@database/mongodb/initialization/characterDB");
const { getSearchModel } = require("@database/aws/preprocessing/searchModel");

// Initialization helpers
const findEvents = require("./findEvents");

// Util
const Logger = require("@utils/Logger");
const logger = new Logger("Client");
const config = require("@config");
const BlacklistCache = require("@utils/cache/BlacklistCache");
const InviteCache = require("@utils/cache/InviteCache");

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

    // Connect to MongoDB
    await mongooseConnect(this);

    await initCharacterDB(this);

    // Preprocess card search
    const { model: jsonSearches } = await getSearchModel(this.jsonCharacters, this.jsonCharacterKeys);
    this.jsonSearches = jsonSearches;

    // TODO: fix with Redis
    // Initialize caches
    this.blacklistCache = new BlacklistCache(this);
    this.inviteCache = new InviteCache(this);

    findEvents(this); // Load event listeners

    shutdownManager.register(async () => {
      await this.destroy();
      logger.info("Discord client closed");
    });

    await this.login(process.env.DISCORD_BOT_TOKEN);
  }
}

module.exports = ExtendedClient;
