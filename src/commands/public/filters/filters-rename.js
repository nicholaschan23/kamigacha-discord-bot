const { SlashCommandSubcommandBuilder } = require("discord.js");
const FilterModel = require("@database/mongodb/models/user/filter");
const FilterCache = require("@database/redis/cache/collectionFilter");
const Logger = require("@utils/Logger");
const { isValidFilterLabel } = require("@utils/string/validation");
const { capitalizeFirstLetter } = require("@utils/string/format");

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

    // Get and validate old label
    const oldLabel = capitalizeFirstLetter(interaction.options.getString("old-label").replace(/\s+/g, " "));
    if (!isValidFilterLabel(oldLabel)) {
      interaction.editReply({ content: "That filter does not exist." });
      return;
    }

    if (["Modified", "Most wished", "Show wish count", "Untagged"].includes(oldLabel)) {
      interaction.editReply({ content: "You cannot rename a default filter." });
      return;
    }

    // Get and validate new label
    const newLabel = capitalizeFirstLetter(interaction.options.getString("new-label").replace(/\s+/g, " "));
    if (!isValidFilterLabel(newLabel)) {
      interaction.editReply({ content: `Please input a valid label. It can only contain letters, numbers, and spaces.` });
      return;
    }

    let oldFilter;
    try {
      const filterDocument = await FilterCache.getDocument(interaction.user.id);

      // Check if user has any filters
      if (filterDocument.filterList.length === 0) {
        interaction.reply({ content: `You do not have any filters.` });
        return;
      }

      // Check for duplicate new label
      const duplicateLabel = filterDocument.filterList.some((label) => label.label === newLabel);
      if (duplicateLabel) {
        interaction.editReply({ content: `The **${newLabel}** filter already exists.` });
        return;
      }

      // Find the old filter
      const oldFilterIndex = filterDocument.filterList.findIndex((label) => label.label === oldLabel);
      if (oldFilterIndex === -1) {
        interaction.editReply({ content: `The **${oldLabel}** filter does not exist.` });
        return;
      }
      oldFilter = filterDocument.filterList[oldFilterIndex];
    } catch (error) {
      logger.error(error.stack);
      interaction.editReply({ content: "There was an issue renaming your filter. Please try again." });
      return;
    }

    // Start a session for transaction
    const session = await FilterModel.startSession();
    session.startTransaction();

    try {
      const { emoji, label: oldLabel, filter } = oldFilter;

      // Remove the old filter
      let filterDocument = await FilterModel.findOneAndUpdate(
        { userId: interaction.user.id, "filterList.label": oldLabel },
        { $pull: { filterList: { label: oldLabel } } },
        { new: true, session: session }
      );
      if (!filterDocument) {
        throw new Error();
      }

      // Add the new filter
      filterDocument = await FilterModel.findOneAndUpdate(
        { userId: interaction.user.id, "filterList.label": { $ne: newLabel } },
        {
          $push: {
            filterList: {
              $each: [{ emoji, label: newLabel, filter }],
              $sort: { label: 1 },
            },
          },
        },
        { new: true, session: session }
      );
      if (!filterDocument) {
        throw new Error();
      }

      // Commit the transaction
      await session.commitTransaction();
      session.endSession();
    } catch (error) {
      // Abort the transaction in case of error
      await session.abortTransaction();
      session.endSession();
      interaction.editReply({ content: `There was an issue renaming your filter. Please try again.` });
      return;
    }

    await FilterCache.cache(interaction.user.id, filterDocument);
    interaction.editReply({ content: `Successfully updated **${oldLabel}** to **${newLabel}**!` });
  },
};
