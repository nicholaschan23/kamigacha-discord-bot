const { SlashCommandBuilder } = require("discord.js");
const CardGenerator = require("../../utils/gacha/CardGenerator");

module.exports = {
  category: "public",
  data: new SlashCommandBuilder().setName("pull").setDescription("Perform a gacha pull to receive a random character."),

  async execute(client, interaction) {
    await interaction.deferReply();

    const cardGen = new CardGenerator(client, interaction.user.id, interaction.guild.id)
    // Get card pull
    const results = await cardGen.cardPull(1);
    

    // Display result
    interaction.editReply("hi");
    // interaction.reply(cardGen.cardModels);
  },
};
