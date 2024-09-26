const { Events } = require("discord.js");

const RedisCache = require("@database/redis");

const Logger = require("@utils/Logger");
const logger = new Logger("Interaction Create");

const autocomplete = require("./interactionCreate/autocomplete");
const command = require("./interactionCreate/command");

module.exports = {
  event: Events.InteractionCreate,
  type: "on",

  async call(client, interaction) {
    try {
      if (RedisCache.isUserInvited(client, interaction.user.id)) {
        return interaction.reply({
          content:
            "✨ **KamiGacha is a divine realm where only the chosen may enter.** To gain access, you must find a powerful deity willing to take you in as their apprentice. Seek out a master among the gods, forge bonds of friendship, and unlock the secrets of KamiGacha together. Only through their guidance will you be able to step into this legendary world!",
          ephemeral: true,
        });
      }

      // Check if the user is blacklisted
      // if (client.blacklistCache.isBlacklisted(interaction.user.id)) {
      //   return interaction.reply({
      //     content: `You are blacklisted from using this bot. Reason: ${client.blacklistCache.getReason(interaction.user.id)}`,
      //     ephemeral: true,
      //   });
      // }

      // Determine interaction type and call the appropriate handler
      if (interaction.isChatInputCommand()) {
        await command.call(client, interaction);
      } else if (interaction.isAutocomplete()) {
        await autocomplete.call(client, interaction);
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
