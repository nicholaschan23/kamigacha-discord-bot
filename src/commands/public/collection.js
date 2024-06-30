const { SlashCommandBuilder } = require("discord.js");
const CollectionModel = require("../../database/mongodb/models/card/collection");
const CollectionButtonPages = require("../../utils/pages/CollectionButtonPages");
const { parseFilterString } = require("../../utils/gacha/filter");

module.exports = {
  category: "public",
  data: new SlashCommandBuilder()
    .setName("collection")
    .setDescription("View a card collection.")
    .addUserOption((option) => option.setName("user").setDescription("Player's collection to view. Omit to view yours."))
    .addStringOption((option) => option.setName("filters").setDescription("Search filters to apply to collection.")),

  async execute(client, interaction) {
    const user = interaction.options.getUser("user") || interaction.user;
    const filters = interaction.options.getString("filters")?.toLowerCase().replace(",", "");

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

      const bp = new CollectionButtonPages(interaction, collectionDocument, filters);
      bp.publishPages();
    } catch (error) {
      console.error("Error fetching user card codes:", error);
      interaction.reply({ content: "An error occurred while fetching that card collection.", ephemeral: true });
    }
  },
};
