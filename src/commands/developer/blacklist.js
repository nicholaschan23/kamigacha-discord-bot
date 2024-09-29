const { SlashCommandBuilder } = require("discord.js");
const BlacklistCache = require("@database/redis/cache/blacklist");
const ModeratorCache = require("@database/redis/cache/moderator");
const Logger = require("@utils/Logger");

const logger = new Logger("Blacklist command");

module.exports = {
  category: "developer",
  data: new SlashCommandBuilder()
    .setName("blacklist")
    .setDescription("Blacklist a user.")
    .addUserOption((option) => option.setName("user").setDescription("Who to blacklist.").setRequired(true))
    .addStringOption((option) => option.setName("reason").setDescription("Reason for blacklist.").setRequired(true)),

  async execute(client, interaction) {
    const blacklistUser = interaction.options.getUser("user");
    const blacklistUserId = blacklistUser.id;
    const moderatorUserId = interaction.user.id;
    const reason = interaction.options.getString("reason");

    // Must be moderator to use this command
    const userIsMod = await ModeratorCache.isUserMod(moderatorUserId);
    if (!userIsMod) {
      interaction.reply({ content: `You do not have access to this command.`, ephemeral: true });
      return;
    }

    // You can't blacklist yourself or bots
    if (receiver.id == interaction.user.id || receiver.bot) {
      interaction.reply({ content: `Please input a valid user.`, ephemeral: true });
      return;
    }

    // You can't blacklist moderators
    const blacklistUserIsMod = await ModeratorCache.isUserMod(blacklistUser.id);
    if (blacklistUserIsMod) {
      interaction.reply({ content: `That user cannot be blacklisted.`, ephemeral: true });
      return;
    }

    // Check if user is already blacklisted
    const alreadyBlacklisted = await BlacklistCache.isUserBlacklisted(blacklistUserId);
    if (alreadyBlacklisted) {
      const reason = await BlacklistCache.getDocument(blacklistUserId).reason;
      interaction.reply({ content: `${blacklistUser} is already blacklisted. Reason: ${reason}`, ephemeral: true });
      return;
    }

    // Reason can only be length of 300
    if (reason.length > 300) {
      interaction.reply({ content: `Reason must be less than 300 characters.`, ephemeral: true });
      return;
    }

    // Blacklist the user
    try {
      await BlacklistCache.addUser(blacklistUserId, moderatorUserId, reason);
      interaction.reply({ content: `${blacklistUser} has been blacklisted. Reason: ${reason}`, allowedMentions: { parse: [] } });
    } catch (error) {
      logger.error(error);
      interaction.reply({ content: `Error occurred when blacklisting the user.` });
    }
  },
};
