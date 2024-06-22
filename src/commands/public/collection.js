const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const CardModel = require("../../database/mongodb/models/card/card");
const CollectionModel = require("../../database/mongodb/models/card/collection");
const { formatCardInfoPage } = require("../../utils/gacha/format");
const buttonPages = require("../../utils/buttonPages");

module.exports = {
  category: "public",
  data: new SlashCommandBuilder()
    .setName("collection")
    .setDescription("Display a card collection.")
    .addUserOption((option) => option.setName("user").setDescription("The person's collection to view.")),

  async execute(client, interaction) {
    const user = interaction.options.getUser("user") || interaction.user;

    try {
      // Fetch user's collection
      const collectionDocument = await CollectionModel(client).findOne({ userID: user.id }).populate("cardsOwned");
      if (!collectionDocument || collectionDocument.cardsOwned.length == 0) {
        return interaction.reply({ content: "That user has no collection.", ephemeral: true });
      }

      // Can't view another person's collection if it's private
      if (collectionDocument.isPrivate && user.id !== interaction.user.id) {
        return interaction.reply({ content: "This collection is private.", ephemeral: true });
      }

      // Split the list of cards into chunks of 10
      const chunkArray = (array, chunkSize) => {
        const result = [];
        for (let i = 0; i < array.length; i += chunkSize) {
          result.push(array.slice(i, i + chunkSize));
        }
        return result;
      };

      // Split the list of cards into chunks of 10
      const cardChunks = chunkArray(collectionDocument.cardsOwned.reverse(), 10);

      // Create page embeds
      let pages = [];
      for (let i = 0; i < cardChunks.length; i++) {
        const embed = new EmbedBuilder()
          .setTitle(`Card Collection`)
          .setDescription(`Cards owned by ${user}\n\n` + formatCardInfoPage(cardChunks[i]))
          .setFooter({ text: `Page ${i + 1}` });
        pages.push(embed);
      }

      buttonPages(interaction, pages, collectionDocument.isPrivate);
    } catch (error) {
      console.error("Error fetching user card codes:", error);
      interaction.reply({ content: "An error occurred while fetching that card collection.", ephemeral: true });
    }
  },
};
