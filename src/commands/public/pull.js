const { SlashCommandBuilder } = require("discord.js");
const CardGenerator = require("../../utils/gacha/CardGenerator");
const viewPullEmbed = require("../../assets/embeds/card/viewPull");
const config = require("../../config")

module.exports = {
  category: "public",
  data: new SlashCommandBuilder().setName("pull").setDescription("Perform a gacha pull to receive a random character."),

  async execute(client, interaction) {
    await interaction.deferReply();

    const cg = new CardGenerator(client, interaction.user.id, interaction.guild.id, config.pullRate);
    await cg.cardPull(1);

    interaction.editReply({ embeds: [viewPullEmbed(cg.cardData[0])] });
  },
};
