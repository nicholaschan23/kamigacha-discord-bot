const { Events } = require("discord.js");

module.exports = {
  event: Events.InteractionCreate,
  type: "on",

  async call(client, interaction) {
    if (!interaction.isAutocomplete()) return;

    const request = client.autocompleteInteractions.get(interaction.commandName);
    if (!request) return;

    try {
      await request.execute(client, interaction);
    } catch (error) {
      console.error(error);
      return Promise.reject(error);
    }
  },
};
