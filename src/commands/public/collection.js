const { SlashCommandBuilder } = require("discord.js");
const CollectionModel = require("../../database/mongodb/models/card/collection");
const CollectionButtonPages = require("../../utils/pages/CollectionButtonPages");

module.exports = {
  category: "public",
  data: new SlashCommandBuilder()
    .setName("collection")
    .setDescription("Display a card collection.")
    .addUserOption((option) => option.setName("user").setDescription("The player's collection to view. Omit to view yours.")),

  async execute(client, interaction) {
    const user = interaction.options.getUser("user") || interaction.user;

    try {
      // Fetch user's collection
      const collectionDocument = await CollectionModel(client).findOne({ userId: user.id }).populate("cardsOwned");
      if (!collectionDocument || collectionDocument.cardsOwned.length == 0) {
        return interaction.reply({ content: "That player has no collection.", ephemeral: true });
      }

      // Can't view another player's collection if it's private
      if (collectionDocument.isPrivate && user.id !== interaction.user.id) {
        return interaction.reply({ content: "That player's collection is private.", ephemeral: true });
      }

      const bp = new CollectionButtonPages(interaction, collectionDocument);
      bp.publishPages();
    } catch (error) {
      console.error("Error fetching user card codes:", error);
      interaction.reply({ content: "An error occurred while fetching that card collection.", ephemeral: true });
    }
  },
};
