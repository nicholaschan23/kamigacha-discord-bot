const { SlashCommandBuilder, AttachmentBuilder } = require("discord.js");
const config = require("@config");
const CardGenerator = require("@utils/gacha/CardGenerator");
const { createCardGrid } = require("@graphics/createCardGrid");
const { getCardBorder } = require("@graphics/getCardBorder");

module.exports = {
  category: "public",
  data: new SlashCommandBuilder().setName("multi-pull").setDescription("Perform a gacha multi-pull to receive 10 random characters."),

  async execute(client, interaction) {
    await interaction.deferReply();

    const cg = new CardGenerator(interaction.user.id, interaction.guild.id, config.multiPullRate);
    await cg.cardPull(10);

    try {
      const cardList = cg.cardData;

      // Generating sleeveUrls and imageUrls arrays
      const imageUrls = cardList.map((card) => card.image);
      const borderPaths = cardList.map((card) => getCardBorder(card.rarity));
      const buffer = await createCardGrid(imageUrls, borderPaths);

      interaction.editReply({ content: `<@${cardList[0].ownerId}> did a 10-card multi-pull!`, files: [new AttachmentBuilder(buffer)] });
    } catch (err) {
      console.error(err.stack);
      interaction.editReply({ content: "There was an error performing the card Multi-Pull.", ephemeral: true });
    }
  },
};
