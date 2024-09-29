const { Client, Collection } = require("discord.js");
const ShutdownManager = require("@utils/ShutdownManager");
const findEvents = require("./findEvents");
const MongooseClient = require("@database/mongodb/MongooseClient");
const RedisClient = require("@database/redis/RedisClient");
const Logger = require("../utils/Logger");

const logger = new Logger("Client");

class ExtendedClient extends Client {
  constructor(options) {
    super(options);

    // Collections
    this.commands = new Collection();
    this.cooldowns = new Collection();
    this.autocompleteInteractions = new Collection();
    // this.buttonInteractions = new Collection();
    // this.modalInteractions = new Collection();
    // this.selectMenuInteractions = new Collection();
  }

  async init() {
    // Connect to MongoDB for cloud database
    await MongooseClient.connect();
    await RedisClient.connect();

    // Load event listeners
    findEvents(this);

    ShutdownManager.register(async () => {
      await this.destroy();
      logger.info("Client has disconnected");
    });

    await this.login(process.env.DISCORD_BOT_TOKEN);
  }
}

module.exports = ExtendedClient;
