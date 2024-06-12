const { SlashCommandSubcommandBuilder } = require("discord.js");
const byeModal = require("../../../../assets/modals/byeModal");
const utils = require("../../../../utils");
const logger = new utils.Logger("Test Bye");

module.exports = {
  category: "developer/test/say",
  data: new SlashCommandSubcommandBuilder().setName("bye").setDescription("Say bye."),

  async execute(client, interaction) {
    await interaction.showModal(byeModal).catch((error) => {
      logger.error(`Failed to send modal to: ${interaction.user.tag}`, error);
      return;
    });
    // return interaction.reply({ content: `Bye.` });
  },
};
