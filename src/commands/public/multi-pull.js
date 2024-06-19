const { SlashCommandBuilder } = require("discord.js");
const CardGenerator = require("../../utils/gacha/CardGenerator");
const viewMultiPullEmbed = require("../../assets/embeds/card/viewMultiPull");

module.exports = {
  category: "public",
  data: new SlashCommandBuilder().setName("multi-pull").setDescription("Perform a gacha multi-pull to receive 10 random characters."),

  async execute(client, interaction) {
    await interaction.deferReply();

    const cg = new CardGenerator(client, interaction.user.id, interaction.guild.id);
    await cg.cardPull(10);

    interaction.editReply({ embeds: [viewMultiPullEmbed(cg.cardData)] });
  },
};
