const { SlashCommandSubcommandBuilder } = require("discord.js");
const Logger = require("@utils/Logger");

const logger = new Logger("Binder view command");

module.exports = {
  category: "public/binder",
  data: new SlashCommandSubcommandBuilder()
    .setName("view")
    .setDescription("View a binder.")
    .addStringOption((option) => option.setName("name").setDescription("Name of the binder. Omit to view most recent edited binder.").setRequired(false)),

  async execute(client, interaction) {
    try {
      interaction.reply({ content: "This command is not implemented yet.", ephemeral: true });
    } catch (error) {
      logger.error(error.stack);
      interaction.reply({ content: "There was an issue viewing your binder. Please try again.", ephemeral: true });
    }
  },
};
