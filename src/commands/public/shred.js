const { SlashCommandBuilder } = require("discord.js");
const CollectionModel = require("@database/mongodb/models/card/collection");
const FilterModel = require("@database/mongodb/models/user/filter");
const CollectionFilter = require("@models/CollectionFilter");
const ShredPages = require("@utils/pages/ShredPages");

module.exports = {
  category: "public",
  data: new SlashCommandBuilder()
    .setName("shred")
    .setDescription("Rip multiple cards into materials for crafting.")
    .addStringOption((option) => option.setName("filters").setDescription("Filters to apply to collection. Omit to select from drop down.")),

  async execute(client, interaction) {
    await interaction.deferReply();

    const userId = interaction.user.id;
    const filters = interaction.options.getString("filters")?.toLowerCase().replace(",", "");

    try {
      // Fetch user's collection
      const collectionDocument = await CollectionModel.findOne({ userId: userId }).populate("cardsOwned");
      if (!collectionDocument || collectionDocument.cardsOwned.length == 0) {
        interaction.editReply({ content: "There are no cards to shred in your collection.", ephemeral: true });
        return;
      }

      const filterDocument = await FilterModel.findOneAndUpdate({ userId: userId });
      if (!filterDocument) {
        interaction.editReply({ content: "An error occurred while fetching that player's collection filters.", ephemeral: true });
        return;
      }

      // Prepare the filter menu
      const filterMenu = filters ? [new CollectionFilter("⌛", "Custom", filters), ...filterDocument.filterList] : filterDocument.filterList;

      const bp = new ShredPages(interaction, collectionDocument, filters, filterMenu);

      await bp.init();
      bp.publishPages(true);
    } catch (error) {
      console.error("Error fetching user card codes:", error);
      interaction.editReply({ content: "An error occurred while fetching that card collection.", ephemeral: true });
    }
  },
};
