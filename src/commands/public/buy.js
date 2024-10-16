const { SlashCommandBuilder } = require("discord.js");
const Logger = require("@utils/Logger");

const logger = new Logger("Buy command");

module.exports = {
  category: "public",
  data: new SlashCommandBuilder()
    .setName("buy")
    .setDescription("Purchase an item.")
    .addStringOption((option) => option.setName("name").setDescription("Name of the item to purchase.").setRequired(true))
    .addNumberOption((option) => option.setName("quantity").setDescription("Amount of the item to purchase. (Default: 1)"),),

  async execute(client, interaction) {
    try {
      interaction.reply({ content: "This command is not implemented yet.", ephemeral: true });
    } catch (error) {
      logger.error(error.stack);
      interaction.reply({ content: "There was an issue purchasing your card pack. Please try again.", ephemeral: true });
    }
  },
};
