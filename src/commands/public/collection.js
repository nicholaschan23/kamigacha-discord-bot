const { SlashCommandBuilder } = require("discord.js");
const CollectionModel = require("@database/mongodb/models/card/collection");
const FilterModel = require("@database/mongodb/models/user/filter");
const CollectionPages = require("@root/src/pagination/CollectionPages");
const CollectionFilter = require("@models/CollectionFilter");

module.exports = {
  category: "public",
  data: new SlashCommandBuilder()
    .setName("collection")
    .setDescription("View a card collection.")
    .addUserOption((option) => option.setName("user").setDescription("Player's collection to view. (Default: view yours)"))
    .addStringOption((option) => option.setName("filters").setDescription("Search filters to apply to collection.")),

  async execute(client, interaction) {
    const user = interaction.options.getUser("user") ?? interaction.user;
    const filters = interaction.options.getString("filters")?.toLowerCase().replace(",", "");

    try {
      // Fetch user's collection
      const collectionDocument = await CollectionModel.findOne({ userId: user.id }).populate("cardsOwned");
      if (!collectionDocument || collectionDocument.cardsOwned.length == 0) {
        return interaction.reply({ content: "That player has no collection.", ephemeral: true });
      }

      // Can't view another player's collection if it's private
      if (collectionDocument.isPrivate && user.id !== interaction.user.id) {
        return interaction.reply({ content: "That player's collection is private.", ephemeral: true });
      }

      const filterDocument = await FilterModel.findOneAndUpdate({ userId: user.id }, { $setOnInsert: { userId: user.id } }, { new: true, upsert: true });
      if (!filterDocument.filterList) {
        return interaction.reply({ content: "An error occurred while fetching that player's collection filters.", ephemeral: true });
      }

      // Prepare the filter menu
      const filterMenu =
        (filters && filters === "order=modified") || filters === "order=wish" || filters === "wish<>" || filters === "tag=none"
          ? [new CollectionFilter("⌛", "Custom", filters), ...filterDocument.filterList]
          : filterDocument.filterList;

      const bp = new CollectionPages(interaction, collectionDocument, filters, filterMenu);
      await bp.init();
      bp.publishPages();
    } catch (error) {
      console.error("Error fetching user card codes:", error);
      interaction.reply({ content: "An error occurred while fetching that card collection.", ephemeral: true });
    }
  },
};
