const { SlashCommandSubcommandBuilder } = require("discord.js");
const { isValidFilterLabel } = require("../../../utils/gacha/format");
const FilterModel = require("../../../database/mongodb/models/user/filter");
const Logger = require("../../../utils/Logger");
const logger = new Logger("Filters delete command");

module.exports = {
  category: "public/filters",
  data: new SlashCommandSubcommandBuilder()
    .setName("delete")
    .setDescription("Delete a collection filter.")
    .addStringOption((option) => option.setName("label").setDescription("Label of the filter to delete.").setRequired(true)),

  async execute(client, interaction) {
    await interaction.deferReply();

    const label = interaction.options.getString("label").replace(/\s+/g, " ");
    if (!isValidFilterLabel(label)) {
      return interaction.editReply({ content: "That label does not exist." });
    }

    try {
      const filterDocument = await FilterModel(client).findOne(
        { userId: interaction.user.id, "filterList.label": new RegExp(`^${label}$`, "i") }, // Filter
        { "filterList.$": 1 } // Projection to only include the matched sub-document
      );

      // Handle if document doesn't exist or if the field was undefined
      if (!filterDocument) {
        return interaction.editReply({ content: `That label does not exist.` });
      }

      // Extract the actual label
      const actualLabel = filterDocument.filterList[0].label;

      const updatedDocument = await FilterModel(client).findOneAndUpdate(
        { userId: interaction.user.id }, // Filter
        { $pull: { "filterList.label": actualLabel } }, // Update
        { new: true }
      );

      interaction.editReply({ content: `Successfully deleted the filter **${actualLabel}**!` });
    } catch (error) {
      logger.error(error.stack);
      interaction.editReply({ content: `There was an issue deleting your filter. Please try again.` });
    }
  },
};
