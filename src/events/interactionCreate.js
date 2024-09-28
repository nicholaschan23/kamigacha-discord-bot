const { Events } = require("discord.js");

const InviteCache = require("@database/redis/cache/invite");
const BlacklistCache = require("@database/redis/cache/blacklist");

const Logger = require("@utils/Logger");
const logger = new Logger("Interaction Create");

const autocomplete = require("./interactionCreate/autocomplete");
const command = require("./interactionCreate/command");

module.exports = {
  event: Events.InteractionCreate,
  type: "on",

  async call(client, interaction) {
    try {
      const response = await BlacklistCache.isUserBlacklisted(interaction.user.id);
      if (response !== false) {
        return interaction.reply({
          content: `**You are blacklisted from playing KamiGacha.** Reason: ${response.reason}`,
          ephemeral: true,
        });
      }

      if (await InviteCache.isUserInvited(interaction.user.id)) {
        return interaction.reply({
          content:
            "✨ **KamiGacha is invitation only.**",
          ephemeral: true,
        });
      }

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
