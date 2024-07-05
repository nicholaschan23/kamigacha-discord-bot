const { SlashCommandBuilder } = require("discord.js");
const CardGenerator = require("../../utils/gacha/CardGenerator");
const getMultiPullMsg = require("../../assets/messages/card/multiPullMsg");
const config = require("../../config");
const fs = require("fs");

module.exports = {
  category: "public",
  data: new SlashCommandBuilder().setName("multi-pull").setDescription("Perform a gacha multi-pull to receive 10 random characters."),

  async execute(client, interaction) {
    await interaction.deferReply();

    const cg = new CardGenerator(client, interaction.user.id, interaction.guild.id, config.multiPullRate);
    await cg.cardPull(10);

    try {
      const message = await getMultiPullMsg(cg.cardData);

      await interaction.editReply(message);
      fs.unlink(message.files[0], () => {});
    } catch (err) {
      console.error(err.stack);
      interaction.reply({ content: "There was an error performing the card Multi-Pull.", ephemeral: true });
    }
  },
};
