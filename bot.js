const { GatewayIntentBits, Partials } = require("discord.js");
const { getInfo } = require("discord-hybrid-sharding");
const assert = require("assert");
const path = require("path");
const ExtendedClient = require("./src/utils/initialization/ExtendedClient");

require("dotenv").config({ path: path.join(__dirname, ".env") });
assert(process.env.TOKEN, "A Discord bot token is required");

const client = new ExtendedClient({
  intents: [
    GatewayIntentBits.Guilds, 
    GatewayIntentBits.GuildMembers, 
    GatewayIntentBits.GuildMessages, 
    GatewayIntentBits.MessageContent
  ],
  partials: [
    Partials.Channel, 
    Partials.GuildMember, 
    Partials.Message, 
    Partials.Reaction, 
    Partials.User
  ],
  shards: getInfo().SHARD_LIST,
  shardCount: getInfo().TOTAL_SHARDS,
});

client.cluster.on("ready", async () => {
  await client.init();
});
