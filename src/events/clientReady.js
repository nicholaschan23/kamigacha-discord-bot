const { Events } = require("discord.js");
const utils = require("../utils");
const logger = new utils.Logger("Client ready");

module.exports = {
  event: Events.ClientReady,
  type: "once",

  async call(client) {
    const list = await client.cluster.broadcastEval((c) => c.guilds.cache.size);
    const guildSize = list.reduce((prev, val) => prev + val, 0);
    logger.success(`Connected! ${client.user.username} is currently on ${guildSize} server${guildSize > 1 ? "s" : ""}`);
  },
};
