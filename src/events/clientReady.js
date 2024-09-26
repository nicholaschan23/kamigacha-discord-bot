const { Events } = require("discord.js");
const { getInfo } = require("discord-hybrid-sharding");
const Logger = require("../utils/Logger");
const logger = new Logger("Client ready");

// Initialization helpers
const findCommands = require("../client/findCommands");
const registerCommands = require("../client/registerCommands");

module.exports = {
  event: Events.ClientReady,
  type: "once",

  async call(client) {
    // Register commands when client is ready
    const commands = findCommands(client);
    await registerCommands(client, commands);

    // Broadcast evaluation to count guilds per shard
    const results = await client.cluster.broadcastEval("this.guilds.cache.size");

    // Print totals
    const totalClusters = client.cluster.count;
    const totalShards = getInfo().TOTAL_SHARDS;
    const totalGuilds = results.reduce((sum, count) => sum + count, 0);
    logger.info(`Total clusters: ${totalClusters}`);
    logger.info(`Total shards: ${totalShards}`);
    logger.info(`Total guilds: ${totalGuilds}`);
  },
};
