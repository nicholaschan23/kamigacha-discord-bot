const { SlashCommandBuilder, AttachmentBuilder } = require("discord.js");
const config = require("@config");
const CardGenerator = require("@utils/gacha/CardGenerator");
const { createCard } = require("@utils/graphics/createCard");
const { getCardBorder } = require("@utils/graphics/getCardBorder");

module.exports = {
  category: "public",
  data: new SlashCommandBuilder().setName("pull").setDescription("Perform a gacha pull to receive a random character."),

  async execute(client, interaction) {
    await interaction.deferReply();

    const cg = new CardGenerator(interaction.user.id, interaction.guild.id, config.pullRate);
    await cg.cardPull(1);

    try {
      const card = cg.cardData[0];
      const buffer = await createCard(card.image, getCardBorder(card.rarity));
      interaction.editReply({ content: `<@${card.ownerId}> did a 1-card pull!`, files: [new AttachmentBuilder(buffer)] });
    } catch (err) {
      console.error(err.stack);
      interaction.editReply({ content: "There was an error performing the card Pull.", ephemeral: true });
    }
  },
};
