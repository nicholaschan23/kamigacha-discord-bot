const { SlashCommandSubcommandBuilder } = require("discord.js");
const Logger = require("@utils/Logger");

const logger = new Logger("Binder remove cards command");

module.exports = {
  category: "public/binder/add",
  data: new SlashCommandSubcommandBuilder()
    .setName("cards")
    .setDescription("Remove cards from a binder.")
    .addStringOption((option) => option.setName("codes").setDescription("List of card codes separated by commas.").setRequired(true))
    .addStringOption((option) =>
      option.setName("name").setDescription("Name of the binder to remove cards from. (Default: last edited binder)").setRequired(false)
    ),

  async execute(client, interaction) {
    try {
      interaction.reply({ content: "This command is not implemented yet.", ephemeral: true });
    } catch (error) {
      logger.error(error.stack);
      interaction.reply({ content: "There was an issue removing cards from your binder. Please try again.", ephemeral: true });
    }
  },
};
