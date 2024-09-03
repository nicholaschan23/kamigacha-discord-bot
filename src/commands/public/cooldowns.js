const { SlashCommandBuilder } = require("discord.js");
const SettingsModel = require("../../database/mongodb/models/user/settings");
const viewCooldownEmbed = require("../../assets/embeds/cooldown/viewCooldown");

module.exports = {
  category: "public",
  data: new SlashCommandBuilder().setName("cooldowns").setDescription("Display user cooldowns."),

  async execute(client, interaction) {
    await interaction.deferReply();
    const settingsDocument = await SettingsModel().findOneAndUpdate(
      { userId: interaction.user.id }, // Filter
      { $setOnInsert: { userId: interaction.user.id } }, // Update operation
      { new: true, upsert: true }
    );
    interaction.editReply({ embeds: [viewCooldownEmbed(settingsDocument)] });
  },
};
