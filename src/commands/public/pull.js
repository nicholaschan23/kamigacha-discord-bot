const { SlashCommandBuilder } = require("discord.js");
const gacha = require("../../utils/gacha");

module.exports = {
  category: "public",
  data: new SlashCommandBuilder().setName("pull").setDescription("Perform a gacha pull to receive a random character."),

  async execute(client, interaction) {
    const rarity = gacha.getCardPull();

    interaction.reply(rarity);
  },
};
