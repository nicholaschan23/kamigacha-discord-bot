const utils = require("../../utils");
const logger = new utils.Logger("Button interaction");
const messages = require("../../assets/messages");

module.exports = {
  async call(client, interaction) {
    if (!interaction.isButton()) return;

    const command = client.buttonInteractions.get(interaction.customId);
    if (!command) return;

    try {
      await command.execute(client, interaction);
    } catch (error) {
      logger.error(error);
      return interaction.reply({
        content: messages.BUTTON_ERROR,
        ephemeral: true,
      });
    }
  },
};
