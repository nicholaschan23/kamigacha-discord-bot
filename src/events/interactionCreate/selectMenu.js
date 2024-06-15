const utils = require("../../utils");
const logger = new utils.Logger("Select menu");
const messages = require("../../assets/messages");

module.exports = {
  async call(client, interaction) {
    if (!interaction.isStringSelectMenu()) return;

    const command = client.selectMenuInteractions.get(interaction.customId);
    if (!command) {
      return interaction.reply({
        content: messages.SELECTMENU_ERROR,
        ephemeral: true,
      });
    }

    try {
      await command.execute(client, interaction);
    } catch (error) {
      logger.error(error);
      return interaction.reply({
        content: messages.SELECTMENU_ERROR,
        ephemeral: true,
      });
    }
  },
};
