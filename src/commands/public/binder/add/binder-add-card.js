const { SlashCommandSubcommandBuilder } = require("discord.js");
const Logger = require("@utils/Logger");

const logger = new Logger("Binder add card command");

module.exports = {
  category: "public/binder/add",
  data: new SlashCommandSubcommandBuilder()
    .setName("card")
    .setDescription("Add a card to a binder.")
    .addStringOption((option) => option.setName("code").setDescription("Card codes.").setRequired(true))
    .addStringOption((option) => option.setName("name").setDescription("Name of the binder. Omit to add to your most recent edited binder.").setRequired(false))
    .addStringOption((option) => option.setName("page").setDescription("Page number to add card.").setRequired(true))
    .addStringOption((option) => option.setName("slot").setDescription("Slot on the page to add card.").setRequired(true)),

  async execute(client, interaction) {
    try {
      interaction.reply({ content: "This command is not implemented yet.", ephemeral: true });
    } catch (error) {
      logger.error(error.stack);
      interaction.reply({ content: "There was an issue adding a card to your binder. Please try again.", ephemeral: true });
    }
  },
};
