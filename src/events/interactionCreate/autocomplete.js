const utils = require("../../utils");
const logger = new utils.Logger("Autocomplete Interaction");

module.exports = {
  async call(client, interaction) {
    if (!interaction.isAutocomplete()) return;
    
    const request = client.autocompleteInteractions.get(interaction.commandName);
    if (!request) return;

    try {
      await request.execute(client, interaction);
    } catch (error) {
      logger.error(error);
      return Promise.reject(error);
    }
  },
};
