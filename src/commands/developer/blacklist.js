const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const utils = require("../../utils");
const logger = new utils.Logger("Blacklist command");
const ModeratorModel = require("../../database/mongodb/models/global/moderator");

module.exports = {
  category: "developer",
  data: new SlashCommandBuilder()
    .setName("blacklist")
    .setDescription("Blacklist a user.")
    .addUserOption((option) => option.setName("user").setDescription("Who to blacklist.").setRequired(true))
    .addStringOption((option) => option.setName("reason").setDescription("Reason for blacklist.").setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

  async execute(client, interaction) {
    const blacklistUser = interaction.options.getUser("user");
    const blacklistUserID = blacklistUser.id;
    const moderatorUserID = interaction.user.id;
    const reason = interaction.options.getString("reason");

    // Must be moderator to use this command
    const userIsMod = await ModeratorModel(client).findOne({ userID: moderatorUserID });
    if (!userIsMod) {
      return await interaction.reply({ content: `You do not have access to this command.`, ephemeral: true });
    }

    // You can't backlist bots
    if (blacklistUser.bot) {
      return await interaction.reply({ content: `Please input a valid user, not a bot.`, ephemeral: true });
    }

    // You can't blacklist moderators
    const blacklistUserIsMod = await ModeratorModel(client).findOne({ userID: blacklistUser.id });
    if (blacklistUserIsMod) {
      return await interaction.reply({ content: `That user cannot be blacklisted.`, ephemeral: true });
    }

    // Check if user is already blacklisted
    if (client.blacklistCache.isBlacklisted(blacklistUser.id)) {
      return await interaction.reply({ content: `User is already blacklisted. Reason: ${client.blacklistCache.getReason(user.id)}` });
    }

    // Reason can only be length of 300
    if (reason.length > 300) {
      return await interaction.reply({ content: `Reason must be less than 300 characters.`, ephemeral: true });
    }

    // Blacklist the user
    try {
      await client.blacklistCache.addToBlacklist(blacklistUserID, moderatorUserID, reason);
      return interaction.reply({ content: `${blacklistUser} has been blacklisted. Reason: ${reason}`, allowedMentions: { parse: [] } });
    } catch (error) {
      logger.error(error);
      return interaction.reply({ content: `Error occurred when blacklisting the user.` });
    }
  },
};
