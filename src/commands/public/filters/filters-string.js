const { SlashCommandSubcommandBuilder } = require("discord.js");
const { isValidFilterLabel, isValidFilter } = require("../../../utils/gacha/format");
const FilterModel = require("../../../database/mongodb/models/user/filter");
const Logger = require("../../../utils/Logger");
const logger = new Logger("Filters emoji command");

module.exports = {
  category: "public/filters",
  data: new SlashCommandSubcommandBuilder()
    .setName("string")
    .setDescription("Change the filter string of a collection filter.")
    .addStringOption((option) => option.setName("label").setDescription("Name of filter.").setRequired(true))
    .addStringOption((option) => option.setName("string").setDescription("New string of filters.").setRequired(true)),

  async execute(client, interaction) {
    await interaction.deferReply();

    const label = interaction.options.getString("label").replace(/\s+/g, " ");
    if (!isValidFilterLabel(label)) {
      return interaction.editReply({ content: "That filter does not exist." });
    }

    const filter = interaction.options.getString("string").toLowerCase().replace(/\s+/g, " ");
    if (!isValidFilter(filter)) {
      return interaction.editReply({ content: `Please input a valid emoji. It can only be a default Discord emoji.` });
    }

    try {
      const filterDocument = await FilterModel(client).findOne(
        { userId: interaction.user.id, "filterList.label": new RegExp(`^${label}$`, "i") }, // Filter
        { "filterList.$": 1 } // Projection to only include the matched sub-document
      );
      if (!filterDocument) {
        return interaction.editReply({ content: "That filter does not exist." });
      }

      // Extract the actual label
      const actualLabel = filterDocument.filterList[0].label;

      // No duplicate filters
      const duplicateFilter = filterDocument.filterList.find((option) => option.filter === filter);
      if (duplicateFilter) {
        return interaction.editReply({ content: "That filter string already exists." });
      }

      // Save filter
      await FilterModel(client).findOneAndUpdate(
        { userId: interaction.user.id, "filterList.label": actualLabel },
        { $set: { "filterList.$.filter": filter } },
        { new: true }
      );

      interaction.editReply({ content: `Successfully updated filter string to \`${filter}\`!` });
    } catch (error) {
      logger.error(error.stack);
      interaction.editReply({ content: `There was an issue changing the filter string for your filter. Please try again.` });
    }
  },
};
