const { SlashCommandSubcommandBuilder } = require("discord.js");
const { isValidFilterLabel } = require("../../../utils/gacha/format");
const { capitalizeFirstLetter } = require("../../../utils/stringUtils");
const FilterModel = require("../../../database/mongodb/models/user/filter");
const Logger = require("../../../utils/Logger");
const logger = new Logger("Filters emoji command");

module.exports = {
  category: "public/filters",
  data: new SlashCommandSubcommandBuilder()
    .setName("rename")
    .setDescription("Rename a collection filter.")
    .addStringOption((option) => option.setName("old-label").setDescription("Current name of filter to rename.").setRequired(true))
    .addStringOption((option) => option.setName("new-label").setDescription("New name to assign to filter.").setRequired(true)),

  async execute(client, interaction) {
    await interaction.deferReply();

    const oldLabel = capitalizeFirstLetter(interaction.options.getString("old-label").replace(/\s+/g, " "));
    if (!isValidFilterLabel(oldLabel)) {
      return interaction.editReply({ content: "That filter does not exist." });
    }

    const newLabel = capitalizeFirstLetter(interaction.options.getString("new-label").replace(/\s+/g, " "));
    if (!isValidFilterLabel(newLabel)) {
      return interaction.editReply({ content: `Please input a valid label. It can only contain letters, numbers, and spaces.` });
    }

    try {
      // Find the filter document for the user
      const filterDocument = await FilterModel().findOne({ userId: interaction.user.id });

      // Handle case where no filter data exists
      if (!filterDocument) {
        return interaction.reply({ content: `You do not have any filters.` });
      }

      // Check if the new filter already exists
      const duplicateFilter = filterDocument.filterList.some((label) => label.label === newLabel);
      if (duplicateFilter) {
        return interaction.editReply({ content: `The **${newLabel}** filter already exists.` });
      }

      // Find the index of the old filter in the filterList array
      const oldFilterIndex = filterDocument.filterList.findIndex((label) => label.label === oldLabel);
      if (oldFilterIndex === -1) {
        return interaction.editReply({ content: `The **${oldLabel}** filter does not exist.` });
      }

      // Extract old emoji and quantity
      const { emoji: emoji, label: label, filter: filter } = filterDocument.filterList[oldFilterIndex];

      // Remove the old filter
      await FilterModel().findOneAndUpdate(
        { userId: interaction.user.id },
        {
          $pull: { filterList: { label: oldLabel } },
        }
      );

      // Add the new filter with sorted order
      await FilterModel().findOneAndUpdate(
        { userId: interaction.user.id },
        {
          $push: {
            filterList: {
              $each: [{ emoji: emoji, label: newLabel, filter: filter }],
              $sort: { tag: 1 }, // Sort by tag alphabetically
            },
          },
        } // Update
      );

      interaction.editReply({ content: `Successfully updated **${oldLabel}** to **${newLabel}**!` });
    } catch (error) {
      logger.error(error.stack);
      interaction.editReply({ content: `There was an issue renaming your filter. Please try again.` });
    }
  },
};
