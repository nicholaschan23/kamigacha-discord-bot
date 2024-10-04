const { SlashCommandSubcommandBuilder } = require("discord.js");
const Logger = require("@utils/Logger");

const logger = new Logger("Binder rename command");

module.exports = {
  category: "public/binder",
  data: new SlashCommandSubcommandBuilder()
    .setName("rename")
    .setDescription("Rename a binder.")
    .addStringOption((option) => option.setName("old-name").setDescription("Current name of the binder.").setRequired(true))
    .addStringOption((option) => option.setName("new-name").setDescription("New name of the binder.").setRequired(true)),

  async execute(client, interaction) {
    try {
      interaction.reply({ content: "This command is not implemented yet.", ephemeral: true });
    } catch (error) {
      logger.error(error.stack);
      interaction.reply({ content: "There was an issue renaming your binder. Please try again.", ephemeral: true });
    }
  },
};
