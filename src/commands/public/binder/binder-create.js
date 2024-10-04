const { SlashCommandSubcommandBuilder } = require("discord.js");
const Logger = require("@utils/Logger");

const logger = new Logger("Binder create command");

module.exports = {
  category: "public/binder",
  data: new SlashCommandSubcommandBuilder()
    .setName("create")
    .setDescription("Create a binder.")
    .addStringOption((option) => option.setName("name").setDescription("Name of the binder.").setRequired(true)),

  async execute(client, interaction) {
    try {
      interaction.reply({ content: "This command is not implemented yet.", ephemeral: true });
    } catch (error) {
      logger.error(error.stack);
      interaction.reply({ content: "There was an issue creating your binder. Please try again.", ephemeral: true });
    }
  },
};
