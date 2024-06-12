const { SlashCommandBuilder, ActionRowBuilder } = require("discord.js");
const helpEmbed = require("../../assets/embeds/help/helpEmbed");
const helpSelectMenu = require("../../assets/selectMenu/helpSelectMenu");
const cancelButton = require("../../assets/buttons/cancelButton");

module.exports = {
  category: "public",
  data: new SlashCommandBuilder().setName("help").setDescription("Display all commands available to you."),

  async execute(client, interaction) {
    const row1 = new ActionRowBuilder().addComponents(helpSelectMenu);
    const row2 = new ActionRowBuilder().addComponents(cancelButton);

    return interaction.reply({ embeds: [helpEmbed], components: [row1, row2] });
  },
};
