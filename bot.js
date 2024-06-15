const { Client, Collection, Events, GatewayIntentBits, Partials } = require("discord.js");
const { ClusterClient, getInfo } = require("discord-hybrid-sharding");
const assert = require("assert");
const path = require("path");
const utils = require("./src/utils");
const logger = new utils.Logger("Client");
const findEvents = require("./src/utils/initialization/findEvents");
const registerInteractions = require("./src/utils/initialization/registerInteractions");
const findCommands = require("./src/utils/initialization/findCommands");
const registerCommands = require("./src/utils/initialization/registerCommands");
const mongooseConnect = require("./src/database/mongodb/mongooseConnect");

const BlacklistCache = require("./src/utils/cache/BlacklistCache");
const InviteCache = require("./src/utils/cache/InviteCache");

require("dotenv").config({ path: path.join(__dirname, ".env") });
assert(process.env.TOKEN, "A Discord bot token is required");

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
  partials: [Partials.Channel, Partials.GuildMember, Partials.Message, Partials.Reaction, Partials.User],
  shards: getInfo().SHARD_LIST,
  shardCount: getInfo().TOTAL_SHARDS,
});

// Attach the ClusterClient to the Client
client.cluster = new ClusterClient(client);

client.cluster.on("ready", async () => {
  try {
    // Connect to MongoDB
    await mongooseConnect(client);

    // Initialize caches
    client.blacklistCache = new BlacklistCache(client);
    client.inviteCache = new InviteCache(client);

    // Load event listeners
    findEvents(client);

    // Collections
    client.cooldowns = new Collection();
    client.commands = new Collection();
    client.autocompleteInteractions = new Collection();
    client.buttonInteractions = new Collection();
    client.modalInteractions = new Collection();
    client.selectMenuInteractions = new Collection();

    // Load interaction handlers
    registerInteractions(client);

    const commands = findCommands(client);

    await client.login(process.env.TOKEN);

    client.once(Events.ClientReady, (client) => {
      registerCommands(client, commands);
      logger.info(`Bot is ready on cluster ${client.cluster.id}`);
    });

    // Handle shutdown
    const shutdown = async () => {
      try {
        // Closing MongoDB connections
        await client.userDB.close();
        await client.guildDB.close();
        await client.globalDB.close();

        await client.destroy();
        process.exit(0);
      } catch (err) {
        logger.error("Error during shutdown:", err);
        process.exit(1);
      }
    };
    process.on("SIGINT", async () => {
      logger.info("Received SIGINT. Initiating shutdown...");
      shutdown();
    });
    process.on("SIGTERM", async () => {
      logger.info("Received SIGTERM. Initiating shutdown...");
      shutdown();
    });
  } catch (error) {
    logger.error("Failed to initialize the bot:", error);
  }
});
