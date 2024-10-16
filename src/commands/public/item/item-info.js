const { SlashCommandSubcommandBuilder } = require("discord.js");
const RedisClient = require("@database/redis/RedisClient");
const Logger = require("@utils/Logger");

const logger = new Logger("Item info command");
const redis = RedisClient.connection;

module.exports = {
  category: "public/item",
  data: new SlashCommandSubcommandBuilder()
    .setName("info")
    .setDescription("View item info.")
    .addStringOption((option) => option.setName("item").setDescription("Item name to view info on.").setRequired(true)),

  async execute(client, interaction) {
    try {
      interaction.reply({ content: "This command is not implemented yet.", ephemeral: true });
    } catch (error) {
      logger.error(error.stack);
      interaction.reply({ content: "There was an issue viewing the card pack info. Please try again.", ephemeral: true });
    }
  },
};