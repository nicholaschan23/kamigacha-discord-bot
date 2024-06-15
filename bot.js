const { Client, Collection, Events, GatewayIntentBits, Partials } = require("discord.js");
const assert = require("assert");
const path = require("path");
const findEvents = require("./src/utils/initialization/findEvents");
const registerInteractions = require("./src/utils/initialization/registerInteractions");
const findCommands = require("./src/utils/initialization/findCommands");
const registerCommands = require("./src/utils/initialization/registerCommands");
const mongooseConnect = require("./src/database/mongodb/mongooseConnect");

const BlacklistCache = require("./src/utils/cache/BlacklistCache");

const envFile = ".env";
require("dotenv").config({ path: path.join(__dirname, envFile) });
assert(process.env.TOKEN, "A Discord bot token for is required.");

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
  partials: [Partials.Channel, Partials.GuildMember, Partials.Message, Partials.Reaction, Partials.User],
});

(async () => {
  try {
    // Connect to MongoDB
    await mongooseConnect(client);

    // Initialize caches
    client.blacklistCache = new BlacklistCache(client);

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
    });
  } catch (error) {
    console.error("Failed to initialize the bot:", error);
  }
})();
