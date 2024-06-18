const { SlashCommandBuilder } = require("discord.js");
const CardGenerator = require("../../utils/gacha/CardGenerator");

module.exports = {
  category: "public",
  data: new SlashCommandBuilder().setName("pull").setDescription("Perform a gacha pull to receive a random character."),

  async execute(client, interaction) {
    const cardGen = new CardGenerator(client, interaction.user.id, interaction.guild.id)
    // Get card pull
    const results = await cardGen.cardPull(10);
    

    // Display result
    interaction.reply(cardGen.cardModels.toString());
    // interaction.reply(cardGen.cardModels);
  },
};
