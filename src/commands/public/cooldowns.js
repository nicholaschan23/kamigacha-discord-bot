const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const SettingsModel = require("@database/mongodb/models/user/settings");

module.exports = {
  category: "public",
  data: new SlashCommandBuilder().setName("cooldowns").setDescription("Display user cooldowns."),

  async execute(client, interaction) {
    await interaction.deferReply();
    const settingsDocument = await SettingsModel.findOneAndUpdate(
      { userId: interaction.user.id }, // Filter
      { $setOnInsert: { userId: interaction.user.id } }, // Update operation
      { new: true, upsert: true }
    );

    const userId = settingsDocument.userId;
    const cdPull = settingsDocument.cooldownPull;
    const cdMultiPull = settingsDocument.cooldownMultiPull;
    const unixTimeNow = Math.floor(Date.now() / 1000);

    const embed = new EmbedBuilder()
      .setTitle("Cooldowns")
      .setDescription(
        `Showing cooldowns for <@${userId}>\n` +
          `\n` +
          `${cdPull <= unixTimeNow ? "**Pull** is currently available" : `**Pull** is available in <t:${cdPull}>`}\n` +
          `${cdPull <= unixTimeNow ? "**Multi-Pull** is currently available" : `**Multi-Pull** is available in <t:${cdMultiPull}>`}`
      );

    interaction.editReply({ embeds: [embed] });
  },
};
