const { SlashCommandSubcommandBuilder } = require("discord.js");
const { isValidFilterLabel } = require("../../../utils/gacha/format");
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

    let oldLabel = interaction.options.getString("old-label").replace(/\s+/g, " ");;
    if (!isValidFilterLabel(oldLabel)) {
      return interaction.editReply({ content: "That filter does not exist." });
    }

    const newLabel = interaction.options.getString("new-label").replace(/\s+/g, " ");;
    if (!isValidFilterLabel(newLabel)) {
      return interaction.editReply({ content: `Please input a valid label. It can only contain letters, numbers, and spaces.` });
    }

    try {
      const filterDocument = await FilterModel(client).findOne(
        { userId: interaction.user.id, "filterList.label": new RegExp(`^${oldLabel}$`, "i") }, // Filter
        { "filterList.$": 1 } // Projection to only include the matched sub-document
      );
      if (!filterDocument) {
        return interaction.editReply({ content: "That filter does not exist." });
      }

      // Extract the actual label
      oldLabel = filterDocument.filterList[0].label;

      // Check if the old label exists
      const oldLabelIndex = filterDocument.filterList.findIndex((option) => option.label.toLowerCase() === oldLabel.toLowerCase());
      if (oldLabelIndex === -1) {
        return interaction.editReply({ content: "That filter does not exist." });
      }

      // Check for duplicate new label
      const duplicateLabel = filterDocument.filterList.find((option) => option.label.toLowerCase() === newLabel.toLowerCase());
      if (duplicateLabel) {
        return interaction.editReply({ content: "That label is already being used for another filter." });
      }

      // Perform the update: remove old label and add new label, then sort
      await FilterModel(client).updateOne(
        { userId: interaction.user.id },
        {
          $pull: { filterList: { label: new RegExp(`^${oldLabel}$`, "i") } },
          $push: {
            filterList: {
              $each: [{ emoji: filterDocument.filterList[0].emoji, label: newLabel, filter: filterDocument.filterList[0].filter }],
              $sort: { label: 1 }
            }
          }
        }
      );

      interaction.editReply({ content: `Successfully updated **${oldLabel}** to **${newLabel}**!` });
    } catch (error) {
      logger.error(error.stack);
      interaction.editReply({ content: `There was an issue renaming your filter. Please try again.` });
    }
  },
};
