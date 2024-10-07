const { SlashCommandBuilder } = require("discord.js");
const getPullMsg = require("@assets/messages/card/pullMsg");
const config = require("@config");
const CardGenerator = require("@utils/gacha/CardGenerator");

module.exports = {
  category: "public",
  data: new SlashCommandBuilder().setName("pull").setDescription("Perform a gacha pull to receive a random character."),

  async execute(client, interaction) {
    await interaction.deferReply();

    const cg = new CardGenerator(interaction.user.id, interaction.guild.id, config.pullRate);
    await cg.cardPull(1);

    try {
      const message = await getPullMsg(cg.cardData[0]);
      interaction.editReply(message);
    } catch (err) {
      console.error(err.stack);
      interaction.editReply({ content: "There was an error performing the card Pull.", ephemeral: true });
    }
  },
};
