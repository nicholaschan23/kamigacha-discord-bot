const { SlashCommandSubcommandBuilder } = require("discord.js");
const Logger = require("@utils/Logger");

const logger = new Logger("Binder add cards command");

module.exports = {
  category: "public/binder/add",
  data: new SlashCommandSubcommandBuilder()
    .setName("cards")
    .setDescription("Add cards to a binder.")
    .addStringOption((option) => option.setName("codes").setDescription("List of card codes separated by commas.").setRequired(true))
    .addStringOption((option) => option.setName("name").setDescription("Name of the binder. Omit to add to your most recent edited binder.").setRequired(false)),

  async execute(client, interaction) {
    try {
      interaction.reply({ content: "This command is not implemented yet.", ephemeral: true });
    } catch (error) {
      logger.error(error.stack);
      interaction.reply({ content: "There was an issue adding cards to your binder. Please try again.", ephemeral: true });
    }
  },
};