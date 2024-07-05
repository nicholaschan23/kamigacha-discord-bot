const { SlashCommandBuilder } = require("discord.js");
const CardGenerator = require("../../utils/gacha/CardGenerator");
const getMultiPullMsg = require("../../assets/messages/card/multiPullMsg");
const config = require("../../config");

module.exports = {
  category: "public",
  data: new SlashCommandBuilder().setName("multi-pull").setDescription("Perform a gacha multi-pull to receive 10 random characters."),

  async execute(client, interaction) {
    await interaction.deferReply();

    const cg = new CardGenerator(client, interaction.user.id, interaction.guild.id, config.multiPullRate);
    await cg.cardPull(10);

    try {
      const message = await getMultiPullMsg(cg.cardData);
      interaction.editReply(message);
    } catch (err) {
      console.error(err.stack);
      interaction.editReply({ content: "There was an error performing the card Multi-Pull.", ephemeral: true });
    }
  },
};
