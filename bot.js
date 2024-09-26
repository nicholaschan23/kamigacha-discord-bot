require('module-alias/register');
const { GatewayIntentBits, Partials } = require("discord.js");
const { ClusterClient, getInfo } = require("discord-hybrid-sharding");
const ExtendedClient = require("@client/ExtendedClient");

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

client.cluster = new ClusterClient(client);
client.cluster.on("ready", async () => {
  await client.init();
});

module.exports = client;