const { SlashCommandBuilder } = require("discord.js");
const gacha = require("../../utils/gacha")

module.exports = {
  category: "public",
  data: new SlashCommandBuilder()
    .setName("multi-pull")
    .setDescription("Perform a gacha pull to receive a random character.")
    .addIntegerOption(option => 
      option
        .setName("amount")
        .setDescription("Number of pulls to perform")
        .setMinValue(1)
        .setMaxValue(10)
        .setRequired(false)
    ),

  async execute(client, interaction) {
    const amount = interaction.options.getInteger("amount") || 1;
    const results = [];

    for (let i = 0; i < amount; i++) {
      results.push(gacha.getRandomRarity());
    }

    interaction.reply(`${results.join(", ")}`);
  },
};
