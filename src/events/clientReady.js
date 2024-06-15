const { Events } = require("discord.js");
const utils = require("../utils");
const logger = new utils.Logger("Client Ready");

module.exports = {
  event: Events.ClientReady,
  type: "once",

  async call(client) {
    const guildSize = client.guilds.cache.size;
    logger.success(`Connected! ${client.user.username} is currently on ${guildSize} server${guildSize > 1 ? "s" : ""}`);
  },
};
