const { SlashCommandSubcommandBuilder } = require("discord.js");
const Logger = require("@utils/Logger");

const logger = new Logger("Binder list command");

module.exports = {
  category: "public/binder",
  data: new SlashCommandSubcommandBuilder()
    .setName("list")
    .setDescription("View a list of binder.")
    .addUserOption((option) => option.setName("user").setDescription("Player's wish list to view. (Default: view yours)")),

  async execute(client, interaction) {
    const user = interaction.options.getUser("user") ?? interaction.user;

    try {
      interaction.reply({ content: "This command is not implemented yet.", ephemeral: true });
    } catch (error) {
      logger.error(error.stack);
      interaction.reply({ content: "There was an issue listing your binders. Please try again.", ephemeral: true });
    }
  },
};
