const { Events } = require("discord.js");
const messages = require("../assets/messages");

module.exports = {
  event: Events.InteractionCreate,
  type: "on",

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
      console.error(error);
      return interaction.reply({
        content: messages.SELECTMENU_ERROR,
        ephemeral: true,
      });
    }
  },
};
