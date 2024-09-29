const { SlashCommandSubcommandBuilder } = require("discord.js");
const FilterCache = require("@database/redis/cache/collectionFilter");
const { isValidFilterLabel } = require("../../../utils/string/validation");
const { capitalizeFirstLetter } = require("../../../utils/string/format");
const Logger = require("../../../utils/Logger");

const logger = new Logger("Filters rename command");

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
      interaction.editReply({ content: "That filter does not exist." });
      return;
    }

    const newLabel = capitalizeFirstLetter(interaction.options.getString("new-label").replace(/\s+/g, " "));
    if (!isValidFilterLabel(newLabel)) {
      interaction.editReply({ content: `Please input a valid label. It can only contain letters, numbers, and spaces.` });
      return;
    }

    try {
      // Find the filter document for the user
      const filterDocument = await FilterCache.getDocument(interaction.user.id);

      // Handle case where no filter data exists
      if (filterDocument.filterList.length === 0) {
        interaction.reply({ content: `You do not have any filters.` });
        return;
      }

      // Check if the new filter already exists
      const duplicateLabel = filterDocument.filterList.some((label) => label.label === newLabel);
      if (duplicateLabel) {
        interaction.editReply({ content: `The **${newLabel}** filter already exists.` });
        return;
      }

      // Find the index of the old filter in the filterList array
      const oldFilterIndex = filterDocument.filterList.findIndex((label) => label.label === oldLabel);
      if (oldFilterIndex === -1) {
        interaction.editReply({ content: `The **${oldLabel}** filter does not exist.` });
        return;
      }

      // Extract old emoji and quantity
      const { emoji: emoji, filter: filter } = filterDocument.filterList[oldFilterIndex];

      // Remove the old filter
      await FilterCache.deleteFilter(interaction.user.id, oldLabel);

      // Add the new filter with sorted order
      await FilterCache.addFilter(interaction.user.id, emoji, newLabel, filter);

      interaction.editReply({ content: `Successfully updated **${oldLabel}** to **${newLabel}**!` });
    } catch (error) {
      logger.error(error.stack);
      interaction.editReply({ content: `There was an issue renaming your filter. Please try again.` });
    }
  },
};
