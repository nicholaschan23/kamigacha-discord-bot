const { Events } = require("discord.js");
const Logger = require("../utils/Logger");
const logger = new Logger("Client ready");

module.exports = {
  event: Events.ClientReady,
  type: "once",

  async call(client) {
    // const list = await client.cluster.broadcastEval((c) => c.guilds.cache.size);
    // const guildCount = list.reduce((prev, val) => prev + val, 0);
    // logger.success(`Connected! ${client.user.username} is currently on shard ${client.shard.ids[0]} and is in ${guildCount} servers`);
    logger.success(`[Cluster ${client.cluster.id}] [Shard ${client.shard.ids[0]}] Connected!`);
  },
};
