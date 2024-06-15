const utils = require("../../utils");
const logger = new utils.Logger("Modal submit");
const messages = require("../../assets/messages");

module.exports = {
  async call(client, interaction) {
    if (!interaction.isModalSubmit()) return;

    const command = client.modalInteractions.get(interaction.customId);
    if (!command) {
      return interaction.reply({
        content: messages.MODAL_ERROR,
        ephemeral: true,
      });
    }

    try {
      await command.execute(client, interaction);
    } catch (error) {
      logger.error(error);
      return interaction.reply({
        content: messages.MODAL_ERROR,
        ephemeral: true,
      });
    }
  },
};
