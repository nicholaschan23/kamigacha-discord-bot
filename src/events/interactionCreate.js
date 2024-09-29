const { Events } = require("discord.js");
const config = require("@config");
const BlacklistCache = require("@database/redis/cache/blacklist");
const InviteCache = require("@database/redis/cache/invite");
const Logger = require("@utils/Logger");
const autocomplete = require("./interactionCreate/autocomplete");
const command = require("./interactionCreate/command");

const logger = new Logger("Interaction Create");

module.exports = {
  event: Events.InteractionCreate,
  type: "on",

  async call(client, interaction) {
    try {
      const userId = interaction.user.id;

      if (userId !== config.developer.userId) {
        const isBlacklisted = await BlacklistCache.isUserBlacklisted(userId);
        if (isBlacklisted) {
          const reason = await BlacklistCache.getDocument(userId).reason;
          return interaction.reply({
            content: `**You are blacklisted from playing KamiGacha.** Reason: ${reason}`,
            ephemeral: true,
          });
        }

        const isInvited = await InviteCache.isUserInvited(userId);
        if (isInvited) {
          return interaction.reply({
            content:
              "✨ **Gate of the Gods: Enter KamiGacha**\n" +
              "Located on the far shores, an ornamental torii gate stands tall.** Step through the torii gate into a world of the divine, and join your friends in KamiGacha, a trading card game accessible only through a personal invitation.",
            ephemeral: true,
          });
        }
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
