const Logger = require("../../utils/Logger");
const logger = new Logger("Autocomplete Interaction");

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
