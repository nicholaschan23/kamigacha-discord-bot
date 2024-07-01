const { Events } = require("discord.js");
const Logger = require("../utils/Logger");
const logger = new Logger("Interaction Create");
const autocomplete = require("./interactionCreate/autocomplete");
const button = require("./interactionCreate/button");
const command = require("./interactionCreate/command");
const modal = require("./interactionCreate/modal");
const selectMenu = require("./interactionCreate/selectMenu");

module.exports = {
  event: Events.InteractionCreate,
  type: "on",

  async call(client, interaction) {
    try {
    // Check if the user is blacklisted
    if (client.blacklistCache.isBlacklisted(interaction.user.id)) {
      return interaction.reply({
        content: `You are blacklisted from using this bot. Reason: ${client.blacklistCache.getReason(interaction.user.id)}`,
        ephemeral: true,
      });
    }

    // Determine interaction type and call the appropriate handler
      if (interaction.isAutocomplete()) {
        await autocomplete.call(client, interaction);
      } else if (interaction.isButton()) {
        await button.call(client, interaction);
      } else if (interaction.isChatInputCommand()) {
        await command.call(client, interaction);
      } else if (interaction.isModalSubmit()) {
        await modal.call(client, interaction);
      } else if (interaction.isStringSelectMenu()) {
        await selectMenu.call(client, interaction);
      }
    } catch (error) {
      logger.error(error);
      return interaction.reply({
        content: "There was an error processing the interaction.",
        ephemeral: true,
      });
    }
  },
};
