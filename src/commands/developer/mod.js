const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const config = require("../../config");
const utils = require("../../utils");
const logger = new utils.Logger("Mod command");
const ModeratorModel = require("../../database/mongodb/models/global/moderator");

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
    if (config.developer.userID && interaction.user.id !== config.developer.userID) {
      return await interaction.reply({ content: `You do not have access to this command.`, ephemeral: true });
    }

    // Check if the user is already a moderator
    const userIsMod = await ModeratorModel(client).findOne({ userID: user.id });
    if (userIsMod) {
      return await interaction.reply({ content: `This user is already a moderator.`, ephemeral: true });
    }

    // Promote the user to moderator
    try {
      const newModerator = new (ModeratorModel(client))({
        userID: user.id,
      });
      await newModerator.save();
      return interaction.reply({ content: `${user} has been promoted to moderator.` });
    } catch (error) {
      logger.error(error);
      return interaction.reply({ content: `An error occurred while promoting the user to moderator.`, ephemeral: true });
    }
  },
};