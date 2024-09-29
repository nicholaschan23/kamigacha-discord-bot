const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const config = require("@config");
const ModeratorCache = require("@database/redis/cache/moderator");
const Logger = require("@utils/Logger");
const logger = new Logger("Mod command");

module.exports = {
  category: "developer",
  data: new SlashCommandBuilder()
    .setName("mod")
    .setDescription("Promote a user to moderator.")
    .addUserOption((option) => option.setName("user").setDescription("The user to promote to moderator.").setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(client, interaction) {
    const user = interaction.options.getUser("user");

    // Only the developer can use this command
    if (interaction.user.id !== config.developer.userId) {
      interaction.reply({ content: `You do not have access to this command.`, ephemeral: true });
      return;
    }

    // Check if the user is already a moderator
    const userIsMod = await ModeratorCache.isUserMod(user.id);
    if (userIsMod) {
      interaction.reply({ content: `This user is already a moderator.`, ephemeral: true });
      return;
    }

    // Promote the user to moderator
    try {
      await ModeratorCache.addUser(user.id);
      interaction.reply({ content: `${user} has been promoted to moderator.`, allowedMentions: { parse: [] } });
    } catch (error) {
      logger.error(error);
      interaction.reply({ content: `An error occurred while promoting the user to moderator.`, ephemeral: true });
    }
  },
};
